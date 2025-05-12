import { Box, Button, Flex, Show, Text } from '@chakra-ui/react';
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
import { usePaymasterDepositInfo } from '../../../../hooks/DAO/accountAbstraction/usePaymasterDepositInfo';
import useSubmitProposal from '../../../../hooks/DAO/proposal/useSubmitProposal';
import { useCurrentDAOKey } from '../../../../hooks/DAO/useCurrentDAOKey';
import { useCanUserCreateProposal } from '../../../../hooks/utils/useCanUserSubmitProposal';
import { createAccountSubstring } from '../../../../hooks/utils/useGetAccountName';
import { useInstallVersionedVotingStrategy } from '../../../../hooks/utils/useInstallVersionedVotingStrategy';
import { useDAOStore } from '../../../../providers/App/AppProvider';
import { useNetworkConfigStore } from '../../../../providers/NetworkConfig/useNetworkConfigStore';
import { GovernanceType, ProposalExecuteData } from '../../../../types';
import {
  getPaymasterAddress,
  getPaymasterSaltNonce,
  getVoteSelectorAndValidator,
} from '../../../../utils/gaslessVoting';
import { validateENSName } from '../../../../utils/url';

export function SafeGeneralSettingsPage() {
  const { t } = useTranslation('settings');
  const [name, setName] = useState('');
  const [snapshotENS, setSnapshotENS] = useState('');
  const [snapshotENSValid, setSnapshotENSValid] = useState<boolean>();

  const { daoKey } = useCurrentDAOKey();
  const {
    governanceContracts: { strategies },
    governance: { type: votingStrategyType, gaslessVotingEnabled, paymasterAddress },
    node: { subgraphInfo, safe },
  } = useDAOStore({ daoKey });

  const [isGaslessVotingEnabledToggled, setIsGaslessVotingEnabledToggled] =
    useState(gaslessVotingEnabled);

  useEffect(() => {
    setIsGaslessVotingEnabledToggled(gaslessVotingEnabled);
  }, [gaslessVotingEnabled]);

  const navigate = useNavigate();

  const { submitProposal } = useSubmitProposal();
  const { canUserCreateProposal } = useCanUserCreateProposal();
  const {
    addressPrefix,
    chain: { id: chainId },
    contracts: { keyValuePairs, accountAbstraction, paymaster, zodiacModuleProxyFactory },
    bundlerMinimumStake,
  } = useNetworkConfigStore();
  const { depositInfo } = usePaymasterDepositInfo();
  const accountAbstractionSupported = bundlerMinimumStake !== undefined;
  const stakingRequired = accountAbstractionSupported && bundlerMinimumStake > 0n;

  const isMultisigGovernance = votingStrategyType === GovernanceType.MULTISIG;
  const gaslessVotingSupported = !isMultisigGovernance && accountAbstractionSupported;

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
      if (stakingRequired) {
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
          navigate(DAO_ROUTES.dao.relative(addressPrefix, safeAddress));
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
        <SettingsContentBox
          px={12}
          py={6}
        >
          <Flex
            flexDir="column"
            justifyContent="space-between"
          >
            {/* GENERAL */}
            <Text
              ml={6}
              mb={0.5}
              textStyle="body-large"
            >
              {t('daoSettingsGeneral')}
            </Text>
            <Flex
              flexDirection="column"
              w="100%"
              border="1px solid"
              borderColor="neutral-3"
              borderRadius="0.75rem"
            >
              <Flex
                flexDirection="row"
                alignItems="center"
                justifyContent="space-between"
                px={6}
                pt={2}
              >
                <Text
                  mb={2}
                  textStyle="body-small"
                >
                  {t('daoMetadataName')}
                </Text>
                <InputComponent
                  isRequired={false}
                  onChange={e => setName(e.target.value)}
                  disabled={!canUserCreateProposal}
                  value={name}
                  placeholder="Amazing DAO"
                  testId="daoSettings.name"
                  inputContainerProps={{
                    width: { base: '100%', md: '16rem' },
                  }}
                />
              </Flex>
              <Divider />
              <Flex
                flexDirection="row"
                alignItems="center"
                justifyContent="space-between"
                px={6}
                pt={2}
              >
                <Text textStyle="body-small">
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
                  inputContainerProps={{
                    width: { base: '100%', md: '16rem' },
                  }}
                />
              </Flex>
            </Flex>

            <Box h={12} />

            {/* SPONSORED VOTING */}
            {gaslessVotingSupported && (
              <>
                <Text
                  ml={6}
                  mb={0.5}
                  textStyle="body-large"
                >
                  {t('gaslessVotingLabelSettings', { ns: 'gaslessVoting' })}
                </Text>
                <GaslessVotingToggleDAOSettings
                  isEnabled={isGaslessVotingEnabledToggled}
                  onToggle={() => {
                    setIsGaslessVotingEnabledToggled(!isGaslessVotingEnabledToggled);
                  }}
                />
              </>
            )}
          </Flex>

          {/* PROPOSE BUTTON to be removed when batching settings edit actions implemented 
          (https://linear.app/decent-labs/issue/ENG-806/consolidate-all-settings-edit-actions-into-one-proposal-on-create) */}
          {canUserCreateProposal && (
            <Button
              variant="secondary"
              size="sm"
              marginLeft="auto"
              isDisabled={!nameChanged && !snapshotChanged && !gaslessVotingChanged}
              onClick={handleEditGeneralGovernance}
            >
              {t('proposeChanges')}
            </Button>
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
