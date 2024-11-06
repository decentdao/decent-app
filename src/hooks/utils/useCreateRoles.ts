import { abis } from '@fractal-framework/fractal-contracts';
import { HatsModulesClient, HATS_MODULES_FACTORY_ADDRESS } from '@hatsprotocol/modules-sdk';
import { FormikHelpers } from 'formik';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Address,
  encodeFunctionData,
  encodePacked,
  getAddress,
  getContract,
  getCreate2Address,
  Hex,
  keccak256,
  zeroAddress,
} from 'viem';
import { usePublicClient } from 'wagmi';
import DecentAutonomousAdminTempAbi from '../../assets/abi/DecentAutonomousAdminTempAbi';
import DecentHatsModificationModuleAbi from '../../assets/abi/DecentHatsModificationModuleAbi';
import { DecentHatsTempAbi } from '../../assets/abi/DecentHatsTempAbi';
import GnosisSafeL2 from '../../assets/abi/GnosisSafeL2';
import { HatsAbi } from '../../assets/abi/HatsAbi';
import HatsAccount1ofNAbi from '../../assets/abi/HatsAccount1ofN';
import { HatsElectionsEligibilityAbi } from '../../assets/abi/HatsElectionsEligibilityAbi';

import {
  EditBadgeStatus,
  HatStruct,
  HatStructWithPayments,
  RoleFormValues,
  RoleHatFormValueEdited,
  SablierPaymentFormValues,
} from '../../components/pages/Roles/types';
import { DAO_ROUTES } from '../../constants/routes';
import { useFractal } from '../../providers/App/AppProvider';
import useIPFSClient from '../../providers/App/hooks/useIPFSClient';
import { useNetworkConfig } from '../../providers/NetworkConfig/NetworkConfigProvider';
import { useRolesStore } from '../../store/roles/useRolesStore';
import { CreateProposalMetadata, ProposalExecuteData } from '../../types';
import { SENTINEL_MODULE } from '../../utils/address';
import { prepareSendAssetsActionData } from '../../utils/dao/prepareSendAssetsProposalData';
import useSubmitProposal from '../DAO/proposal/useSubmitProposal';
import useCreateSablierStream from '../streams/useCreateSablierStream';
import {
  isElectionEligibilityModule,
  predictAccountAddress,
} from './../../store/roles/rolesStoreUtils';

function hatsDetailsBuilder(data: { name: string; description: string }) {
  return JSON.stringify({
    type: '1.0',
    data,
  });
}

async function uploadHatDescription(
  hatDescription: string,
  ipfsClient: {
    cat: (hash: string) => Promise<any>;
    add: (data: string) => Promise<any>;
  },
) {
  const response = await ipfsClient.add(hatDescription);
  return `ipfs://${response.Hash}`;
}

export default function useCreateRoles() {
  const {
    node: { safe, daoAddress, daoName },
  } = useFractal();
  const { hatsTree, hatsTreeId, getHat } = useRolesStore();
  const {
    addressPrefix,
    chain,
    contracts: {
      hatsProtocol,
      decentHatsCreationModule,
      decentHatsModificationModule,
      hatsAccount1ofNMasterCopy,
      erc6551Registry,
      keyValuePairs,
      sablierV2LockupLinear,
      zodiacModuleProxyFactory,
      decentAutonomousAdminV1MasterCopy,
      hatsElectionsEligibilityMasterCopy,
    },
  } = useNetworkConfig();

  const { t } = useTranslation(['roles', 'navigation', 'modals', 'common']);

  const { submitProposal } = useSubmitProposal();
  const { prepareBatchLinearStreamCreation, prepareFlushStreamTxs, prepareCancelStreamTxs } =
    useCreateSablierStream();
  const ipfsClient = useIPFSClient();
  const publicClient = usePublicClient();
  const navigate = useNavigate();

  const hatsModulesClient = useMemo(() => {
    if (!publicClient) {
      return null;
    }
    const client = new HatsModulesClient({
      publicClient,
    });
    return client;
  }, [publicClient]);

  const createHatStruct = useCallback(
    async (
      name: string,
      description: string,
      wearer: Address,
      isMutable: boolean,
      termEndDateTs: bigint,
    ): Promise<HatStruct> => {
      const details = await uploadHatDescription(
        hatsDetailsBuilder({
          name: name,
          description: description,
        }),
        ipfsClient,
      );

      return {
        maxSupply: 1,
        details,
        imageURI: '',
        isMutable,
        wearer,
        termEndDateTs,
      };
    },
    [ipfsClient],
  );

  const createHatStructWithPayments = useCallback(
    async (
      name: string,
      description: string,
      wearer: Address,
      payments: {
        totalAmount: bigint;
        asset: Address;
        startTimestamp: number;
        cliffTimestamp: number;
        endTimestamp: number;
      }[],
      termEndDateTs: bigint,
    ) => {
      if (daoAddress === null) {
        throw new Error('Can not create Hat Struct (with payments) without DAO Address');
      }

      const newHat = await createHatStruct(
        name,
        description,
        wearer,
        // @dev if termEndDateTs is not 0, then the role is termed and is not mutable
        termEndDateTs !== BigInt(0) ? false : true,
        termEndDateTs,
      );

      const newHatWithPayments: HatStructWithPayments = {
        ...newHat,
        sablierStreamsParams: payments.map(payment => ({
          sablier: sablierV2LockupLinear,
          sender: daoAddress,
          totalAmount: payment.totalAmount,
          asset: payment.asset,
          cancelable: true,
          transferable: true,
          timestamps: {
            start: payment.startTimestamp,
            cliff: payment.cliffTimestamp,
            end: payment.endTimestamp,
          },
          broker: { account: zeroAddress, fee: 0n },
        })),
      };

      return newHatWithPayments;
    },
    [createHatStruct, daoAddress, sablierV2LockupLinear],
  );

  const parseSablierPaymentsFromFormRolePayments = useCallback(
    (payments: SablierPaymentFormValues[]) => {
      return payments.map(payment => {
        if (
          !payment.amount?.bigintValue ||
          !payment.asset ||
          !payment.startDate ||
          !payment.endDate
        ) {
          throw new Error('Missing required payment information');
        }

        return {
          totalAmount: payment.amount.bigintValue,
          asset: payment.asset.address,
          startTimestamp: Math.floor(payment.startDate.getTime() / 1000),
          cliffTimestamp: payment.cliffDate ? Math.floor(payment.cliffDate.getTime() / 1000) : 0,
          endTimestamp: Math.floor(payment.endDate.getTime() / 1000),
        };
      });
    },
    [],
  );
  const parseRoleTermsFromFormRoleTerms = useCallback(
    (formRoleTerms: { termEndDate?: Date; nominee?: string }[]) => {
      return formRoleTerms.map(term => {
        if (term.termEndDate === undefined) {
          throw new Error('Term end date of added Role is undefined.');
        }
        if (term.nominee === undefined) {
          throw new Error('Nominee of added Role is undefined.');
        }
        return {
          termEndDateTs: BigInt(term.termEndDate.getTime() / 1000),
          nominatedWearers: [getAddress(term.nominee)],
        };
      });
    },
    [],
  );

  const createHatStructsForNewTreeFromRolesFormValues = useCallback(
    async (modifiedRoles: RoleHatFormValueEdited[]) => {
      return Promise.all(
        modifiedRoles.map(role => {
          if (role.name === undefined || role.description === undefined) {
            throw new Error('Hat name or description of added hat is undefined.');
          }

          if (role.wearer === undefined) {
            throw new Error('Hat wearer of added hat is undefined.');
          }
          const sablierPayments = parseSablierPaymentsFromFormRolePayments(role.payments ?? []);

          const [firstTerm] = parseRoleTermsFromFormRoleTerms(role.roleTerms ?? []);
          if (!firstTerm && role.isTermed) {
            throw new Error('First term is undefined');
          }

          // @note for new termed roles, we set the first wearer to the first nominee
          const wearer = role.isTermed
            ? getAddress(firstTerm.nominatedWearers[0])
            : getAddress(role.wearer);
          const termEndDateTs = role.isTermed ? firstTerm.termEndDateTs : BigInt(0);

          return createHatStructWithPayments(
            role.name,
            role.description,
            wearer,
            sablierPayments,
            termEndDateTs,
          );
        }),
      );
    },
    [
      createHatStructWithPayments,
      parseSablierPaymentsFromFormRolePayments,
      parseRoleTermsFromFormRoleTerms,
    ],
  );

  const predictSmartAccount = useCallback(
    async (hatId: bigint) => {
      if (!publicClient) {
        throw new Error('Public client is not set');
      }

      return predictAccountAddress({
        implementation: hatsAccount1ofNMasterCopy,
        chainId: BigInt(chain.id),
        tokenContract: hatsProtocol,
        tokenId: hatId,
        registryAddress: erc6551Registry,
        publicClient,
      });
    },
    [publicClient, hatsAccount1ofNMasterCopy, chain.id, hatsProtocol, erc6551Registry],
  );

  const getEnableDisableDecentHatsModuleData = useCallback((moduleAddress: Address) => {
    const enableDecentHatsModuleData = encodeFunctionData({
      abi: GnosisSafeL2,
      functionName: 'enableModule',
      args: [moduleAddress],
    });

    const disableDecentHatsModuleData = encodeFunctionData({
      abi: GnosisSafeL2,
      functionName: 'disableModule',
      args: [SENTINEL_MODULE, moduleAddress],
    });

    return { enableDecentHatsModuleData, disableDecentHatsModuleData };
  }, []);

  const prepareCreateTopHatProposalData = useCallback(
    async (proposalMetadata: CreateProposalMetadata, modifiedHats: RoleHatFormValueEdited[]) => {
      if (!daoAddress) {
        throw new Error('Can not create top hat without DAO Address');
      }

      if (!hatsModulesClient) {
        throw new Error('Cannot create Roles proposal without hatsModulesClient');
      }

      const { enableDecentHatsModuleData, disableDecentHatsModuleData } =
        getEnableDisableDecentHatsModuleData(decentHatsCreationModule);

      const topHat = {
        details: await uploadHatDescription(
          hatsDetailsBuilder({
            name: daoName || daoAddress,
            description: '',
          }),
          ipfsClient,
        ),
        imageURI: '',
      };

      const adminHat = {
        details: await uploadHatDescription(
          hatsDetailsBuilder({
            name: 'Admin',
            description: '',
          }),
          ipfsClient,
        ),
        imageURI: '',
        isMutable: true,
      };

      await hatsModulesClient.prepare();
      const module = hatsModulesClient.getModuleByImplementation(
        hatsElectionsEligibilityMasterCopy,
      );
      if (!module) {
        throw new Error('Could not find module');
      }
      const addedHats = await createHatStructsForNewTreeFromRolesFormValues(modifiedHats);
      const createAndDeclareTreeData = encodeFunctionData({
        abi: abis.DecentHatsCreationModule,
        functionName: 'createAndDeclareTree',
        args: [
          {
            hatsProtocol,
            erc6551Registry: erc6551Registry,
            hatsModuleFactory: HATS_MODULES_FACTORY_ADDRESS,
            moduleProxyFactory: zodiacModuleProxyFactory,
            keyValuePairs: getAddress(keyValuePairs),
            decentAutonomousAdminImplementation: decentAutonomousAdminV1MasterCopy,
            hatsAccountImplementation: hatsAccount1ofNMasterCopy,
            hatsElectionsEligibilityImplementation: hatsElectionsEligibilityMasterCopy,
            topHat,
            adminHat,
            hats: addedHats,
          },
        ],
      });

      return {
        targets: [daoAddress, decentHatsCreationModule, daoAddress],
        calldatas: [
          enableDecentHatsModuleData,
          createAndDeclareTreeData,
          disableDecentHatsModuleData,
        ],
        metaData: proposalMetadata,
        values: [0n, 0n, 0n],
      };
    },
    [
      daoAddress,
      daoName,
      decentHatsCreationModule,
      decentAutonomousAdminV1MasterCopy,
      hatsElectionsEligibilityMasterCopy,
      erc6551Registry,
      hatsAccount1ofNMasterCopy,
      hatsProtocol,
      keyValuePairs,
      decentHatsCreationModule,
      zodiacModuleProxyFactory,
    ],
  );

  const prepareNewHatTxs = useCallback(
    async (formRole: RoleHatFormValueEdited) => {
      if (formRole.name === undefined || formRole.description === undefined) {
        throw new Error('Role name or description is undefined.');
      }

      if (formRole.wearer === undefined) {
        throw new Error('Role member is undefined.');
      }

      if (!hatsTree) {
        throw new Error('Cannot create new hat without hats tree');
      }

      if (!daoAddress) {
        throw new Error('Cannot create new hat without DAO address');
      }

      const [firstTerm] = parseRoleTermsFromFormRoleTerms(formRole.roleTerms ?? []);
      if (!!firstTerm && !formRole.isTermed) {
        throw new Error('First term is defined, but role is not termed');
      }
      const firstWearer = !!firstTerm ? firstTerm.nominatedWearers[0] : formRole.resolvedWearer;
      const termEndDateTs = !!firstTerm ? firstTerm.termEndDateTs : BigInt(0);

      if (firstWearer === undefined) {
        throw new Error('Cannot create new hat without wearer');
      }
      const hatStruct = await createHatStructWithPayments(
        formRole.name,
        formRole.description,
        firstWearer,
        parseSablierPaymentsFromFormRolePayments(formRole.payments ?? []),
        termEndDateTs,
      );

      const { enableDecentHatsModuleData, disableDecentHatsModuleData } =
        getEnableDisableDecentHatsModuleData(decentHatsModificationModule);

      const createNewRoleData = encodeFunctionData({
        abi: abis.DecentHatsModificationModule,
        functionName: 'createRoleHats',
        args: [
          {
            hatsProtocol,
            erc6551Registry,
            hatsAccountImplementation: hatsAccount1ofNMasterCopy,
            hatsModuleFactory: HATS_MODULES_FACTORY_ADDRESS,
            hatsElectionsEligibilityImplementation: hatsElectionsEligibilityMasterCopy,
            adminHatId: BigInt(hatsTree.adminHat.id),
            hats: [hatStruct],
            topHatId: BigInt(hatsTree.topHat.id),
            topHatAccount: hatsTree.topHat.smartAddress,
          },
        ],
      });

      return [
        {
          targetAddress: daoAddress,
          calldata: enableDecentHatsModuleData,
        },
        {
          targetAddress: decentHatsModificationModule,
          calldata: createNewRoleData,
        },
        {
          targetAddress: daoAddress,
          calldata: disableDecentHatsModuleData,
        },
      ];
    },
    [
      hatsTree,
      daoAddress,
      parseRoleTermsFromFormRoleTerms,
      createHatStructWithPayments,
      parseSablierPaymentsFromFormRolePayments,
      getEnableDisableDecentHatsModuleData,
      decentHatsModificationModule,
      hatsProtocol,
      erc6551Registry,
      hatsAccount1ofNMasterCopy,
      hatsElectionsEligibilityMasterCopy,
    ],
  );
  // @todo  move to updated 'useMasterCopy` hook
  const isDecentAutonomousAdminV1 = useCallback(
    async (address: Address) => {
      if (!publicClient) {
        throw new Error('Public client is not set');
      }
      const decentAutonomousAdminV1Contract = getContract({
        address: address,
        abi: DecentAutonomousAdminTempAbi,
        client: publicClient,
      });
      const DECENT_AUTONOMOUS_ADMIN_V1_INTERFACE_ID = '0x0ac4a8e8';
      return decentAutonomousAdminV1Contract.read.supportsInterface([
        DECENT_AUTONOMOUS_ADMIN_V1_INTERFACE_ID,
      ]);
    },
    [publicClient],
  );

  /**
   * @dev Checks if Admin Hat is already being worn by an instance of DecentAutonomousAdminV1
   * @dev if not, prepares transactions to deploy a new instance of DecentAutonomousAdminV1
   * @dev and mint a new hat
   * @returns an array of transactions to create a deploy Decent Autonomous Admin and mint a new hat
   */
  const prepareAdminHatTxs = useCallback(
    async (
      adminHatWearerAddress: Address | undefined,
      adminHatId: Hex,
      isAnyRoleTermed: boolean,
    ) => {
      if (!isAnyRoleTermed) {
        return [];
      }

      if (!!adminHatWearerAddress && (await isDecentAutonomousAdminV1(adminHatWearerAddress))) {
        return [];
      }

      // deploy new instance of DecentAutonomousAdminV1 through ModuleProxyFactory
      const salt = keccak256(
        encodePacked(
          ['bytes32', 'uint256'],
          [keccak256(encodePacked(['bytes'], [ERC6551_REGISTRY_SALT])), BigInt(adminHatId)],
        ),
      );
      const deployDecentAutonomousAdminV1Calldata = encodeFunctionData({
        abi: abis.ModuleProxyFactory,
        functionName: 'deployModule',
        args: [
          decentAutonomousAdminV1MasterCopy,
          encodeFunctionData({
            abi: DecentAutonomousAdminTempAbi,
            functionName: 'setUp',
            args: [zeroAddress],
          }),
          BigInt(salt),
        ],
      });
      const predictedDecentAutonomousAdminV1Address = getCreate2Address({
        from: zodiacModuleProxyFactory,
        salt: salt,
        bytecodeHash: keccak256(encodePacked(['bytes'], [deployDecentAutonomousAdminV1Calldata])),
      });

      // @todo max supply check and increase if maxed
      const mintAdminHat = {
        targetAddress: hatsProtocol,
        calldata: encodeFunctionData({
          abi: HatsAbi,
          functionName: 'mintHat',
          args: [BigInt(adminHatId), predictedDecentAutonomousAdminV1Address],
        }),
      };
      const deployDecentAutonomousAdminV1Tx = {
        targetAddress: zodiacModuleProxyFactory,
        calldata: deployDecentAutonomousAdminV1Calldata,
      };

      return [deployDecentAutonomousAdminV1Tx, mintAdminHat];
    },
    [
      decentAutonomousAdminV1MasterCopy,
      hatsProtocol,
      zodiacModuleProxyFactory,
      isDecentAutonomousAdminV1,
    ],
  );

  const createBatchLinearStreamCreationTx = useCallback(
    (formStreams: (SablierPaymentFormValues & { recipient: Address })[]) => {
      const preparedStreams = formStreams.map(stream => {
        if (
          !stream.asset ||
          !stream.startDate ||
          !stream.endDate ||
          !stream.amount?.bigintValue ||
          stream.amount.bigintValue <= 0n
        ) {
          throw new Error('Form Values inValid', {
            cause: stream,
          });
        }

        return {
          recipient: stream.recipient,
          startDateTs: Math.floor(stream.startDate.getTime() / 1000),
          endDateTs: Math.ceil(stream.endDate.getTime() / 1000),
          cliffDateTs: Math.floor((stream.cliffDate?.getTime() ?? 0) / 1000),
          totalAmount: stream.amount.bigintValue,
          assetAddress: stream.asset.address,
        };
      });

      return prepareBatchLinearStreamCreation(preparedStreams);
    },
    [prepareBatchLinearStreamCreation],
  );

  const getMemberChangedStreamsWithFundsToClaim = useCallback((formHat: RoleHatFormValueEdited) => {
    return (formHat.payments ?? []).filter(
      payment => (payment?.withdrawableAmount ?? 0n) > 0n && !payment.isCancelling,
    );
  }, []);

  const getNewStreamsFromFormHat = useCallback((formHat: RoleHatFormValueEdited) => {
    return (formHat.payments ?? []).filter(payment => !payment.streamId);
  }, []);

  const getCancelledStreamsFromFormHat = useCallback((formHat: RoleHatFormValueEdited) => {
    return (formHat.payments ?? []).filter(payment => payment.isCancelling && !!payment.streamId);
  }, []);

  const getRoleRemovedStreamsWithFundsToClaim = useCallback((formHat: RoleHatFormValueEdited) => {
    return (formHat.payments ?? []).filter(payment => (payment?.withdrawableAmount ?? 0n) > 0n);
  }, []);

  const getActiveStreamsFromFormHat = useCallback((formHat: RoleHatFormValueEdited) => {
    return (formHat.payments ?? []).filter(
      payment => !payment.isCancelled && !!payment.endDate && payment.endDate > new Date(),
    );
  }, []);

  const getPaymentTermRecipients = useCallback(
    (formHat: RoleHatFormValueEdited): (SablierPaymentFormValues & { recipient: Address })[] => {
      return getNewStreamsFromFormHat(formHat).map(payment => {
        if (formHat.roleTerms === undefined || formHat.roleTerms.length === 0) {
          throw new Error('Cannot prepare transactions without role terms');
        }
        const findTerm = formHat.roleTerms.find(
          term =>
            term.termEndDate &&
            payment.endDate &&
            term.termEndDate.getTime() === payment.endDate?.getTime(),
        );
        if (!findTerm) {
          throw new Error('Cannot find term for payment');
        }
        if (!findTerm.nominee) {
          throw new Error('Nominee is undefined');
        }
        return {
          ...payment,
          recipient: getAddress(findTerm.nominee),
        };
      });
    },
    [getNewStreamsFromFormHat],
  );

  const prepareRolePaymentUpdateTxs = useCallback(
    async (formHat: RoleHatFormValueEdited) => {
      if (!daoAddress) {
        throw new Error('Cannot prepare transactions without DAO address');
      }
      if (formHat.wearer === undefined) {
        throw new Error('Cannot prepare transactions without wearer');
      }

      const paymentTxs = []; // Initialize an empty array to hold the transaction data
      const cancelledStreamsOnHat = getCancelledStreamsFromFormHat(formHat);
      if (cancelledStreamsOnHat.length) {
        // This role edit includes stream cancels. In case there are any unclaimed funds on these streams,
        // we need to flush them out to the original wearer.

        const originalHat = getHat(formHat.id);
        if (!originalHat) {
          throw new Error('Cannot find original hat');
        }

        for (const stream of cancelledStreamsOnHat) {
          if (!stream.streamId || !stream.contractAddress || !formHat.smartAddress) {
            throw new Error('Stream data is missing for cancel stream transaction');
          }

          // First transfer hat from the original wearer to the Safe
          paymentTxs.push({
            calldata: encodeFunctionData({
              abi: HatsAbi,
              functionName: 'transferHat',
              args: [BigInt(formHat.id), originalHat.wearerAddress, daoAddress],
            }),
            targetAddress: hatsProtocol,
          });

          // flush withdrawable streams to the original wearer
          if (stream.withdrawableAmount && stream.withdrawableAmount > 0n) {
            const flushStreamTxCalldata = prepareFlushStreamTxs({
              streamId: stream.streamId,
              to: originalHat.wearerAddress,
              smartAccount: formHat.smartAddress,
            });

            paymentTxs.push(...flushStreamTxCalldata);
          }

          // Cancel the stream
          paymentTxs.push(...prepareCancelStreamTxs(stream.streamId));

          // Finally, transfer the hat back to the correct wearer.
          // Because a payment cancel can occur in the same role edit as a member change, we need to ensure hat is
          // finally transferred to the correct wearer. Instead of transferring to `originalHat.wearer` here,
          // `formHat.wearer` will represent the new wearer if the role member was changed, but will otherwise remain
          // the original wearer since the member form field was untouched.
          paymentTxs.push({
            calldata: encodeFunctionData({
              abi: HatsAbi,
              functionName: 'transferHat',
              args: [BigInt(formHat.id), daoAddress, getAddress(formHat.wearer)],
            }),
            targetAddress: hatsProtocol,
          });
        }
      }

      const newStreamsOnHat = getNewStreamsFromFormHat(formHat);
      if (newStreamsOnHat.length) {
        if (!formHat.smartAddress) {
          throw new Error('Cannot prepare transactions for edited role without smart address');
        }
        const newPredictedHatSmartAccount = await predictSmartAccount(BigInt(formHat.id));
        const newStreamTxData = createBatchLinearStreamCreationTx(
          newStreamsOnHat.map(stream => ({ ...stream, recipient: newPredictedHatSmartAccount })),
        );
        paymentTxs.push(...newStreamTxData.preparedTokenApprovalsTransactions);
        paymentTxs.push(...newStreamTxData.preparedStreamCreationTransactions);
      }
      return paymentTxs;
    },
    [
      getCancelledStreamsFromFormHat,
      getNewStreamsFromFormHat,
      getHat,
      daoAddress,
      hatsProtocol,
      prepareCancelStreamTxs,
      prepareFlushStreamTxs,
      predictSmartAccount,
      createBatchLinearStreamCreationTx,
    ],
  );

  const prepareTermedRolePaymentUpdateTxs = useCallback(
    (formHat: RoleHatFormValueEdited) => {
      if (!daoAddress) {
        throw new Error('Cannot prepare transactions without DAO address');
      }
      if (formHat.wearer === undefined) {
        throw new Error('Cannot prepare transactions without wearer');
      }
      if (formHat.roleTerms === undefined || formHat.roleTerms.length === 0) {
        throw new Error('Cannot prepare transactions without role terms');
      }
      const paymentTxs = [];
      const newStreamsOnHat = getNewStreamsFromFormHat(formHat);
      if (newStreamsOnHat.length) {
        const newStreamTxData = createBatchLinearStreamCreationTx(
          getPaymentTermRecipients(formHat),
        );
        paymentTxs.push(...newStreamTxData.preparedTokenApprovalsTransactions);
        paymentTxs.push(...newStreamTxData.preparedStreamCreationTransactions);
      }
      return paymentTxs;
    },
    [
      createBatchLinearStreamCreationTx,
      daoAddress,
      getNewStreamsFromFormHat,
      getPaymentTermRecipients,
    ],
  );

  const prepareCreateRolesModificationsProposalData = useCallback(
    async (proposalMetadata: CreateProposalMetadata, modifiedHats: RoleHatFormValueEdited[]) => {
      if (!hatsTree || !daoAddress) {
        throw new Error('Cannot prepare transactions without hats tree or DAO address');
      }

      if (!publicClient) {
        throw new Error('Cannot prepare transactions without public client');
      }

      const topHatAccount = hatsTree.topHat.smartAddress;
      const adminHatWearer = hatsTree.adminHat.wearer;
      const allTxs: { calldata: Hex; targetAddress: Address }[] = [];

      // The Algorithm
      // for each modified role
      //
      // New Role
      //   - Transfer the top hat to the DecentHats module, so it can create new hats on the safe's behalf
      //   - allTxs.push(createRoleHat). This will (in the DecentHats contract):
      //     - create hat,
      //     - mint hat,
      //     - create smart account for the hat,
      //     - create new streams on the hat if any added
      //  - createRoleHat will transfer the top hat back to the safe
      // Deleted Role
      //   - for each inactive stream with funds to claim
      //     - allTxs.push(flush stream transaction data)
      //   - for each active stream
      //     - allTxs.push(flush stream transaction data)
      //     - allTxs.push(cancel stream transaction data)
      //   - allTxs.push(deactivate role transaction data)
      // Edited Role
      //   - is the name or description changed?
      //     - allTxs.push(edit details data)
      //   - is the member changed?
      //     - for each stream with funds to claim
      //       - if stream is not set to be cancelled
      //         - allTxs.push(flush stream transaction data)
      //   - for each cancelled stream
      //     - allTxs.push(flush stream transaction data)
      //   - for each new stream
      //     - allTxs.push(create new stream transactions datas)

      allTxs.push(
        ...(await prepareAdminHatTxs(
          hatsTree.adminHat.wearer,
          hatsTree.adminHat.id,
          modifiedHats.some(hat => hat.isTermed),
        )),
      );

      for (let index = 0; index < modifiedHats.length; index++) {
        const formHat = modifiedHats[index];
        if (
          formHat.name === undefined ||
          formHat.description === undefined ||
          formHat.wearer === undefined
        ) {
          throw new Error('Role details are missing', {
            cause: formHat,
          });
        }

        if (formHat.editedRole.status === EditBadgeStatus.New) {
          allTxs.push(...(await prepareNewHatTxs(formHat)));
        } else if (formHat.editedRole.status === EditBadgeStatus.Removed) {
          if (formHat.smartAddress === undefined) {
            throw new Error(
              'Cannot prepare transactions for removed role without smart account address',
            );
          }

          const originalHat = getHat(formHat.id);
          if (!originalHat) {
            throw new Error('Cannot find original hat');
          }

          allTxs.push({
            calldata: encodeFunctionData({
              abi: HatsAbi,
              functionName: 'transferHat',
              args: [BigInt(formHat.id), originalHat.wearerAddress, daoAddress],
            }),
            targetAddress: hatsProtocol,
          });

          const streamsWithFundsToClaim = getRoleRemovedStreamsWithFundsToClaim(formHat);

          if (streamsWithFundsToClaim.length) {
            // This role is being removed.
            // We need to flush out any unclaimed funds from streams on this role to the original wearer.
            for (const stream of streamsWithFundsToClaim) {
              if (!stream.streamId || !stream.contractAddress) {
                throw new Error(
                  'Stream ID and Stream ContractAddress is required for flush stream transaction',
                );
              }

              const flushStreamTxCalldata = prepareFlushStreamTxs({
                streamId: stream.streamId,
                to: getAddress(originalHat.wearerAddress),
                smartAccount: formHat.smartAddress,
              });

              allTxs.push(...flushStreamTxCalldata);
            }
          }

          const activeStreams = getActiveStreamsFromFormHat(formHat);

          if (activeStreams.length) {
            for (const stream of activeStreams) {
              if (!stream.streamId || !stream.contractAddress) {
                throw new Error(
                  'Stream ID and Stream ContractAddress is required for cancel stream transaction',
                );
              }
              allTxs.push(...prepareCancelStreamTxs(stream.streamId));
            }
          }

          allTxs.push({
            calldata: encodeFunctionData({
              abi: HatsAccount1ofNAbi,
              functionName: 'execute',
              args: [
                hatsProtocol,
                0n,
                encodeFunctionData({
                  abi: HatsAbi,
                  functionName: 'setHatStatus',
                  args: [BigInt(formHat.id), false],
                }),
                0,
              ],
            }),
            targetAddress: topHatAccount,
          });
        } else if (formHat.editedRole.status === EditBadgeStatus.Updated) {
          if (
            formHat.editedRole.fieldNames.includes('roleName') ||
            formHat.editedRole.fieldNames.includes('roleDescription')
          ) {
            const details = await uploadHatDescription(
              hatsDetailsBuilder({
                name: formHat.name,
                description: formHat.description,
              }),
              ipfsClient,
            );
            allTxs.push({
              calldata: encodeFunctionData({
                abi: HatsAbi,
                functionName: 'changeHatDetails',
                args: [BigInt(formHat.id), details],
              }),
              targetAddress: hatsProtocol,
            });
          }
          if (formHat.editedRole.fieldNames.includes('member') && !formHat.isTermed) {
            const newWearer = getAddress(formHat.wearer);
            if (formHat.smartAddress === undefined) {
              throw new Error('Cannot prepare transactions for edited role without smart address');
            }

            // formHat's `wearer` is the new wearer. We grab the original wearer (before this member change attempt)
            // on the hat, because we need that address to transfer to the new wearer.
            const originalHat = getHat(formHat.id);
            if (!originalHat) {
              throw new Error('Cannot find original hat');
            }

            const streamsWithFundsToClaim = getMemberChangedStreamsWithFundsToClaim(formHat);

            if (streamsWithFundsToClaim.length) {
              // If there are unclaimed funds on any streams on the hat, we need to flush them to the original wearer.
              // First, we transfer the hat to the Safe, which will then be able to withdraw the funds on behalf of the original wearer.
              // Finally, we transfer the hat from the Safe to the new wearer.
              allTxs.push({
                calldata: encodeFunctionData({
                  abi: HatsAbi,
                  functionName: 'transferHat',
                  args: [BigInt(formHat.id), originalHat.wearerAddress, daoAddress],
                }),
                targetAddress: hatsProtocol,
              });

              for (const stream of streamsWithFundsToClaim) {
                if (!stream.streamId || !stream.contractAddress) {
                  throw new Error(
                    'Stream ID and Stream ContractAddress is required for flush stream transaction',
                  );
                }

                const flushStreamTxCalldata = prepareFlushStreamTxs({
                  streamId: stream.streamId,
                  to: originalHat.wearerAddress,
                  smartAccount: formHat.smartAddress,
                });

                allTxs.push(...flushStreamTxCalldata);
              }

              allTxs.push({
                calldata: encodeFunctionData({
                  abi: HatsAbi,
                  functionName: 'transferHat',
                  args: [BigInt(formHat.id), daoAddress, newWearer],
                }),
                targetAddress: hatsProtocol,
              });
            } else {
              // Since there are no streams with funds to claim, we can just transfer the hat directly to the new wearer.
              allTxs.push({
                calldata: encodeFunctionData({
                  abi: HatsAbi,
                  functionName: 'transferHat',
                  args: [BigInt(formHat.id), originalHat.wearerAddress, newWearer],
                }),
                targetAddress: hatsProtocol,
              });
            }
          }
          if (formHat.editedRole.fieldNames.includes('payments')) {
            if (!formHat.isTermed) {
              allTxs.push(...(await prepareRolePaymentUpdateTxs(formHat)));
            } else {
              allTxs.push(...prepareTermedRolePaymentUpdateTxs(formHat));
            }
          }
          if (formHat.editedRole.fieldNames.includes('newTerm')) {
            if (!formHat.isTermed || !formHat.roleTerms) {
              throw new Error('Cannot prepare transactions for edited role without role terms');
            }

            if (adminHatWearer === undefined || !!isDecentAutonomousAdminV1(adminHatWearer)) {
              throw new Error(
                'Cannot prepare transactions for edited role without decent auto admin hat wearer',
              );
            }

            if (
              formHat.eligibility === undefined ||
              (await isElectionEligibilityModule(
                formHat.eligibility,
                hatsElectionsEligibilityMasterCopy,
                publicClient,
              ))
            ) {
              throw new Error(
                'Cannot prepare transactions for edited role without eligibility module set',
              );
            }

            const terms = parseRoleTermsFromFormRoleTerms(formHat.roleTerms);
            // @dev {assupmtion}: We are only dealing with a single term here, either the next term or a new current term when there is no term set.
            // @dev {assupmtion}: There were always be more than one term in this workflow.
            const [previousTerm, newTerm] = terms.slice(-2);

            allTxs.push({
              calldata: encodeFunctionData({
                abi: HatsElectionsEligibilityAbi,
                functionName: 'setNextTerm',
                args: [newTerm.termEndDateTs],
              }),
              targetAddress: formHat.eligibility,
            });
            allTxs.push({
              calldata: encodeFunctionData({
                abi: HatsElectionsEligibilityAbi,
                functionName: 'elect',
                args: [newTerm.termEndDateTs, [newTerm.nominatedWearers[0]]],
              }),
              targetAddress: formHat.eligibility,
            });
            // current term has ended
            if (previousTerm.termEndDateTs < Date.now() * 1000) {
              allTxs.push({
                calldata: encodeFunctionData({
                  abi: DecentAutonomousAdminTempAbi,
                  functionName: 'triggerStartNextTerm',
                  args: [
                    {
                      // @dev formHat.wearer is not changeable for term roles. It will always be the current wearer.
                      currentWearer: getAddress(formHat.wearer),
                      hatsProtocol: hatsProtocol,
                      hatId: BigInt(formHat.id),
                      nominatedWearer: newTerm.nominatedWearers[0],
                    },
                  ],
                }),
                targetAddress: adminHatWearer,
              });
            }
          }
          if (formHat.editedRole.fieldNames.includes('roleType')) {
            // deploy new instance of election module
            // add election module to eligibility
            // toggle mutability
            // ? Decent Sablier Mod
            // flush streams
            // cancel streams
            // burn current hat wearer
            // setNextTerm
            // elect
            // mint hat
          }
        } else {
          throw new Error('Invalid Edited Status');
        }
      }

      return {
        targets: allTxs.map(({ targetAddress }) => targetAddress),
        calldatas: allTxs.map(({ calldata }) => calldata),
        values: allTxs.map(() => 0n),
        metaData: proposalMetadata,
      };
    },
    [
      hatsTree,
      daoAddress,
      publicClient,
      prepareAdminHatTxs,
      prepareNewHatTxs,
      getHat,
      hatsProtocol,
      getRoleRemovedStreamsWithFundsToClaim,
      getActiveStreamsFromFormHat,
      prepareFlushStreamTxs,
      prepareCancelStreamTxs,
      ipfsClient,
      prepareRolePaymentUpdateTxs,
      prepareTermedRolePaymentUpdateTxs,
      isDecentAutonomousAdminV1,
      hatsElectionsEligibilityMasterCopy,
      parseRoleTermsFromFormRoleTerms,
      getMemberChangedStreamsWithFundsToClaim,
    ],
  );

  const createEditRolesProposal = useCallback(
    async (values: RoleFormValues, formikHelpers: FormikHelpers<RoleFormValues>) => {
      if (!publicClient) {
        throw new Error('Cannot create Roles proposal without public client');
      }

      if (!safe) {
        throw new Error('Cannot create Roles proposal without known Safe');
      }

      const { setSubmitting } = formikHelpers;
      setSubmitting(true);

      // filter to hats that have been modified, or whose payments have been modified (ie includes `editedRole` prop)
      const modifiedHats: RoleHatFormValueEdited[] = (
        await Promise.all(
          values.hats.map(async hat => {
            if (hat.editedRole === undefined) {
              return null;
            }
            return {
              ...hat,
              editedRole: hat.editedRole,
              wearer: hat.resolvedWearer,
            };
          }),
        )
      ).filter(hat => hat !== null);

      let proposalData: ProposalExecuteData;
      try {
        if (!hatsTreeId) {
          // This safe has no top hat, so we prepare a proposal to create one. This will also create an admin hat,
          // along with any other hats that are added.

          if (modifiedHats.some(hat => hat.editedRole.status !== EditBadgeStatus.New)) {
            throw new Error(
              'No Hats Tree ID exists, but some modified Roles are marked as non-New.',
            );
          }

          proposalData = await prepareCreateTopHatProposalData(
            values.proposalMetadata,
            modifiedHats,
          );
        } else {
          if (!hatsTree) {
            throw new Error('Cannot edit Roles without a HatsTree');
          }

          proposalData = await prepareCreateRolesModificationsProposalData(
            values.proposalMetadata,
            modifiedHats,
          );
        }

        // Add "send assets" actions to the proposal data
        values.actions.forEach(action => {
          const actionData = prepareSendAssetsActionData({
            transferAmount: action.transferAmount,
            asset: action.asset,
            destinationAddress: action.destinationAddress,
          });
          proposalData.targets.push(actionData.target);
          proposalData.values.push(actionData.value);
          proposalData.calldatas.push(actionData.calldata);
        });

        // All done, submit the proposal!
        await submitProposal({
          proposalData,
          nonce: values.customNonce ?? safe.nextNonce,
          pendingToastMessage: t('proposalCreatePendingToastMessage', { ns: 'proposal' }),
          successToastMessage: t('proposalCreateSuccessToastMessage', { ns: 'proposal' }),
          failedToastMessage: t('proposalCreateFailureToastMessage', { ns: 'proposal' }),
          successCallback: () => {
            if (daoAddress) {
              navigate(DAO_ROUTES.proposals.relative(addressPrefix, daoAddress));
            }
          },
        });
      } catch (e) {
        console.error(e);
        toast.error(t('encodingFailedMessage', { ns: 'proposal' }));
      } finally {
        formikHelpers.setSubmitting(false);
      }
    },
    [
      addressPrefix,
      daoAddress,
      hatsTree,
      hatsTreeId,
      navigate,
      prepareCreateRolesModificationsProposalData,
      prepareCreateTopHatProposalData,
      publicClient,
      safe,
      submitProposal,
      t,
    ],
  );

  return {
    createEditRolesProposal,
  };
}
