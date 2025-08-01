import { Button, Flex, Text } from '@chakra-ui/react';
import { legacy } from '@decentdao/decent-contracts';
import { Formik, Form, useFormikContext } from 'formik';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Address,
  encodeAbiParameters,
  encodeFunctionData,
  encodePacked,
  formatUnits,
  getContract,
  getCreate2Address,
  keccak256,
  parseAbiParameters,
} from 'viem';
import { useAccount, useBalance } from 'wagmi';
import { ROLES } from '../../../constants/accessControlRoles';
import {
  linearERC20VotingWithWhitelistSetupParams,
  linearERC721VotingWithWhitelistSetupParams,
  linearERC721VotingWithWhitelistV1SetupParams,
  linearERC20VotingWithWhitelistV1SetupParams,
} from '../../../constants/params';
import { DAO_ROUTES } from '../../../constants/routes';
import { getRandomBytes } from '../../../helpers';
import useFeatureFlag from '../../../helpers/environmentFeatureFlags';
import { usePaymasterDepositInfo } from '../../../hooks/DAO/accountAbstraction/usePaymasterDepositInfo';
import { useCurrentDAOKey } from '../../../hooks/DAO/useCurrentDAOKey';
import { useValidationAddress } from '../../../hooks/schemas/common/useValidationAddress';
import { useNetworkEnsAddressAsync } from '../../../hooks/useNetworkEnsAddress';
import useNetworkPublicClient from '../../../hooks/useNetworkPublicClient';
import { useCanUserCreateProposal } from '../../../hooks/utils/useCanUserSubmitProposal';
import { useInstallVersionedVotingStrategy } from '../../../hooks/utils/useInstallVersionedVotingStrategy';
import { generateContractByteCodeLinear } from '../../../models/helpers/utils';
import { SafeGeneralSettingsPage } from '../../../pages/dao/settings/general/SafeGeneralSettingsPage';
import { useDAOStore } from '../../../providers/App/AppProvider';
import { useNetworkConfigStore } from '../../../providers/NetworkConfig/useNetworkConfigStore';
import { useProposalActionsStore } from '../../../store/actions/useProposalActionsStore';
import {
  AzoriusGovernance,
  BigIntValuePair,
  CreateProposalAction,
  CreateProposalActionData,
  CreateProposalTransaction,
  FractalTokenType,
  ProposalActionType,
} from '../../../types';
import { RevenueSharingWalletForm, RevenueSharingWalletFormErrors } from '../../../types/revShare';
import { SENTINEL_MODULE } from '../../../utils/address';
import { getEstimatedNumberOfBlocks } from '../../../utils/contract';
import { prepareRefillPaymasterAction } from '../../../utils/dao/prepareRefillPaymasterActionData';
import { prepareWithdrawPaymasterAction } from '../../../utils/dao/prepareWithdrawPaymasterActionData';
import {
  getPaymasterSaltNonce,
  getPaymasterAddress,
  getVoteSelectorAndValidator,
} from '../../../utils/gaslessVoting';
import { formatCoin } from '../../../utils/numberFormats';
import { validateENSName } from '../../../utils/url';
import { isNonEmpty } from '../../../utils/valueCheck';
import { handleEditRevenueShare } from '../../SafeSettings/RevenueShare/revenueShareFormHandlers';
import { SafePermissionsStrategyAction } from '../../SafeSettings/SafePermissionsStrategyAction';
import { SettingsNavigation } from '../../SafeSettings/SettingsNavigation';
import { NewSignerItem } from '../../SafeSettings/Signers/SignersContainer';
import Divider from '../utils/Divider';
import { ModalProvider } from './ModalProvider';

export type SafeSettingsEdits = {
  multisig?: {
    newSigners?: NewSignerItem[];
    signersToRemove?: string[];
    signerThreshold?: number;
  };
  azorius?: {
    quorumPercentage?: bigint;
    quorumThreshold?: bigint;
    votingPeriod?: bigint;
    timelockPeriod?: bigint;
    executionPeriod?: bigint;
  };
  general?: {
    name?: string;
    snapshot?: string;
    sponsoredVoting?: boolean;
  };
  paymasterGasTank?: {
    withdraw?: { recipientAddress?: Address; amount?: BigIntValuePair };
    deposit?: { amount?: BigIntValuePair; isDirectDeposit?: boolean };
  };
  permissions?: {
    proposerThreshold?: BigIntValuePair;
  };
  token?: {
    transferable?: boolean;
    addressesToUnwhitelist?: string[];
    addressesToWhitelist?: string[];
    maximumTotalSupply?: BigIntValuePair;
  };
  revenueSharing?: RevenueSharingWalletForm;
};

type MultisigEditGovernanceFormikErrors = {
  newSigners?: { key: string; error: string }[];
  threshold?: string;
};

type GeneralEditFormikErrors = {
  name?: string;
  snapshot?: string;
};

type PaymasterGasTankEditFormikErrors = {
  withdraw?: { amount?: string; recipientAddress?: string };
  deposit?: { amount?: string };
};

type TokenEditFormikErrors = {
  addressesToWhitelist?: { key: string; error: string }[];
  maximumTotalSupply?: string;
};

export type SafeSettingsFormikErrors = {
  multisig?: MultisigEditGovernanceFormikErrors;
  general?: GeneralEditFormikErrors;
  paymasterGasTank?: PaymasterGasTankEditFormikErrors;
  revenueSharing?: {
    existing: RevenueSharingWalletFormErrors;
    new: RevenueSharingWalletFormErrors;
  };
  token?: TokenEditFormikErrors;
};

export function SafeSettingsModal({
  closeModal,
  closeAllModals,
}: {
  closeModal: () => void;
  closeAllModals: () => void;
}) {
  const { daoKey } = useCurrentDAOKey();

  const {
    node: { safe, subgraphInfo },
    governance,
    governanceContracts: {
      strategies,
      moduleAzoriusAddress,
      linearVotingErc20Address,
      linearVotingErc721Address,
      linearVotingErc20WithHatsWhitelistingAddress,
      linearVotingErc721WithHatsWhitelistingAddress,
    },
    revShareWallets,
  } = useDAOStore({ daoKey });

  // TODO: get staking contract address from store
  const stakingContractAddress = undefined;

  const [settingsContent, setSettingsContent] = useState(<SafeGeneralSettingsPage />);

  const handleSettingsNavigationClick = (content: JSX.Element) => {
    setSettingsContent(content);
  };

  const { canUserCreateProposal } = useCanUserCreateProposal();

  const { t } = useTranslation(['modals', 'common', 'proposalMetadata']);

  const { validateAddress } = useValidationAddress();

  const {
    chain: { id: chainId },
    contracts: {
      keyValuePairs,
      accountAbstraction,
      paymaster,
      zodiacModuleProxyFactory,
      linearVotingErc20MasterCopy,
      linearVotingErc721MasterCopy,
      linearVotingErc20V1MasterCopy,
      linearVotingErc721V1MasterCopy,
      hatsProtocol,
    },
    bundlerMinimumStake,
  } = useNetworkConfigStore();

  function ActionButtons() {
    const { values } = useFormikContext<SafeSettingsEdits>();
    const { errors } = useFormikContext<SafeSettingsFormikErrors>();

    const hasEdits = Object.keys(values).some(key =>
      isNonEmpty(values[key as keyof SafeSettingsEdits]),
    );
    const hasErrors =
      Object.keys(errors.general ?? {}).some(
        key => (errors.general as GeneralEditFormikErrors)[key as keyof GeneralEditFormikErrors],
      ) ||
      Object.keys(errors.multisig ?? {}).some(
        key =>
          (errors.multisig as MultisigEditGovernanceFormikErrors)[
            key as keyof MultisigEditGovernanceFormikErrors
          ],
      ) ||
      Object.keys(errors.paymasterGasTank ?? {}).some(
        key =>
          (errors.paymasterGasTank as PaymasterGasTankEditFormikErrors)[
            key as keyof PaymasterGasTankEditFormikErrors
          ] ||
          (errors.paymasterGasTank as PaymasterGasTankEditFormikErrors)[
            key as keyof PaymasterGasTankEditFormikErrors
          ],
      ) ||
      Object.keys(errors.revenueSharing ?? {}).some(
        key =>
          (errors.revenueSharing as RevenueSharingWalletFormErrors)[
            Number(key) as keyof RevenueSharingWalletFormErrors
          ],
      ) ||
      Object.keys(errors.token ?? {}).some(
        key => (errors.token as TokenEditFormikErrors)[key as keyof TokenEditFormikErrors],
      );

    return (
      <Flex
        flexDirection="row"
        justifyContent="flex-end"
        my="1rem"
        mr={4}
        alignItems="center"
        alignSelf="flex-end"
        alignContent="center"
        gap="0.5rem"
      >
        <Button
          variant="tertiary"
          size="sm"
          px="2rem"
          onClick={closeModal}
        >
          {t('discardChanges', { ns: 'common' })}
        </Button>
        {canUserCreateProposal && (
          <Button
            variant="primary"
            size="sm"
            type="submit"
            isDisabled={!hasEdits || hasErrors}
          >
            {t('createProposal')}
          </Button>
        )}
      </Flex>
    );
  }

  const { addAction, resetActions } = useProposalActionsStore();

  const { addressPrefix } = useNetworkConfigStore();

  const { buildInstallVersionedVotingStrategies } = useInstallVersionedVotingStrategy();
  const { depositInfo: paymasterDepositInfo } = usePaymasterDepositInfo();
  const { address } = useAccount();
  const { data: userBalance } = useBalance({
    address,
    chainId,
  });
  const { data: safeBalance } = useBalance({
    address: safe?.address,
    chainId,
  });
  const navigate = useNavigate();

  const { getEnsAddress } = useNetworkEnsAddressAsync();

  const publicClient = useNetworkPublicClient();

  const gaslessVotingFeatureEnabled = useFeatureFlag('flag_gasless_voting');

  const ethValue = {
    bigintValue: 0n,
    value: '0',
  };

  const handleEditPaymaster = async (
    updatedValues: SafeSettingsEdits,
  ): Promise<CreateProposalAction[] | undefined> => {
    const { paymasterAddress } = governance;
    if (!paymasterAddress) {
      throw new Error('Paymaster address is not set');
    }

    const actions: CreateProposalAction[] = [];
    const nativeCurrency = publicClient.chain.nativeCurrency;
    const { paymasterGasTank } = updatedValues;

    if (paymasterGasTank?.withdraw?.amount?.bigintValue) {
      if (!paymasterGasTank.withdraw.recipientAddress) {
        throw new Error('Recipient address is not set');
      }

      const actionData = prepareWithdrawPaymasterAction({
        withdrawData: {
          withdrawAmount: paymasterGasTank.withdraw.amount.bigintValue,
          recipientAddress: paymasterGasTank.withdraw.recipientAddress,
        },
        paymasterAddress,
      });

      const formattedWithdrawAmount = formatCoin(
        paymasterGasTank.withdraw.amount.bigintValue,
        true,
        nativeCurrency.decimals,
        nativeCurrency.symbol,
        false,
      );

      actions.push({
        ...actionData,
        content: (
          <Text>
            {t('withdrawGasAction', {
              amount: formattedWithdrawAmount,
              symbol: nativeCurrency.symbol,
              ns: 'gaslessVoting',
            })}
          </Text>
        ),
      });
    }

    if (paymasterGasTank?.deposit?.amount?.bigintValue) {
      if (!accountAbstraction) {
        throw new Error('Account Abstraction addresses are not set');
      }

      if (paymasterGasTank.deposit.isDirectDeposit) {
        return;
      }

      const actionData = prepareRefillPaymasterAction({
        refillAmount: paymasterGasTank.deposit.amount.bigintValue,
        paymasterAddress,
        nativeToken: nativeCurrency,
        entryPointAddress: accountAbstraction.entryPointv07,
      });
      const formattedRefillAmount = formatCoin(
        paymasterGasTank.deposit.amount.bigintValue,
        true,
        nativeCurrency.decimals,
        nativeCurrency.symbol,
        false,
      );

      actions.push({
        ...actionData,
        content: (
          <Text>
            {t('refillPaymasterAction', {
              amount: formattedRefillAmount,
              symbol: nativeCurrency.symbol,
              ns: 'gaslessVoting',
            })}
          </Text>
        ),
      });
    }

    return actions;
  };

  const handleEditGeneral = async (updatedValues: SafeSettingsEdits) => {
    const changeTitles = [];
    const keyArgs: string[] = [];
    const valueArgs: string[] = [];

    const accountAbstractionSupported = bundlerMinimumStake !== undefined;
    const stakingRequired = accountAbstractionSupported && bundlerMinimumStake > 0n;
    const { paymasterAddress } = governance;

    const transactions: CreateProposalTransaction[] = [];

    if (updatedValues.general?.name) {
      changeTitles.push(t('updatesSafeName', { ns: 'proposalMetadata' }));
      keyArgs.push('daoName');
      valueArgs.push(updatedValues.general.name);
    }

    if (updatedValues.general?.snapshot !== undefined) {
      changeTitles.push(t('updateSnapshotSpace', { ns: 'proposalMetadata' }));
      keyArgs.push('snapshotENS');
      valueArgs.push(updatedValues.general.snapshot);
    }

    if (updatedValues.general?.sponsoredVoting !== undefined) {
      keyArgs.push('gaslessVotingEnabled');
      if (updatedValues.general.sponsoredVoting) {
        changeTitles.push(t('enableGaslessVoting', { ns: 'proposalMetadata' }));
        valueArgs.push('true');
      } else {
        changeTitles.push(t('disableGaslessVoting', { ns: 'proposalMetadata' }));
        valueArgs.push('false');
      }
    }

    const title = changeTitles.join(`; `);

    transactions.push({
      targetAddress: keyValuePairs,
      ethValue,
      functionName: 'updateValues',
      parameters: [
        {
          signature: 'string[]',
          valueArray: keyArgs,
        },
        {
          signature: 'string[]',
          valueArray: valueArgs,
        },
      ],
    });

    if (updatedValues.general?.sponsoredVoting !== undefined) {
      if (!safe?.address) {
        throw new Error('Safe address is not set');
      }

      if (!accountAbstraction) {
        throw new Error('Account Abstraction addresses are not set');
      }

      if (paymasterAddress === null) {
        // Paymaster does not exist, deploy a new one
        const paymasterInitData = encodeFunctionData({
          abi: legacy.abis.DecentPaymasterV1,
          functionName: 'initialize',
          args: [
            encodeAbiParameters(parseAbiParameters(['address', 'address', 'address']), [
              safe.address,
              accountAbstraction.entryPointv07,
              accountAbstraction.lightAccountFactory,
            ]),
          ],
        });

        transactions.push({
          targetAddress: zodiacModuleProxyFactory,
          ethValue,
          functionName: 'deployModule',
          parameters: [
            {
              signature: 'address',
              value: paymaster.decentPaymasterV1MasterCopy,
            },
            {
              signature: 'bytes',
              value: paymasterInitData,
            },
            {
              signature: 'uint256',
              value: getPaymasterSaltNonce(safe.address, chainId).toString(),
            },
          ],
        });
      }

      // Include txs to disable any old voting strategies and enable the new ones.
      const { installVersionedStrategyCreateProposalTxs, newStrategies } =
        await buildInstallVersionedVotingStrategies();

      transactions.push(...installVersionedStrategyCreateProposalTxs);

      const predictedPaymasterAddress = getPaymasterAddress({
        safeAddress: safe.address,
        zodiacModuleProxyFactory,
        paymasterMastercopy: paymaster.decentPaymasterV1MasterCopy,
        entryPoint: accountAbstraction.entryPointv07,
        lightAccountFactory: accountAbstraction.lightAccountFactory,
        chainId,
      });

      // Add stake for Paymaster if not enough
      if (stakingRequired) {
        const stakedAmount = paymasterDepositInfo?.stake || 0n;

        if (paymasterAddress === null || stakedAmount < bundlerMinimumStake) {
          const delta = bundlerMinimumStake - stakedAmount;

          transactions.push({
            targetAddress: predictedPaymasterAddress,
            ethValue: {
              bigintValue: delta,
              value: delta.toString(),
            },
            functionName: 'addStake',
            parameters: [
              {
                signature: 'uint32',
                // one day in seconds, defined on https://github.com/alchemyplatform/rundler/blob/c17fd3dbc24d2af93fd68310031d445d5440794f/crates/sim/src/simulation/mod.rs#L170
                value: 86400n.toString(),
              },
            ],
          });
        }
      }

      newStrategies.forEach(strategy => {
        // Whitelist the new strategy's `vote` function call on the Paymaster
        // // // // // // // // // // // // // // // // // // // // // // //
        const { voteSelector, voteValidator } = getVoteSelectorAndValidator(
          strategy.type,
          paymaster,
        );

        transactions.push({
          targetAddress: predictedPaymasterAddress,
          ethValue,
          functionName: 'setFunctionValidator',
          parameters: [
            {
              signature: 'address',
              value: strategy.address,
            },
            {
              signature: 'bytes4',
              value: voteSelector,
            },
            {
              signature: 'address',
              value: voteValidator,
            },
          ],
        });
      });

      // Also whitelist existing versioned strategies that have not already been whitelisted.
      // This will be the case for DAOs deployed after this feature, but did not enable gasless voting on creation.
      if (paymasterAddress === null) {
        strategies
          .filter(strategy => strategy.version !== undefined)
          .forEach(strategy => {
            const { voteSelector, voteValidator } = getVoteSelectorAndValidator(
              strategy.type,
              paymaster,
            );

            transactions.push({
              targetAddress: predictedPaymasterAddress,
              ethValue,
              functionName: 'setFunctionValidator',
              parameters: [
                {
                  signature: 'address',
                  value: strategy.address,
                },
                {
                  signature: 'bytes4',
                  value: voteSelector,
                },
                {
                  signature: 'address',
                  value: voteValidator,
                },
              ],
            });
          });
      }
    }

    const action: CreateProposalActionData = {
      actionType: ProposalActionType.EDIT,
      transactions,
    };

    return { action, title };
  };

  const handleEditMultisigGovernance = async (updatedValues: SafeSettingsEdits) => {
    if (!updatedValues.multisig) {
      throw new Error('Multisig settings are not set');
    }

    if (!safe?.address) {
      throw new Error('Safe address is not set');
    }
    const changeTitles: string[] = [];

    const { newSigners, signersToRemove, signerThreshold } = updatedValues.multisig;

    const threshold = signerThreshold ?? safe.threshold;

    const transactions: CreateProposalTransaction[] = [];

    if ((newSigners?.length ?? 0) > 0) {
      newSigners?.forEach(async s => {
        const maybeEnsAddress = await getEnsAddress({ name: s.inputValue });
        const signerAddress: Address | undefined = maybeEnsAddress ?? s.address;

        if (!signerAddress) {
          throw new Error('Invalid ENS name or address');
        }

        transactions.push({
          targetAddress: safe.address,
          ethValue,
          functionName: 'addOwnerWithThreshold',
          parameters: [
            {
              signature: 'address',
              value: signerAddress,
            },
            {
              signature: 'uint256',
              value: threshold.toString(),
            },
          ],
        });
      });

      changeTitles.push(t('addSigners', { ns: 'proposalMetadata' }));
    }

    if ((signersToRemove?.length ?? 0) > 0) {
      const signerIndicesThatWillBeRemoved = new Set<number>();

      signersToRemove?.forEach(s => {
        const signerToRemoveIndex = safe.owners.findIndex(a => a === s);
        let previousIndex = signerToRemoveIndex - 1;
        while (signerIndicesThatWillBeRemoved.has(previousIndex)) {
          previousIndex--;
        }

        const prevSigner = previousIndex < 0 ? SENTINEL_MODULE : safe.owners[previousIndex];

        transactions.push({
          targetAddress: safe.address,
          ethValue,
          functionName: 'removeOwner',
          parameters: [
            {
              signature: 'address',
              value: prevSigner,
            },
            {
              signature: 'address',
              value: s,
            },
            {
              signature: 'uint256',
              value: threshold.toString(),
            },
          ],
        });

        signerIndicesThatWillBeRemoved.add(signerToRemoveIndex);
      });

      changeTitles.push(t('removeSigners', { ns: 'proposalMetadata' }));
    }

    if (
      newSigners === undefined &&
      signersToRemove === undefined &&
      signerThreshold !== undefined
    ) {
      transactions.push({
        targetAddress: safe.address,
        ethValue,
        functionName: 'changeThreshold',
        parameters: [
          {
            signature: 'uint256',
            value: signerThreshold.toString(),
          },
        ],
      });

      changeTitles.push(t('changeThreshold', { ns: 'proposalMetadata' }));
    }

    const action: CreateProposalActionData = {
      actionType: ProposalActionType.EDIT,
      transactions,
    };

    return { action, title: changeTitles.join(`; `) };
  };

  const handleEditAzoriusGovernance = async (updatedValues: SafeSettingsEdits) => {
    if (!updatedValues.azorius) {
      throw new Error('Azorius settings are not set');
    }

    if (!moduleAzoriusAddress) {
      throw new Error('Azorius module address is not set');
    }

    const { quorumPercentage, quorumThreshold, votingPeriod, timelockPeriod, executionPeriod } =
      updatedValues.azorius;

    const transactions: CreateProposalTransaction[] = [];

    const changeTitles: string[] = [];

    if (quorumPercentage) {
      const erc20Strategies = strategies.filter(s => s.type === FractalTokenType.erc20);
      if (erc20Strategies.length === 0) {
        throw new Error('ERC20 strategy is not set');
      }

      await Promise.all(
        erc20Strategies.map(async strategy => {
          const erc20VotingContract = getContract({
            abi:
              strategy.type === FractalTokenType.erc20
                ? legacy.abis.LinearERC20Voting
                : legacy.abis.LinearERC721Voting,
            address: strategy.address,
            client: publicClient,
          });

          const quorumDenominator = await erc20VotingContract.read.QUORUM_DENOMINATOR();

          transactions.push({
            targetAddress: strategy.address,
            ethValue,
            functionName: 'updateQuorumNumerator',
            parameters: [
              {
                signature: 'uint256',
                value: ((quorumPercentage * quorumDenominator) / 100n).toString(),
              },
            ],
          });
        }),
      );

      changeTitles.push(t('changeQuorumNumerator', { ns: 'proposalMetadata' }));
    }

    if (quorumThreshold) {
      const erc721Strategies = strategies.filter(s => s.type === FractalTokenType.erc721);
      if (erc721Strategies.length === 0) {
        throw new Error('ERC721 strategy is not set');
      }

      erc721Strategies.forEach(strategy => {
        transactions.push({
          targetAddress: strategy.address,
          ethValue,
          functionName: 'updateQuorumThreshold',
          parameters: [
            {
              signature: 'uint256',
              value: quorumThreshold.toString(),
            },
          ],
        });
      });

      changeTitles.push(t('changeQuorumThreshold', { ns: 'proposalMetadata' }));
    }

    if (votingPeriod) {
      const eligibleStrategies = strategies.filter(
        s => s.type === FractalTokenType.erc20 || s.type === FractalTokenType.erc721,
      );
      if (eligibleStrategies.length === 0) {
        throw new Error('No eligible strategies found');
      }

      await Promise.all(
        eligibleStrategies.map(async strategy => {
          const numberOfBlocks = await getEstimatedNumberOfBlocks(votingPeriod / 60n, publicClient);
          transactions.push({
            targetAddress: strategy.address,
            ethValue,
            functionName: 'updateVotingPeriod',
            parameters: [
              {
                signature: 'uint32',
                value: numberOfBlocks.toString(),
              },
            ],
          });
        }),
      );

      changeTitles.push(t('changeVotingPeriod', { ns: 'proposalMetadata' }));
    }

    if (timelockPeriod) {
      const numberOfBlocks = await getEstimatedNumberOfBlocks(timelockPeriod / 60n, publicClient);
      transactions.push({
        targetAddress: moduleAzoriusAddress,
        ethValue,
        functionName: 'updateTimelockPeriod',
        parameters: [
          {
            signature: 'uint32',
            value: numberOfBlocks.toString(),
          },
        ],
      });

      changeTitles.push(t('changeTimelockPeriod', { ns: 'proposalMetadata' }));
    }

    if (executionPeriod) {
      const numberOfBlocks = await getEstimatedNumberOfBlocks(executionPeriod / 60n, publicClient);
      transactions.push({
        targetAddress: moduleAzoriusAddress,
        ethValue,
        functionName: 'updateExecutionPeriod',
        parameters: [
          {
            signature: 'uint32',
            value: numberOfBlocks.toString(),
          },
        ],
      });

      changeTitles.push(t('changeExecutionPeriod', { ns: 'proposalMetadata' }));
    }

    return {
      action: { actionType: ProposalActionType.EDIT, transactions },
      title: changeTitles.join(`; `),
    };
  };

  const handleEditPermissions = async (updatedValues: SafeSettingsEdits) => {
    if (!safe?.address) {
      throw new Error('Safe address is not set');
    }

    if (!updatedValues.permissions) {
      throw new Error('Permissions are not set');
    }

    const { proposerThreshold } = updatedValues.permissions;

    if (!proposerThreshold?.bigintValue) {
      throw new Error('Proposer threshold is not set');
    }

    let transactions: CreateProposalTransaction[] = [];

    const azoriusGovernance = governance as AzoriusGovernance;

    if (!moduleAzoriusAddress) {
      throw new Error('Azorius module address is not set');
    }

    let actionType: ProposalActionType = ProposalActionType.EDIT;

    if (linearVotingErc20Address) {
      transactions = [
        {
          targetAddress: linearVotingErc20Address,
          ethValue: {
            bigintValue: 0n,
            value: '0',
          },
          functionName: 'updateRequiredProposerWeight',
          parameters: [
            {
              signature: 'uint256',
              value: proposerThreshold.bigintValue.toString(),
            },
          ],
        },
      ];
    } else if (linearVotingErc721Address) {
      transactions = [
        {
          targetAddress: linearVotingErc721Address,
          ethValue: {
            bigintValue: 0n,
            value: '0',
          },
          functionName: 'updateProposerThreshold',
          parameters: [
            {
              signature: 'uint256',
              value: proposerThreshold.bigintValue.toString(),
            },
          ],
        },
      ];
    } else if (linearVotingErc20WithHatsWhitelistingAddress) {
      // @todo - definitely could be more DRY here and with useCreateRoles
      actionType = ProposalActionType.ADD;
      const strategyNonce = getRandomBytes();
      const linearERC20VotingMasterCopyContract = getContract({
        abi: legacy.abis.LinearERC20Voting,
        address: linearVotingErc20MasterCopy,
        client: publicClient,
      });

      const { votesToken, votingStrategy } = azoriusGovernance;

      if (!votesToken || !votingStrategy?.votingPeriod || !votingStrategy.quorumPercentage) {
        throw new Error('Voting strategy or votes token not found');
      }

      const quorumDenominator = await linearERC20VotingMasterCopyContract.read.QUORUM_DENOMINATOR();

      const encodedStrategyInitParams =
        gaslessVotingFeatureEnabled && accountAbstraction
          ? encodeAbiParameters(parseAbiParameters(linearERC20VotingWithWhitelistV1SetupParams), [
              safe.address, // owner
              votesToken.address, // governance token
              moduleAzoriusAddress, // Azorius module
              Number(votingStrategy.votingPeriod.value),
              (votingStrategy.quorumPercentage.value * quorumDenominator) / 100n,
              500000n,
              hatsProtocol, // hats protocol
              [], // whitelisted hat ids
              accountAbstraction.lightAccountFactory, // light account factory
            ])
          : encodeAbiParameters(parseAbiParameters(linearERC20VotingWithWhitelistSetupParams), [
              safe.address, // owner
              votesToken.address, // governance token
              moduleAzoriusAddress, // Azorius module
              Number(votingStrategy.votingPeriod.value),
              (votingStrategy.quorumPercentage.value * quorumDenominator) / 100n,
              500000n,
              hatsProtocol, // hats protocol
              [], // whitelisted hat ids
            ]);

      const encodedStrategySetupData = encodeFunctionData({
        abi: gaslessVotingFeatureEnabled
          ? legacy.abis.LinearERC20VotingWithHatsProposalCreationV1
          : legacy.abis.LinearERC20VotingWithHatsProposalCreation,
        functionName: 'setUp',
        args: [encodedStrategyInitParams],
      });

      const masterCopy = gaslessVotingFeatureEnabled
        ? linearVotingErc20V1MasterCopy
        : linearVotingErc20MasterCopy;

      const strategyByteCodeLinear = generateContractByteCodeLinear(masterCopy);

      const strategySalt = keccak256(
        encodePacked(
          ['bytes32', 'uint256'],
          [keccak256(encodePacked(['bytes'], [encodedStrategySetupData])), strategyNonce],
        ),
      );

      const predictedStrategyAddress = getCreate2Address({
        from: zodiacModuleProxyFactory,
        salt: strategySalt,
        bytecodeHash: keccak256(encodePacked(['bytes'], [strategyByteCodeLinear])),
      });

      transactions = [
        {
          targetAddress: zodiacModuleProxyFactory,
          functionName: 'deployModule',
          ethValue: { bigintValue: 0n, value: '0' },
          parameters: [
            {
              signature: 'address',
              value: masterCopy,
            },
            { signature: 'bytes', value: encodedStrategySetupData },
            { signature: 'uint256', value: strategyNonce.toString() },
          ],
        },
        {
          targetAddress: moduleAzoriusAddress,
          functionName: 'enableStrategy',
          ethValue: { bigintValue: 0n, value: '0' },
          parameters: [{ signature: 'address', value: predictedStrategyAddress }],
        },
      ];
    } else if (linearVotingErc721WithHatsWhitelistingAddress) {
      actionType = ProposalActionType.ADD;
      const strategyNonce = getRandomBytes();

      const { erc721Tokens, votingStrategy } = azoriusGovernance;

      if (!erc721Tokens || !votingStrategy?.votingPeriod || !votingStrategy.quorumThreshold) {
        throw new Error('Voting strategy or NFT votes tokens not found');
      }

      const encodedStrategyInitParams =
        gaslessVotingFeatureEnabled && accountAbstraction
          ? encodeAbiParameters(parseAbiParameters(linearERC721VotingWithWhitelistV1SetupParams), [
              safe.address, // owner
              erc721Tokens.map(token => token.address), // governance token
              erc721Tokens.map(token => token.votingWeight),
              moduleAzoriusAddress,
              Number(votingStrategy.votingPeriod.value),
              proposerThreshold.bigintValue,
              500000n,
              hatsProtocol, // hats protocol
              [], // whitelisted hat ids
              accountAbstraction.lightAccountFactory, // light account factory
            ])
          : encodeAbiParameters(parseAbiParameters(linearERC721VotingWithWhitelistSetupParams), [
              safe.address, // owner
              erc721Tokens.map(token => token.address), // governance token
              erc721Tokens.map(token => token.votingWeight),
              moduleAzoriusAddress,
              Number(votingStrategy.votingPeriod.value),
              proposerThreshold.bigintValue,
              500000n,
              hatsProtocol, // hats protocol
              [], // whitelisted hat ids
            ]);

      const encodedStrategySetupData = encodeFunctionData({
        abi: gaslessVotingFeatureEnabled
          ? legacy.abis.LinearERC20VotingWithHatsProposalCreationV1
          : legacy.abis.LinearERC20VotingWithHatsProposalCreation,
        functionName: 'setUp',
        args: [encodedStrategyInitParams],
      });

      const masterCopy = gaslessVotingFeatureEnabled
        ? linearVotingErc721V1MasterCopy
        : linearVotingErc721MasterCopy;

      const strategyByteCodeLinear = generateContractByteCodeLinear(masterCopy);

      const strategySalt = keccak256(
        encodePacked(
          ['bytes32', 'uint256'],
          [keccak256(encodePacked(['bytes'], [encodedStrategySetupData])), strategyNonce],
        ),
      );

      const predictedStrategyAddress = getCreate2Address({
        from: zodiacModuleProxyFactory,
        salt: strategySalt,
        bytecodeHash: keccak256(encodePacked(['bytes'], [strategyByteCodeLinear])),
      });

      transactions = [
        {
          targetAddress: zodiacModuleProxyFactory,
          functionName: 'deployModule',
          ethValue: { bigintValue: 0n, value: '0' },
          parameters: [
            {
              signature: 'address',
              value: masterCopy,
            },
            { signature: 'bytes', value: encodedStrategySetupData },
            { signature: 'uint256', value: strategyNonce.toString() },
          ],
        },
        {
          targetAddress: moduleAzoriusAddress,
          functionName: 'enableStrategy',
          ethValue: { bigintValue: 0n, value: '0' },
          parameters: [{ signature: 'address', value: predictedStrategyAddress }],
        },
      ];
    } else {
      throw new Error('No existing voting strategy address found');
    }

    return {
      actionType,
      content: (
        <SafePermissionsStrategyAction
          actionType={actionType}
          proposerThreshold={proposerThreshold}
        />
      ),
      transactions,
    };
  };

  const handleEditToken = async (updatedValues: SafeSettingsEdits) => {
    if (!safe?.address) {
      throw new Error('Safe address is not set');
    }

    if (!isNonEmpty(updatedValues.token)) {
      throw new Error('Token are not set');
    }
    const tokenValues = updatedValues.token!;

    if (!governance.erc20Token) {
      throw new Error('ERC20Token are not set');
    }
    const token = governance.erc20Token;

    const changeTitles = [];
    const transactions: CreateProposalTransaction[] = [];

    if (tokenValues.transferable !== undefined) {
      changeTitles.push(t('updateTokenTransferable', { ns: 'proposalMetadata' }));
      transactions.push({
        targetAddress: token.address,
        ethValue,
        functionName: 'lock',
        parameters: [
          {
            signature: 'bool',
            value: (!tokenValues.transferable).toString(),
          },
        ],
      });
    }
    if (
      tokenValues.addressesToWhitelist !== undefined &&
      tokenValues.addressesToWhitelist.length > 0
    ) {
      tokenValues.addressesToWhitelist.map(addr => {
        transactions.push({
          targetAddress: token.address,
          ethValue,
          functionName: 'grantRole',
          parameters: [
            {
              signature: 'bytes32',
              value: ROLES.TRANSFER_FROM_ROLE,
            },
            {
              signature: 'address',
              value: addr,
            },
          ],
        });
      });
      changeTitles.push(t('addTokenWhitelist', { ns: 'proposalMetadata' }));
    }
    if (
      tokenValues.addressesToUnwhitelist !== undefined &&
      tokenValues.addressesToUnwhitelist.length > 0
    ) {
      tokenValues.addressesToUnwhitelist.map(addr => {
        transactions.push({
          targetAddress: token.address,
          ethValue,
          functionName: 'revokeRole',
          parameters: [
            {
              signature: 'bytes32',
              value: ROLES.TRANSFER_FROM_ROLE,
            },
            {
              signature: 'address',
              value: addr,
            },
          ],
        });
      });
      changeTitles.push(t('removeTokenWhitelist', { ns: 'proposalMetadata' }));
    }
    if (tokenValues.maximumTotalSupply?.bigintValue !== undefined) {
      changeTitles.push(t('updateTokenMaxTotalSupply', { ns: 'proposalMetadata' }));
      transactions.push({
        targetAddress: token.address,
        ethValue,
        functionName: 'setMaxTotalSupply',
        parameters: [
          {
            signature: 'uint256',
            value: tokenValues.maximumTotalSupply.bigintValue.toString(),
          },
        ],
      });
    }

    const title = changeTitles.join(`; `);

    const action: CreateProposalActionData = {
      actionType: ProposalActionType.EDIT,
      transactions,
    };

    return { action, title };
  };

  const submitAllSettingsEditsProposal = async (values: SafeSettingsEdits) => {
    if (!safe?.address) {
      throw new Error('Safe address is not set');
    }

    resetActions();
    const { general, multisig, azorius, permissions, paymasterGasTank, token, revenueSharing } =
      values;
    if (general) {
      const { action, title } = await handleEditGeneral(values);

      addAction({
        actionType: action.actionType,
        transactions: action.transactions,
        content: <Text>{title}</Text>,
      });
    }

    if (paymasterGasTank) {
      const actions = await handleEditPaymaster(values);

      if (actions && actions.length > 0) {
        actions.forEach(action => {
          addAction(action);
        });
      }
    }

    if (multisig) {
      const { action, title } = await handleEditMultisigGovernance(values);

      addAction({
        actionType: action.actionType,
        transactions: action.transactions,
        content: <Text>{title}</Text>,
      });
    }

    if (azorius) {
      const { action, title } = await handleEditAzoriusGovernance(values);

      addAction({
        actionType: action.actionType,
        transactions: action.transactions,
        content: <Text>{title}</Text>,
      });
    }

    if (permissions) {
      const action = await handleEditPermissions(values);

      addAction(action);
    }

    if (token) {
      const { action, title } = await handleEditToken(values);

      addAction({
        actionType: action.actionType,
        transactions: action.transactions,
        content: <Text>{title}</Text>,
      });
    }

    if (revenueSharing) {
      const action = await handleEditRevenueShare({
        daoAddress: safe.address,
        parentDaoAddress: subgraphInfo?.parentAddress,
        stakingContractAddress,
        keyValuePairsAddress: keyValuePairs,
        updatedValues: values.revenueSharing,
        existingWallets: revShareWallets ?? [],
        publicClient,
      });
      addAction({
        actionType: action.actionType,
        transactions: action.transactions,
        content: <Text>{action.title}</Text>,
      });
    }

    navigate(DAO_ROUTES.proposalWithActionsNew.relative(addressPrefix, safe.address));
  };

  return (
    <Formik<SafeSettingsEdits>
      initialValues={{}}
      validate={async values => {
        let errors: SafeSettingsFormikErrors = {};

        if (values.multisig) {
          const { newSigners, signerThreshold, signersToRemove } = values.multisig;
          const errorsMultisig = errors.multisig ?? {};

          if (newSigners && newSigners.length > 0) {
            const signerErrors = await Promise.all(
              newSigners.map(async signer => {
                if (!signer.inputValue) {
                  return { key: signer.key, error: t('addressRequired', { ns: 'common' }) };
                }

                const validation = await validateAddress({ address: signer.inputValue });
                if (!validation.validation.isValidAddress) {
                  return { key: signer.key, error: t('errorInvalidAddress', { ns: 'common' }) };
                }
                return null;
              }),
            );

            if (signerErrors.some(error => error !== null)) {
              errorsMultisig.newSigners = signerErrors.filter(error => error !== null);
              errors.multisig = errorsMultisig;
            }
          }

          if (signerThreshold && signerThreshold < 1) {
            errorsMultisig.threshold = t('errorLowSignerThreshold', { ns: 'daoCreate' });
            errors.multisig = errorsMultisig;
          }

          if (signerThreshold) {
            const totalResultingSigners =
              (safe?.owners?.length ?? 0) -
              (signersToRemove?.length ?? 0) +
              (newSigners?.length ?? 0);

            if (signerThreshold > totalResultingSigners) {
              errorsMultisig.threshold = t('errorHighSignerThreshold', { ns: 'daoCreate' });
              errors.multisig = errorsMultisig;
            }
          }
        } else {
          errors.multisig = undefined;
        }

        if (values.token) {
          const { addressesToWhitelist, maximumTotalSupply } = values.token;
          const errorsToken = errors.token ?? {};

          if (addressesToWhitelist && addressesToWhitelist.length > 0) {
            const whitelistErrors = await Promise.all(
              addressesToWhitelist.map(async (addressToWhitelist, index) => {
                if (!addressToWhitelist) {
                  return {
                    key: `addressesToWhitelist.${index}`,
                    error: t('addressRequired', { ns: 'common' }),
                  };
                }

                const validation = await validateAddress({ address: addressToWhitelist });
                if (!validation.validation.isValidAddress) {
                  return {
                    key: `addressesToWhitelist.${index}`,
                    error: t('errorInvalidAddress', { ns: 'common' }),
                  };
                }
                return null;
              }),
            );

            if (whitelistErrors.some(error => error !== null)) {
              errorsToken.addressesToWhitelist = whitelistErrors.filter(error => error !== null);
              errors.token = errorsToken;
            }
          }

          const erc20Token = governance.erc20Token;
          const currentMaxTotalSupply: BigIntValuePair = {
            bigintValue: erc20Token?.maxTotalSupply,
            value: formatUnits(erc20Token?.maxTotalSupply || 0n, erc20Token?.decimals || 0),
          };
          if (maximumTotalSupply?.bigintValue && currentMaxTotalSupply.bigintValue) {
            const lessThanCurrent =
              maximumTotalSupply.bigintValue < currentMaxTotalSupply.bigintValue;

            if (lessThanCurrent) {
              errorsToken.maximumTotalSupply = t('errorMinimumValue', {
                ns: 'common',
                minValue: currentMaxTotalSupply.value,
              });
              errors.token = errorsToken;
            }
          }
        } else {
          errors.token = undefined;
        }

        if (values.general) {
          const { name, snapshot } = values.general;
          const errorsGeneral = errors.general ?? {};

          if (snapshot && !validateENSName(snapshot)) {
            errorsGeneral.snapshot = t('errorInvalidENSName', { ns: 'common' });
            errors.general = errorsGeneral;
          }

          if (name !== undefined && name === '') {
            errorsGeneral.name = t('daoNameRequired', { ns: 'common' });
            errors.general = errorsGeneral;
          }
        } else {
          errors.general = undefined;
        }

        if (values.paymasterGasTank) {
          const { withdraw, deposit } = values.paymasterGasTank;

          if (withdraw) {
            if (
              withdraw.amount?.bigintValue !== undefined &&
              paymasterDepositInfo?.balance !== undefined
            ) {
              if (withdraw.amount.bigintValue > paymasterDepositInfo.balance) {
                errors.paymasterGasTank = {
                  ...errors.paymasterGasTank,
                  withdraw: {
                    ...errors.paymasterGasTank?.withdraw,
                    amount: t('amountExceedsAvailableBalance', { ns: 'gaslessVoting' }),
                  },
                };
              }
            }

            if (withdraw.recipientAddress !== undefined) {
              const validation = await validateAddress({ address: withdraw.recipientAddress });
              if (!validation.validation.isValidAddress) {
                errors.paymasterGasTank = {
                  ...errors.paymasterGasTank,
                  withdraw: {
                    ...errors.paymasterGasTank?.withdraw,
                    recipientAddress: t('errorInvalidAddress', { ns: 'common' }),
                  },
                };
              }
            }
          } else {
            errors.paymasterGasTank = {
              ...errors.paymasterGasTank,
              withdraw: undefined,
            };
          }

          if (deposit) {
            const balanceToDepositFrom = deposit.isDirectDeposit ? userBalance : safeBalance;

            const overDraft =
              deposit.amount?.bigintValue !== undefined &&
              balanceToDepositFrom !== undefined &&
              deposit.amount.bigintValue > balanceToDepositFrom.value;

            if (overDraft && errors.paymasterGasTank?.deposit?.amount === undefined) {
              errors.paymasterGasTank = {
                ...errors.paymasterGasTank,
                deposit: {
                  ...errors.paymasterGasTank?.deposit,
                  amount: t('amountExceedsAvailableBalance', { ns: 'gaslessVoting' }),
                },
              };
            } else if (!overDraft && errors.paymasterGasTank?.deposit?.amount !== undefined) {
              errors.paymasterGasTank = {
                ...errors.paymasterGasTank,
                deposit: undefined,
              };
            }
          } else {
            errors.paymasterGasTank = {
              ...errors.paymasterGasTank,
              deposit: undefined,
            };
          }

          // dynamically check if all fields in paymasterGasTank are undefined before clearing the object
          if (
            errors.paymasterGasTank &&
            Object.values(errors.paymasterGasTank).every(field => field === undefined)
          ) {
            errors.paymasterGasTank = undefined;
          }
        } else {
          errors.paymasterGasTank = undefined;
        }

        // if (values.revenueSharing) {
        //   const existingWallets = [...(revShareWallets ?? [])];
        //   const formUpdateToWallets = values.revenueSharing?.existing;
        //   const formNewWallets = values.revenueSharing?.new;
        //   const walletErrors = {} as {
        //     new: RevenueSharingWalletFormError[];
        //     existing: RevenueSharingWalletFormError[];
        //   };

        //   const updateRevenueSharingErrors = async (
        //     _formWallet: RevenueSharingWalletFormValues,
        //     _walletIndex: number,
        //     _formType: 'new' | 'existing',
        //   ) => {
        //     const existingWallet = existingWallets[_walletIndex]; // possibly undefined

        //     const formWallet = formUpdateToWallets[_walletIndex];
        //     const walletError = walletErrors[_formType][_walletIndex];

        //     // handle wallet name
        //     if (formWallet?.name && !existingWallet) {
        //       // no validation needed
        //     } else if (!!existingWallet && !formWallet?.name) {
        //       walletError.name = 'Name is required';
        //     } else {
        //       // do nothing
        //     }

        //     // handle splits
        //     if (formWallet?.splits && formWallet.splits.length > 0) {
        //       const totalSplitPercentage = formWallet.splits.reduce(
        //         (total, s) => total + Number(s?.percentage || 0),
        //         0,
        //       );
        //       for (let splitIndex = 0; splitIndex < formWallet.splits.length; splitIndex++) {
        //         walletError.splits![splitIndex] = {
        //           address: undefined,
        //           percentage: undefined,
        //         };
        //         const split = formWallet.splits[splitIndex];
        //         if (split?.address) {
        //           const validation = await validateAddress({ address: split.address });
        //           if (!validation.validation.isValidAddress) {
        //             walletError.splits![splitIndex].address = 'Invalid split address';
        //           }
        //         } else {
        //           walletError.splits![splitIndex].address = 'Split Address is required';
        //         }

        //         if (split?.percentage) {
        //           const percentage = Number(split.percentage);
        //           if (percentage < 0 || percentage > 100) {
        //             walletError.splits![splitIndex].percentage =
        //               'Split Percentage must be between 0 and 100';
        //           }
        //           if (totalSplitPercentage > 100) {
        //             walletError.splits![splitIndex].percentage = 'Total percentage must be 100%';
        //           }
        //         } else {
        //           walletError.splits![splitIndex].percentage = 'Split Percentage is required';
        //         }
        //       }
        //     } else if (formWallet.splits && formWallet.splits.length === 0) {
        //       // validation handled by splits array
        //     }
        //     return walletErrors;
        //   };

        //   if (formNewWallets && formNewWallets.length > 0) {
        //     for (let walletIndex = 0; walletIndex < formNewWallets.length; walletIndex++) {
        //       updateRevenueSharingErrors(formNewWallets[walletIndex], walletIndex, 'new');
        //     }
        //   }

        //   if (formUpdateToWallets && formUpdateToWallets.length > 0) {
        //     for (let walletIndex = 0; walletIndex < formUpdateToWallets.length; walletIndex++) {
        //       updateRevenueSharingErrors(formUpdateToWallets[walletIndex], walletIndex, 'existing');
        //     }
        //   }

        //   if (
        //     (walletErrors.new &&
        //       walletErrors.existing &&
        //       Object.values(walletErrors.new).length > 0) ||
        //     Object.values(walletErrors.existing).length > 0
        //   ) {
        //     errors.revenueSharing = {
        //       existing: walletErrors.existing,
        //       new: walletErrors.new,
        //     };
        //   } else {
        //     errors.revenueSharing = undefined;
        //   }
        // }

        if (Object.values(errors).every(e => e === undefined)) {
          errors = {};
        }

        return errors;
      }}
      onSubmit={values => {
        submitAllSettingsEditsProposal(values);
        closeAllModals();
      }}
    >
      <Form>
        <ModalProvider
          baseZIndex={2000}
          closeBaseModal={closeModal}
        >
          <Flex
            flexDirection="column"
            height="90vh"
            textColor="color-neutral-100"
            pl="1"
            overflowY="auto"
          >
            <Flex
              flex="1"
              height="100%"
              pl="1"
            >
              <SettingsNavigation onSettingsNavigationClick={handleSettingsNavigationClick} />
              <Divider vertical />
              {settingsContent}
            </Flex>

            <Divider />
            <ActionButtons />
          </Flex>
        </ModalProvider>
      </Form>
    </Formik>
  );
}
