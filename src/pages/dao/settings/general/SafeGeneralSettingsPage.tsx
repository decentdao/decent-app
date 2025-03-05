import { Button, Flex, Show, Text } from '@chakra-ui/react';
import { abis } from '@fractal-framework/fractal-contracts';
import { ChangeEventHandler, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Address,
  encodeAbiParameters,
  encodeFunctionData,
  encodePacked,
  getContract,
  getCreate2Address,
  keccak256,
  parseAbiParameters,
  zeroAddress,
} from 'viem';
import { LinearERC20VotingV1Abi } from '../../../../assets/abi/LinearERC20VotingV1';
import { ZodiacModuleProxyFactoryAbi } from '../../../../assets/abi/ZodiacModuleProxyFactoryAbi';
import { SettingsContentBox } from '../../../../components/SafeSettings/SettingsContentBox';
import { GaslessVotingToggleDAOSettings } from '../../../../components/ui/GaslessVotingToggle';
import { InputComponent } from '../../../../components/ui/forms/InputComponent';
import { BarLoader } from '../../../../components/ui/loaders/BarLoader';
import NestedPageHeader from '../../../../components/ui/page/Header/NestedPageHeader';
import Divider from '../../../../components/ui/utils/Divider';
import { DecentPaymasterFactoryV1Abi, PAYMASTER_SALT } from '../../../../constants/common';
import { DAO_ROUTES } from '../../../../constants/routes';
import { getRandomBytes } from '../../../../helpers';
import useSubmitProposal from '../../../../hooks/DAO/proposal/useSubmitProposal';
import useNetworkPublicClient from '../../../../hooks/useNetworkPublicClient';
import { useAddressContractType } from '../../../../hooks/utils/useAddressContractType';
import { useCanUserCreateProposal } from '../../../../hooks/utils/useCanUserSubmitProposal';
import { createAccountSubstring } from '../../../../hooks/utils/useGetAccountName';
import useVotingStrategiesAddresses from '../../../../hooks/utils/useVotingStrategiesAddresses';
import { generateContractByteCodeLinear, generateSalt } from '../../../../models/helpers/utils';
import { useFractal } from '../../../../providers/App/AppProvider';
import { useNetworkConfigStore } from '../../../../providers/NetworkConfig/useNetworkConfigStore';
import { useDaoInfoStore } from '../../../../store/daoInfo/useDaoInfoStore';
import {
  AzoriusGovernance,
  BigIntValuePair,
  GovernanceType,
  ProposalExecuteData,
} from '../../../../types';
import { SENTINEL_MODULE } from '../../../../utils/address';
import { validateENSName } from '../../../../utils/url';

export function SafeGeneralSettingsPage() {
  const { t } = useTranslation(['settings', 'settingsMetadata']);
  const [name, setName] = useState('');
  const [snapshotENS, setSnapshotENS] = useState('');
  const [snapshotENSValid, setSnapshotENSValid] = useState<boolean>();
  const { governance, governanceContracts } = useFractal();

  const { gaslessVotingEnabled } = useDaoInfoStore();

  const [isGaslessVotingEnabledToggled, setIsGaslessVotingEnabledToggled] =
    useState(gaslessVotingEnabled);

  useEffect(() => {
    setIsGaslessVotingEnabledToggled(gaslessVotingEnabled);
  }, [gaslessVotingEnabled]);

  const [gasTankTopupAmount, setGasTankTopupAmount] = useState<BigIntValuePair>();

  const navigate = useNavigate();

  const { submitProposal } = useSubmitProposal();
  const { canUserCreateProposal } = useCanUserCreateProposal();
  const { subgraphInfo, safe } = useDaoInfoStore();
  const {
    addressPrefix,
    contracts: {
      keyValuePairs,
      paymasterFactory,
      linearVotingErc20MasterCopy,
      linearVotingErc20V1MasterCopy,
      linearVotingErc721MasterCopy,
      zodiacModuleProxyFactory,
    },
  } = useNetworkConfigStore();

  const { isIVersionSupport } = useAddressContractType();

  const { getVotingStrategies } = useVotingStrategiesAddresses();

  const safeAddress = safe?.address;

  useEffect(() => {
    if (
      subgraphInfo?.daoName &&
      safeAddress &&
      createAccountSubstring(safeAddress) !== subgraphInfo?.daoName
    ) {
      setName(subgraphInfo.daoName);
    }

    if (subgraphInfo?.daoSnapshotENS) {
      setSnapshotENS(subgraphInfo?.daoSnapshotENS);
    }
  }, [subgraphInfo?.daoName, subgraphInfo?.daoSnapshotENS, safeAddress]);

  const handleSnapshotENSChange: ChangeEventHandler<HTMLInputElement> = e => {
    const lowerCasedValue = e.target.value.toLowerCase();
    setSnapshotENS(lowerCasedValue);
    if (
      validateENSName(lowerCasedValue) ||
      (e.target.value === '' && subgraphInfo?.daoSnapshotENS)
    ) {
      setSnapshotENSValid(true);
    } else {
      setSnapshotENSValid(false);
    }
  };

  const submitProposalSuccessCallback = () => {
    if (safeAddress) {
      navigate(DAO_ROUTES.proposals.relative(addressPrefix, safeAddress));
    }
  };

  const nameChanged = name !== subgraphInfo?.daoName;
  const snapshotChanged = snapshotENSValid && snapshotENS !== subgraphInfo?.daoSnapshotENS;
  const gaslessVotingChanged = isGaslessVotingEnabledToggled !== gaslessVotingEnabled;
  const gasTankTopupAmountSet =
    gasTankTopupAmount?.bigintValue !== undefined && gasTankTopupAmount.bigintValue > 0n;

  const publicClient = useNetworkPublicClient();

  const buildDeployVersionedVotingStrategy = useCallback(async () => {
    const { moduleAzoriusAddress, linearVotingErc20Address, linearVotingErc721Address } =
      governanceContracts;
    if (!safeAddress || !moduleAzoriusAddress) {
      return;
    }
    const azoriusGovernance = governance as AzoriusGovernance;
    const { votingStrategy, votesToken, erc721Tokens } = azoriusGovernance;
    if (azoriusGovernance.type === GovernanceType.AZORIUS_ERC20) {
      if (!votesToken || !votingStrategy?.quorumPercentage || !linearVotingErc20Address) {
        return;
      }

      const votingStrategyContract = getContract({
        abi: abis.LinearERC20Voting,
        address: linearVotingErc20Address,
        client: publicClient,
      });

      const linearERC20VotingMasterCopyContract = getContract({
        abi: abis.LinearERC20Voting,
        address: linearVotingErc20MasterCopy,
        client: publicClient,
      });
      const existingVotingPeriod = await votingStrategyContract.read.votingPeriod();
      const quorumDenominator = await linearERC20VotingMasterCopyContract.read.QUORUM_DENOMINATOR();
      const encodedStrategyInitParams = encodeAbiParameters(
        parseAbiParameters('address, address, address, uint32, uint256, uint256, uint256'),
        [
          safeAddress, // owner
          votesToken.address, // governance token
          moduleAzoriusAddress, // Azorius module
          existingVotingPeriod,
          1n,
          (votingStrategy.quorumPercentage.value * quorumDenominator) / 100n, // quorom numerator, denominator is 1,000,000, so quorum percentage is quorumNumerator * 100 / quorumDenominator
          500000n, // basis numerator, denominator is 1,000,000, so basis percentage is 50% (simple majority)
        ],
      );

      const encodedStrategySetupData = encodeFunctionData({
        abi: LinearERC20VotingV1Abi, // @todo: use the deployed abi
        functionName: 'setUp',
        args: [encodedStrategyInitParams],
      });

      const strategyNonce = getRandomBytes();
      const deployVotingStrategyTx = {
        targetAddress: zodiacModuleProxyFactory,
        calldata: encodeFunctionData({
          abi: ZodiacModuleProxyFactoryAbi,
          functionName: 'deployModule',
          args: [linearVotingErc20V1MasterCopy, encodedStrategySetupData, strategyNonce],
        }),
      };

      const strategySalt = generateSalt(encodedStrategySetupData, strategyNonce);

      const strategyByteCode = generateContractByteCodeLinear(linearVotingErc20V1MasterCopy);
      const predictedStrategyAddress = getCreate2Address({
        from: zodiacModuleProxyFactory,
        salt: strategySalt,
        bytecodeHash: keccak256(encodePacked(['bytes'], [strategyByteCode])),
      });

      const enableDeployedVotingStrategyTx = {
        targetAddress: moduleAzoriusAddress,
        calldata: encodeFunctionData({
          abi: abis.Azorius,
          functionName: 'enableStrategy',
          args: [predictedStrategyAddress],
        }),
      };

      return [deployVotingStrategyTx, enableDeployedVotingStrategyTx];
    } else if (azoriusGovernance.type === GovernanceType.AZORIUS_ERC721) {
      if (!erc721Tokens || !votingStrategy?.quorumThreshold || !linearVotingErc721Address) {
        return;
      }

      const strategyNonce = getRandomBytes();
      const votingStrategyContract = getContract({
        abi: abis.LinearERC721Voting,
        address: linearVotingErc721Address,
        client: publicClient,
      });
      const existingVotingPeriod = await votingStrategyContract.read.votingPeriod();

      const encodedStrategyInitParams = encodeAbiParameters(
        parseAbiParameters(
          'address, address[], uint256[], address, uint32, uint256, uint256, uint256',
        ),
        [
          safeAddress, // owner
          erc721Tokens.map(token => token.address), // governance tokens addresses
          erc721Tokens.map(token => token.votingWeight), // governance tokens weights
          moduleAzoriusAddress, // Azorius module
          existingVotingPeriod,
          votingStrategy.quorumThreshold.value, // quorom threshold, number of yes + abstain votes has to >= threshold
          1n, // proposer threshold, how much is needed to create a proposal.
          500000n, // basis numerator, denominator is 1,000,000, so basis percentage is 50% (simple majority)
        ],
      );

      const encodedStrategySetupData = encodeFunctionData({
        abi: abis.LinearERC721Voting,
        functionName: 'setUp',
        args: [encodedStrategyInitParams],
      });

      const deployWhitelistingVotingStrategyTx = {
        targetAddress: zodiacModuleProxyFactory,
        calldata: encodeFunctionData({
          abi: ZodiacModuleProxyFactoryAbi,
          functionName: 'deployModule',
          args: [linearVotingErc721MasterCopy, encodedStrategySetupData, strategyNonce],
        }),
      };

      const strategyByteCodeLinear = generateContractByteCodeLinear(linearVotingErc721MasterCopy);

      const strategySalt = generateSalt(encodedStrategySetupData, strategyNonce);

      const predictedStrategyAddress = getCreate2Address({
        from: zodiacModuleProxyFactory,
        salt: strategySalt,
        bytecodeHash: keccak256(encodePacked(['bytes'], [strategyByteCodeLinear])),
      });

      const enableDeployedVotingStrategyTx = {
        targetAddress: moduleAzoriusAddress,
        calldata: encodeFunctionData({
          abi: abis.Azorius,
          functionName: 'enableStrategy',
          args: [predictedStrategyAddress],
        }),
      };

      return [deployWhitelistingVotingStrategyTx, enableDeployedVotingStrategyTx];
    } else {
      throw new Error('Can not deploy Whitelisting Voting Strategy - unsupported governance type!');
    }
  }, [
    governanceContracts,
    safeAddress,
    governance,
    publicClient,
    linearVotingErc20MasterCopy,
    zodiacModuleProxyFactory,
    linearVotingErc20V1MasterCopy,
    linearVotingErc721MasterCopy,
  ]);

  console.log('gaslessVotingChanged', gaslessVotingChanged);

  const handleEditGeneralGovernance = async () => {
    const changeTitles = [];
    const keyArgs = [];
    const valueArgs = [];

    if (nameChanged) {
      changeTitles.push(t('updatesSafeName', { ns: 'proposalMetadata' }));
      keyArgs.push('daoName');
      valueArgs.push(name);
    }

    if (snapshotChanged) {
      changeTitles.push(t('updateSnapshotSpace', { ns: 'proposalMetadata' }));
      keyArgs.push('snapshotENS');
      valueArgs.push(snapshotENS);
    }

    if (gaslessVotingChanged) {
      changeTitles.push(t('enableGaslessVoting', { ns: 'proposalMetadata' }));

      keyArgs.push('gaslessVotingEnabled');
      valueArgs.push(`${isGaslessVotingEnabledToggled}`);
    }

    if (gasTankTopupAmountSet) {
      changeTitles.push(t('topupGasTank', { ns: 'proposalMetadata' }));

      // @todo add tx to send `gasTankTopupAmount` to gas tank address
    }

    const title = changeTitles.join(`; `);

    const targets = [keyValuePairs];
    const calldatas = [
      encodeFunctionData({
        abi: abis.KeyValuePairs,
        functionName: 'updateValues',
        args: [keyArgs, valueArgs],
      }),
    ];
    const values = [0n];

    if (gaslessVotingChanged && isGaslessVotingEnabledToggled) {
      targets.push(paymasterFactory);
      calldatas.push(
        encodeFunctionData({
          // @todo replace with the deployed abi
          abi: DecentPaymasterFactoryV1Abi,
          functionName: 'createPaymaster',
          args: [safeAddress!, BigInt(PAYMASTER_SALT)],
        }),
      );
      values.push(0n);

      const modulesAddresses = safe?.modulesAddresses;
      if (modulesAddresses) {
        let isUpdatedModule = false;
        let i = 0;
        while (!isUpdatedModule && i < modulesAddresses.length) {
          const moduleAddress = modulesAddresses[i];
          isUpdatedModule = await isIVersionSupport(moduleAddress);
          i++;
        }

        if (!isUpdatedModule) {
          // The safe is using the old modules.
          // Disable the old voting strategy and enable the new one.
          const moduleAzoriusAddress = governanceContracts.moduleAzoriusAddress;
          if (!moduleAzoriusAddress) {
            throw new Error('No module Azorius address');
          }

          const strategies = await getVotingStrategies();
          if (!strategies) {
            throw new Error('No strategies found');
          }

          const strategyToDisable =
            governanceContracts.linearVotingErc20Address ||
            governanceContracts.linearVotingErc721Address;
          if (!strategyToDisable) {
            throw new Error('No strategy to disable');
          }

          // Find the previous strategy for the one to disable
          let prevStrategy: Address = SENTINEL_MODULE;
          for (let j = 0; j < strategies.length; j++) {
            if (strategies[j].strategyAddress === strategyToDisable) {
              break;
            }
            prevStrategy = strategies[j].strategyAddress;
          }

          // Disable the old strategy
          targets.push(moduleAzoriusAddress);
          calldatas.push(
            encodeFunctionData({
              abi: abis.Azorius,
              functionName: 'disableStrategy',
              args: [prevStrategy, strategyToDisable],
            }),
          );
          values.push(0n);

          // Enable the new strategy
          const deployVersionedStrategyTxData = await buildDeployVersionedVotingStrategy();
          if (!deployVersionedStrategyTxData) {
            throw new Error('Error encoding transaction for deploying versioned voting strategy');
          }

          targets.push(...deployVersionedStrategyTxData.map(tx => tx.targetAddress));
          calldatas.push(...deployVersionedStrategyTxData.map(tx => tx.calldata));
          values.push(...deployVersionedStrategyTxData.map(() => 0n));
        }
      }
    }

    const proposalData: ProposalExecuteData = {
      metaData: {
        title,
        description: '',
        documentationUrl: '',
      },
      targets,
      values,
      calldatas,
    };

    submitProposal({
      proposalData,
      nonce: safe?.nextNonce,
      pendingToastMessage: t('proposalCreatePendingToastMessage', { ns: 'proposal' }),
      successToastMessage: t('proposalCreateSuccessToastMessage', { ns: 'proposal' }),
      failedToastMessage: t('proposalCreateFailureToastMessage', { ns: 'proposal' }),
      successCallback: submitProposalSuccessCallback,
    });
  };

  return (
    <>
      <Show below="md">
        <NestedPageHeader
          title={t('daoSettingsGeneral')}
          backButton={{
            text: t('settings'),
            href: DAO_ROUTES.settings.relative(addressPrefix, safeAddress || zeroAddress),
          }}
        />
      </Show>
      {!!safe ? (
        <SettingsContentBox>
          <Flex
            flexDir="column"
            gap="1rem"
          >
            <Text textStyle="heading-small">{t('daoMetadataName')}</Text>
            <InputComponent
              isRequired={false}
              onChange={e => setName(e.target.value)}
              disabled={!canUserCreateProposal}
              value={name}
              placeholder="Amazing DAO"
              testId="daoSettings.name"
              gridContainerProps={{
                display: 'inline-flex',
                flexWrap: 'wrap',
                flex: '1',
                width: '100%',
              }}
              inputContainerProps={{
                width: '100%',
              }}
            />
          </Flex>
          <Divider
            my="1rem"
            w={{ base: 'calc(100% + 1.5rem)', md: 'calc(100% + 3rem)' }}
            mx={{ base: '-0.75rem', md: '-1.5rem' }}
          />
          <Flex
            flexDir="column"
            gap="1rem"
          >
            <Text textStyle="heading-small">
              {subgraphInfo?.daoSnapshotENS
                ? t('daoMetadataSnapshot')
                : t('daoMetadataConnectSnapshot')}
            </Text>
            <InputComponent
              isRequired={false}
              onChange={handleSnapshotENSChange}
              value={snapshotENS}
              disabled={!canUserCreateProposal}
              placeholder="example.eth"
              testId="daoSettings.snapshotENS"
              gridContainerProps={{
                display: 'inline-flex',
                flexWrap: 'wrap',
                flex: '1',
                width: '100%',
              }}
              inputContainerProps={{
                width: '100%',
              }}
            />
          </Flex>

          <GaslessVotingToggleDAOSettings
            isEnabled={isGaslessVotingEnabledToggled}
            onToggle={() => {
              setIsGaslessVotingEnabledToggled(!isGaslessVotingEnabledToggled);
            }}
            onGasTankTopupAmountChange={setGasTankTopupAmount}
          />
          {canUserCreateProposal && (
            <>
              <Divider
                my="1rem"
                w={{ base: 'calc(100% + 1.5rem)', md: 'calc(100% + 3rem)' }}
                mx={{ base: '-0.75rem', md: '-1.5rem' }}
              />
              <Button
                variant="secondary"
                size="sm"
                marginLeft="auto"
                isDisabled={!nameChanged && !snapshotChanged && !gaslessVotingChanged}
                onClick={handleEditGeneralGovernance}
              >
                {t('proposeChanges')}
              </Button>
            </>
          )}
        </SettingsContentBox>
      ) : (
        <Flex
          h="8.5rem"
          width="100%"
          alignItems="center"
          justifyContent="center"
        >
          <BarLoader />
        </Flex>
      )}
    </>
  );
}
