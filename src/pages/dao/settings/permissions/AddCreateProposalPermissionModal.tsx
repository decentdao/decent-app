import { Button, Flex, IconButton, Show, Text } from '@chakra-ui/react';
import { abis } from '@fractal-framework/fractal-contracts';
import { ArrowLeft, Trash, X } from '@phosphor-icons/react';
import { FormikContextType } from 'formik';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  encodeAbiParameters,
  encodeFunctionData,
  encodePacked,
  getContract,
  getCreate2Address,
  keccak256,
  parseAbiParameters,
  zeroAddress,
} from 'viem';
import { SafePermissionsStrategyAction } from '../../../../components/SafeSettings/SafePermissionsStrategyAction';
import { SettingsPermissionsStrategyForm } from '../../../../components/SafeSettings/SettingsPermissionsStrategyForm';
import { Card } from '../../../../components/ui/cards/Card';
import { ModalType } from '../../../../components/ui/modals/ModalProvider';
import { SafeSettingsEdits } from '../../../../components/ui/modals/SafeSettingsModal';
import { useDecentModal } from '../../../../components/ui/modals/useDecentModal';
import NestedPageHeader from '../../../../components/ui/page/Header/NestedPageHeader';
import Divider from '../../../../components/ui/utils/Divider';
import {
  linearERC20VotingWithWhitelistSetupParams,
  linearERC20VotingWithWhitelistV1SetupParams,
  linearERC721VotingWithWhitelistSetupParams,
  linearERC721VotingWithWhitelistV1SetupParams,
} from '../../../../constants/params';
import { DAO_ROUTES } from '../../../../constants/routes';
import { getRandomBytes } from '../../../../helpers';
import useFeatureFlag from '../../../../helpers/environmentFeatureFlags';
import { useCurrentDAOKey } from '../../../../hooks/DAO/useCurrentDAOKey';
import useNetworkPublicClient from '../../../../hooks/useNetworkPublicClient';
import { generateContractByteCodeLinear } from '../../../../models/helpers/utils';
import { useStore } from '../../../../providers/App/AppProvider';
import { useNetworkConfigStore } from '../../../../providers/NetworkConfig/useNetworkConfigStore';
import { useProposalActionsStore } from '../../../../store/actions/useProposalActionsStore';
import {
  AzoriusGovernance,
  BigIntValuePair,
  CreateProposalTransaction,
  ProposalActionType,
} from '../../../../types';

// @todo Near-duplicate of SafePermissionsCreateProposal.tsx. Pending refactor and/or cleanup.
// https://linear.app/decent-labs/issue/ENG-842/fix-permissions-settings-ux-flows
export function AddCreateProposalPermissionModal({
  closeModal,
  formikContext,
}: {
  closeModal: () => void;
  formikContext: FormikContextType<SafeSettingsEdits>;
}) {
  const publicClient = useNetworkPublicClient();
  const { t } = useTranslation(['settings', 'common', 'modals']);
  const {
    addressPrefix,
    contracts: {
      linearVotingErc20MasterCopy,
      linearVotingErc721MasterCopy,
      linearVotingErc20V1MasterCopy,
      linearVotingErc721V1MasterCopy,
      zodiacModuleProxyFactory,
      hatsProtocol,
      accountAbstraction,
    },
  } = useNetworkConfigStore();
  const [searchParams] = useSearchParams();
  const votingStrategyAddress = searchParams.get('votingStrategy');
  const navigate = useNavigate();
  const { daoKey } = useCurrentDAOKey();
  const {
    governance,
    governanceContracts: {
      linearVotingErc20Address,
      linearVotingErc721Address,
      linearVotingErc20WithHatsWhitelistingAddress,
      linearVotingErc721WithHatsWhitelistingAddress,
      moduleAzoriusAddress,
    },
    node: { safe },
  } = useStore({ daoKey });
  const azoriusGovernance = governance as AzoriusGovernance;

  const openConfirmDeleteStrategyModal = useDecentModal(ModalType.CONFIRM_DELETE_STRATEGY);
  const { addAction, resetActions } = useProposalActionsStore();

  const { values, setFieldValue } = formikContext;
  const { permissions: permissionsEdits } = values;

  const proposerThresholdFromGovernanceObject = (governanceObject: AzoriusGovernance) => {
    return {
      bigintValue: BigInt(governanceObject.votingStrategy?.proposerThreshold?.value ?? 0),
      value: governanceObject.votingStrategy?.proposerThreshold?.formatted ?? '0',
    };
  };

  const [existingProposerThreshold, setExistingProposerThreshold] = useState<BigIntValuePair>(
    proposerThresholdFromGovernanceObject(azoriusGovernance),
  );

  useEffect(() => {
    setExistingProposerThreshold(proposerThresholdFromGovernanceObject(azoriusGovernance));
  }, [azoriusGovernance]);

  const gaslessVotingFeatureEnabled = useFeatureFlag('flag_gasless_voting');

  if (!safe) return null;

  const settingsPermissionsPath = DAO_ROUTES.settingsPermissions.relative(
    addressPrefix,
    safe.address,
  );

  const handleCreateProposal = async () => {
    if (existingProposerThreshold.bigintValue !== undefined && moduleAzoriusAddress) {
      let transactions: CreateProposalTransaction[];
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
                value: existingProposerThreshold.bigintValue.toString(),
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
                value: existingProposerThreshold.bigintValue.toString(),
              },
            ],
          },
        ];
      } else if (linearVotingErc20WithHatsWhitelistingAddress) {
        // @todo - definitely could be more DRY here and with useCreateRoles
        actionType = ProposalActionType.ADD;
        const strategyNonce = getRandomBytes();
        const linearERC20VotingMasterCopyContract = getContract({
          abi: abis.LinearERC20Voting,
          address: linearVotingErc20MasterCopy,
          client: publicClient,
        });

        const { votesToken, votingStrategy } = azoriusGovernance;

        if (!votesToken || !votingStrategy?.votingPeriod || !votingStrategy.quorumPercentage) {
          throw new Error('Voting strategy or votes token not found');
        }

        const quorumDenominator =
          await linearERC20VotingMasterCopyContract.read.QUORUM_DENOMINATOR();

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
            ? abis.LinearERC20VotingWithHatsProposalCreationV1
            : abis.LinearERC20VotingWithHatsProposalCreation,
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
            ? encodeAbiParameters(
                parseAbiParameters(linearERC721VotingWithWhitelistV1SetupParams),
                [
                  safe.address, // owner
                  erc721Tokens.map(token => token.address), // governance token
                  erc721Tokens.map(token => token.votingWeight),
                  moduleAzoriusAddress,
                  Number(votingStrategy.votingPeriod.value),
                  existingProposerThreshold.bigintValue,
                  500000n,
                  hatsProtocol, // hats protocol
                  [], // whitelisted hat ids
                  accountAbstraction.lightAccountFactory, // light account factory
                ],
              )
            : encodeAbiParameters(parseAbiParameters(linearERC721VotingWithWhitelistSetupParams), [
                safe.address, // owner
                erc721Tokens.map(token => token.address), // governance token
                erc721Tokens.map(token => token.votingWeight),
                moduleAzoriusAddress,
                Number(votingStrategy.votingPeriod.value),
                existingProposerThreshold.bigintValue,
                500000n,
                hatsProtocol, // hats protocol
                [], // whitelisted hat ids
              ]);

        const encodedStrategySetupData = encodeFunctionData({
          abi: gaslessVotingFeatureEnabled
            ? abis.LinearERC20VotingWithHatsProposalCreationV1
            : abis.LinearERC20VotingWithHatsProposalCreation,
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
      resetActions();
      addAction({
        actionType,
        content: (
          <SafePermissionsStrategyAction
            actionType={actionType}
            proposerThreshold={existingProposerThreshold}
          />
        ),
        transactions,
      });
      navigate(DAO_ROUTES.proposalWithActionsNew.relative(addressPrefix, safe.address));
    }
  };

  function FormContent() {
    console.log(
      'permissionsEdits, existingProposerThreshold',
      permissionsEdits,
      existingProposerThreshold,
    );
    return (
      <SettingsPermissionsStrategyForm
        proposerThreshold={
          permissionsEdits?.proposerThreshold !== undefined
            ? permissionsEdits.proposerThreshold
            : existingProposerThreshold
        }
        setProposerThreshold={val => {
          let newProposerThresholdValue;

          if (permissionsEdits?.proposerThreshold === undefined) {
            newProposerThresholdValue = val;
          } else if (val.bigintValue !== existingProposerThreshold.bigintValue) {
            newProposerThresholdValue = val;
          } else {
            newProposerThresholdValue = undefined;
          }

          console.log('newProposerThresholdValue', newProposerThresholdValue);

          setFieldValue('permissions.proposerThreshold', newProposerThresholdValue);
        }}
      />
    );
  }

  function SubmitButton({ fullWidth = false }: { fullWidth?: boolean }) {
    return (
      <Button
        variant="primary"
        onClick={handleCreateProposal}
        width={fullWidth ? 'full' : 'auto'}
        mt={6}
      >
        {t('createProposal', { ns: 'modals' })}
      </Button>
    );
  }

  return (
    <>
      <Show below="md">
        <NestedPageHeader
          title={t('permissionCreateProposalsTitle')}
          backButton={{
            text: t('back', { ns: 'common' }),
            ...(votingStrategyAddress
              ? { href: settingsPermissionsPath }
              : { onClick: closeModal }),
          }}
        >
          {votingStrategyAddress && votingStrategyAddress !== zeroAddress && (
            <Flex
              width="25%"
              justifyContent="flex-end"
            >
              <Button
                variant="ghost"
                rightIcon={<Trash size={24} />}
                padding={0}
                onClick={openConfirmDeleteStrategyModal}
                color="red-1"
              >
                {t('delete', { ns: 'common' })}
              </Button>
            </Flex>
          )}
        </NestedPageHeader>

        <Card>
          <FormContent />
        </Card>

        <Flex justifyContent="flex-end">
          <SubmitButton />
        </Flex>
      </Show>

      <Show above="md">
        <Flex
          height="376px" // @dev - fixed height from design
          flexDirection="column"
          justifyContent="space-between"
        >
          <Flex justifyContent="space-between">
            {!votingStrategyAddress ||
              (votingStrategyAddress === zeroAddress && (
                <IconButton
                  size="button-md"
                  variant="ghost"
                  color="lilac-0"
                  aria-label={t('back', { ns: 'common' })}
                  onClick={closeModal}
                  icon={<ArrowLeft size={24} />}
                />
              ))}
            <Text>{t('permissionCreateProposalsTitle')}</Text>
            {votingStrategyAddress && votingStrategyAddress !== zeroAddress ? (
              <IconButton
                size="button-md"
                variant="ghost"
                color="red-1"
                icon={<Trash size={24} />}
                aria-label={t('delete', { ns: 'common' })}
                onClick={openConfirmDeleteStrategyModal}
              />
            ) : (
              <IconButton
                size="button-md"
                variant="ghost"
                color="lilac-0"
                aria-label={t('close', { ns: 'common' })}
                onClick={closeModal}
                icon={<X size={24} />}
              />
            )}
          </Flex>

          <Divider
            variant="darker"
            mx="-1.5rem"
            width="calc(100% + 3rem)"
          />

          <FormContent />
          <SubmitButton fullWidth />
        </Flex>
      </Show>
    </>
  );
}
