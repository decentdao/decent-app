import { Button, Flex, Show, Text } from '@chakra-ui/react';
import { abis } from '@fractal-framework/fractal-contracts';
import { ChangeEventHandler, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { encodeAbiParameters, encodeFunctionData, parseAbiParameters, zeroAddress } from 'viem';
import { ZodiacModuleProxyFactoryAbi } from '../../../../assets/abi/ZodiacModuleProxyFactoryAbi';
import { GaslessVotingToggleDAOSettings } from '../../../../components/GaslessVoting/GaslessVotingToggle';
import { SettingsContentBox } from '../../../../components/SafeSettings/SettingsContentBox';
import { InputComponent } from '../../../../components/ui/forms/InputComponent';
import { BarLoader } from '../../../../components/ui/loaders/BarLoader';
import NestedPageHeader from '../../../../components/ui/page/Header/NestedPageHeader';
import Divider from '../../../../components/ui/utils/Divider';
import { DAO_ROUTES } from '../../../../constants/routes';
import { useDepositInfo } from '../../../../hooks/DAO/accountAbstraction/useDepositInfo';
import useSubmitProposal from '../../../../hooks/DAO/proposal/useSubmitProposal';
import { useCurrentDAOKey } from '../../../../hooks/DAO/useCurrentDAOKey';
import { useCanUserCreateProposal } from '../../../../hooks/utils/useCanUserSubmitProposal';
import { createAccountSubstring } from '../../../../hooks/utils/useGetAccountName';
import { useInstallVersionedVotingStrategy } from '../../../../hooks/utils/useInstallVersionedVotingStrategy';
import { useStore } from '../../../../providers/App/AppProvider';
import { useNetworkConfigStore } from '../../../../providers/NetworkConfig/useNetworkConfigStore';
import { useDaoInfoStore } from '../../../../store/daoInfo/useDaoInfoStore';
import { GovernanceType, ProposalExecuteData } from '../../../../types';
import {
  getPaymasterAddress,
  getPaymasterSaltNonce,
  getVoteSelectorAndValidator,
} from '../../../../utils/gaslessVoting';
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

  const { daoKey } = useCurrentDAOKey();
  const {
    governanceContracts: { strategies },
    governance: { type: votingStrategyType },
  } = useStore({ daoKey });

  const navigate = useNavigate();

  const { submitProposal } = useSubmitProposal();
  const { canUserCreateProposal } = useCanUserCreateProposal();
  const { subgraphInfo, safe } = useDaoInfoStore();
  const {
    addressPrefix,
    chain: { id: chainId },
    contracts: { keyValuePairs, accountAbstraction, paymaster, zodiacModuleProxyFactory },
    bundlerMinimumStake,
  } = useNetworkConfigStore();
  const { depositInfo } = useDepositInfo(paymasterAddress);
  const gaslessStakingFeatureEnabled = bundlerMinimumStake !== undefined;

  const isMultisigGovernance = votingStrategyType === GovernanceType.MULTISIG;
  const gaslessVotingSupported =
    !isMultisigGovernance && accountAbstraction?.entryPointv07 !== undefined;

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

  const { buildInstallVersionedVotingStrategies } = useInstallVersionedVotingStrategy();

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

      if (!accountAbstraction) {
        throw new Error('Account Abstraction addresses are not set');
      }

      if (paymasterAddress === null) {
        // Paymaster does not exist, deploy a new one
        const paymasterInitData = encodeFunctionData({
          abi: abis.DecentPaymasterV1,
          functionName: 'initialize',
          args: [
            encodeAbiParameters(parseAbiParameters(['address', 'address', 'address']), [
              safeAddress,
              accountAbstraction.entryPointv07,
              accountAbstraction.lightAccountFactory,
            ]),
          ],
        });

        targets.push(zodiacModuleProxyFactory);
        calldatas.push(
          encodeFunctionData({
            abi: ZodiacModuleProxyFactoryAbi,
            functionName: 'deployModule',
            args: [
              paymaster.decentPaymasterV1MasterCopy,
              paymasterInitData,
              getPaymasterSaltNonce(safeAddress, chainId),
            ],
          }),
        );
        values.push(0n);
      }

      // Include txs to disable any old voting strategies and enable the new ones.
      const { installVersionedStrategyTxDatas, newStrategies } =
        await buildInstallVersionedVotingStrategies();

      targets.push(...installVersionedStrategyTxDatas.map(tx => tx.targetAddress));
      calldatas.push(...installVersionedStrategyTxDatas.map(tx => tx.calldata));
      values.push(...installVersionedStrategyTxDatas.map(() => 0n));

      const predictedPaymasterAddress = getPaymasterAddress({
        safeAddress,
        zodiacModuleProxyFactory,
        paymasterMastercopy: paymaster.decentPaymasterV1MasterCopy,
        entryPoint: accountAbstraction.entryPointv07,
        lightAccountFactory: accountAbstraction.lightAccountFactory,
        chainId,
      });

      // Add stake for Paymaster if not enough
      if (gaslessStakingFeatureEnabled) {
        const stakedAmount = depositInfo?.stake || 0n;

        if (paymasterAddress === null || stakedAmount < bundlerMinimumStake) {
          const delta = bundlerMinimumStake - stakedAmount;

          targets.push(predictedPaymasterAddress);
          calldatas.push(
            encodeFunctionData({
              abi: abis.DecentPaymasterV1,
              functionName: 'addStake',
              // one day in seconds, defined on https://github.com/alchemyplatform/rundler/blob/c17fd3dbc24d2af93fd68310031d445d5440794f/crates/sim/src/simulation/mod.rs#L170
              args: [86400],
            }),
          );
          values.push(delta);
        }
      }

      newStrategies.forEach(strategy => {
        // Whitelist the new strategy's `vote` function call on the Paymaster
        // // // // // // // // // // // // // // // // // // // // // // //
        const { voteSelector, voteValidator } = getVoteSelectorAndValidator(
          strategy.type,
          paymaster,
        );

        targets.push(predictedPaymasterAddress);
        calldatas.push(
          encodeFunctionData({
            abi: abis.DecentPaymasterV1,
            functionName: 'setFunctionValidator',
            args: [strategy.address, voteSelector, voteValidator],
          }),
        );
        values.push(0n);
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

            targets.push(predictedPaymasterAddress);
            calldatas.push(
              encodeFunctionData({
                abi: abis.DecentPaymasterV1,
                functionName: 'setFunctionValidator',
                args: [strategy.address, voteSelector, voteValidator],
              }),
            );
            values.push(0n);
          });
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
