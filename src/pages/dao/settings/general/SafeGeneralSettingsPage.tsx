import { Button, Flex, Show, Text } from '@chakra-ui/react';
import { abis } from '@fractal-framework/fractal-contracts';
import { ChangeEventHandler, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { AbiItem, encodeFunctionData, getAbiItem, toFunctionSelector, zeroAddress } from 'viem';
import { DecentPaymasterFactoryV1Abi } from '../../../../assets/abi/DecentPaymasterFactoryV1Abi';
import { DecentPaymasterV1Abi } from '../../../../assets/abi/DecentPaymasterV1Abi';
import { GaslessVotingToggleDAOSettings } from '../../../../components/GaslessVoting/GaslessVotingToggle';
import { SettingsContentBox } from '../../../../components/SafeSettings/SettingsContentBox';
import { InputComponent } from '../../../../components/ui/forms/InputComponent';
import { BarLoader } from '../../../../components/ui/loaders/BarLoader';
import NestedPageHeader from '../../../../components/ui/page/Header/NestedPageHeader';
import Divider from '../../../../components/ui/utils/Divider';
import { DAO_ROUTES } from '../../../../constants/routes';
import useSubmitProposal from '../../../../hooks/DAO/proposal/useSubmitProposal';
import useNetworkPublicClient from '../../../../hooks/useNetworkPublicClient';
import { useAddressContractType } from '../../../../hooks/utils/useAddressContractType';
import { useCanUserCreateProposal } from '../../../../hooks/utils/useCanUserSubmitProposal';
import { createAccountSubstring } from '../../../../hooks/utils/useGetAccountName';
import { useInstallVersionedVotingStrategy } from '../../../../hooks/utils/useInstallVersionedVotingStrategy';
import { useFractal } from '../../../../providers/App/AppProvider';
import { useNetworkConfigStore } from '../../../../providers/NetworkConfig/useNetworkConfigStore';
import { useDaoInfoStore } from '../../../../store/daoInfo/useDaoInfoStore';
import { GovernanceType, ProposalExecuteData } from '../../../../types';
import { getPaymasterAddress, getPaymasterSalt } from '../../../../utils/gaslessVoting';
import { validateENSName } from '../../../../utils/url';

export function SafeGeneralSettingsPage() {
  const { t } = useTranslation(['settings', 'settingsMetadata']);
  const [name, setName] = useState('');
  const [snapshotENS, setSnapshotENS] = useState('');
  const [snapshotENSValid, setSnapshotENSValid] = useState<boolean>();

  const { gaslessVotingEnabled, paymasterAddress } = useDaoInfoStore();

  const [isGaslessVotingEnabledToggled, setIsGaslessVotingEnabledToggled] =
    useState(gaslessVotingEnabled);

  useEffect(() => {
    setIsGaslessVotingEnabledToggled(gaslessVotingEnabled);
  }, [gaslessVotingEnabled]);

  const {
    governanceContracts: {
      linearVotingErc20Address,
      linearVotingErc721Address,
      linearVotingErc20WithHatsWhitelistingAddress,
      linearVotingErc721WithHatsWhitelistingAddress,
    },
    governance: { type: votingStrategyType },
  } = useFractal();

  const navigate = useNavigate();

  const { submitProposal } = useSubmitProposal();
  const { canUserCreateProposal } = useCanUserCreateProposal();
  const { subgraphInfo, safe } = useDaoInfoStore();
  const {
    addressPrefix,
    chain: { id: chainId },
    contracts: { keyValuePairs, paymasterFactory, entryPointv07 },
  } = useNetworkConfigStore();

  const isMultisigGovernance = votingStrategyType === GovernanceType.MULTISIG;
  const gaslessVotingSupported = !isMultisigGovernance && entryPointv07 !== undefined;

  const publicClient = useNetworkPublicClient();

  const { isIVersionSupport } = useAddressContractType();

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

  const nameChanged = name !== subgraphInfo?.daoName;
  const snapshotChanged = snapshotENSValid && snapshotENS !== subgraphInfo?.daoSnapshotENS;
  const gaslessVotingChanged = isGaslessVotingEnabledToggled !== gaslessVotingEnabled;

  const { buildInstallVersionedVotingStrategy } = useInstallVersionedVotingStrategy();

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
      keyArgs.push('gaslessVotingEnabled');
      if (isGaslessVotingEnabledToggled) {
        changeTitles.push(t('enableGaslessVoting', { ns: 'proposalMetadata' }));
        valueArgs.push('true');
      } else {
        changeTitles.push(t('disableGaslessVoting', { ns: 'proposalMetadata' }));
        valueArgs.push('false');
      }
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
      if (!safeAddress) {
        throw new Error('Safe address is not set');
      }

      const strategyAddresses = [
        linearVotingErc20Address,
        linearVotingErc721Address,
        linearVotingErc20WithHatsWhitelistingAddress,
        linearVotingErc721WithHatsWhitelistingAddress,
      ].filter(addr => addr !== undefined);

      if (paymasterAddress === null) {
        // Paymaster does not exist, deploy a new one
        targets.push(paymasterFactory);
        calldatas.push(
          encodeFunctionData({
            // @todo (gv) replace with the deployed abi
            abi: DecentPaymasterFactoryV1Abi,
            functionName: 'createPaymaster',
            args: [safeAddress, getPaymasterSalt(safeAddress, chainId)],
          }),
        );
        values.push(0n);

        // Approve the `vote` function call on the Paymaster
        // // // // // // // // // // // // // // // // // // //
        if (strategyAddresses.length === 0 || !votingStrategyType) {
          throw new Error('No strategy addresses defined');
        }

        let voteAbiItem: AbiItem;

        if (votingStrategyType === GovernanceType.AZORIUS_ERC20) {
          voteAbiItem = getAbiItem({
            name: 'vote',
            abi: abis.LinearERC20Voting,
          });
        } else if (votingStrategyType === GovernanceType.AZORIUS_ERC721) {
          voteAbiItem = getAbiItem({
            name: 'vote',
            abi: abis.LinearERC721Voting,
          });
        } else {
          throw new Error('Invalid voting strategy type');
        }

        const voteSelector = toFunctionSelector(voteAbiItem);

        const predictedPaymasterAddress = await getPaymasterAddress({
          address: safeAddress,
          chainId,
          publicClient,
          paymasterFactory,
        });

        strategyAddresses.forEach(strategyAddress => {
          targets.push(predictedPaymasterAddress);
          calldatas.push(
            encodeFunctionData({
              abi: DecentPaymasterV1Abi,
              functionName: 'setStrategyFunctionApproval',
              args: [strategyAddress, [voteSelector], [true]],
            }),
          );
          values.push(0n);
        });
      }

      if (strategyAddresses.length) {
        // Check if all strategy contracts support the latest version
        let allStrategiesAreUpdated = true;

        for (const strategyAddress of strategyAddresses) {
          const supportsLatestVersion = await isIVersionSupport(strategyAddress);
          if (!supportsLatestVersion) {
            allStrategiesAreUpdated = false;
            break;
          }
        }

        if (!allStrategiesAreUpdated) {
          // The safe is using the old modules.
          // Include txs to disable the old voting strategy and enable the new one.
          const installVersionedStrategyTxData = await buildInstallVersionedVotingStrategy();
          if (!installVersionedStrategyTxData) {
            throw new Error('Error encoding transaction for installing versioned voting strategy');
          }

          targets.push(...installVersionedStrategyTxData.map(tx => tx.targetAddress));
          calldatas.push(...installVersionedStrategyTxData.map(tx => tx.calldata));
          values.push(...installVersionedStrategyTxData.map(() => 0n));
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
      safeAddress: safe?.address,
      proposalData,
      nonce: safe?.nextNonce,
      pendingToastMessage: t('proposalCreatePendingToastMessage', { ns: 'proposal' }),
      successToastMessage: t('proposalCreateSuccessToastMessage', { ns: 'proposal' }),
      failedToastMessage: t('proposalCreateFailureToastMessage', { ns: 'proposal' }),
      successCallback: () => {
        if (safeAddress) {
          navigate(DAO_ROUTES.proposals.relative(addressPrefix, safeAddress));
        }
      },
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

          {gaslessVotingSupported && (
            <GaslessVotingToggleDAOSettings
              isEnabled={isGaslessVotingEnabledToggled}
              onToggle={() => {
                setIsGaslessVotingEnabledToggled(!isGaslessVotingEnabledToggled);
              }}
            />
          )}
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
