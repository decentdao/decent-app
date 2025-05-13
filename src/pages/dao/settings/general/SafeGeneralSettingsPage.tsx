import { Box, Flex, Show, Text } from '@chakra-ui/react';
import { abis } from '@fractal-framework/fractal-contracts';
import { useFormikContext } from 'formik';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { encodeAbiParameters, encodeFunctionData, parseAbiParameters, zeroAddress } from 'viem';
import { ZodiacModuleProxyFactoryAbi } from '../../../../assets/abi/ZodiacModuleProxyFactoryAbi';
import { GaslessVotingToggleDAOSettings } from '../../../../components/GaslessVoting/GaslessVotingToggle';
import { SettingsContentBox } from '../../../../components/SafeSettings/SettingsContentBox';
import { InputComponent } from '../../../../components/ui/forms/InputComponent';
import { BarLoader } from '../../../../components/ui/loaders/BarLoader';
import { SafeSettingsEdits } from '../../../../components/ui/modals/SafeSettingsModal';
import NestedPageHeader from '../../../../components/ui/page/Header/NestedPageHeader';
import Divider from '../../../../components/ui/utils/Divider';
import { DAO_ROUTES } from '../../../../constants/routes';
import { usePaymasterDepositInfo } from '../../../../hooks/DAO/accountAbstraction/usePaymasterDepositInfo';
import useSubmitProposal from '../../../../hooks/DAO/proposal/useSubmitProposal';
import { useCurrentDAOKey } from '../../../../hooks/DAO/useCurrentDAOKey';
import { useCanUserCreateProposal } from '../../../../hooks/utils/useCanUserSubmitProposal';
import { createAccountSubstring } from '../../../../hooks/utils/useGetAccountName';
import { useInstallVersionedVotingStrategy } from '../../../../hooks/utils/useInstallVersionedVotingStrategy';
import { useStore } from '../../../../providers/App/AppProvider';
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
  const { setFieldValue, values: formValues } = useFormikContext<SafeSettingsEdits>();

  const [existingDaoName, setExistingDaoName] = useState('');
  const [existingSnapshotENS, setExistingSnapshotENS] = useState('');

  const [snapshotENSValid, setSnapshotENSValid] = useState<boolean>();

  const { daoKey } = useCurrentDAOKey();
  const {
    governanceContracts: { strategies },
    governance: { type: votingStrategyType },
    node: { subgraphInfo, safe, gaslessVotingEnabled, paymasterAddress },
  } = useStore({ daoKey });

  const [existingIsGaslessVotingEnabledToggled, setExistingIsGaslessVotingEnabledToggled] =
    useState(gaslessVotingEnabled);

  useEffect(() => {
    setExistingIsGaslessVotingEnabledToggled(gaslessVotingEnabled);
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
      setExistingDaoName(subgraphInfo.daoName);
    }

    if (subgraphInfo?.daoSnapshotENS) {
      setExistingSnapshotENS(subgraphInfo?.daoSnapshotENS);
    }
  }, [subgraphInfo?.daoName, subgraphInfo?.daoSnapshotENS, safeAddress]);

  // @todo: move validation to parent formik
  // const handleSnapshotENSChange: ChangeEventHandler<HTMLInputElement> = e => {
  //   const lowerCasedValue = e.target.value.toLowerCase();
  //   setSnapshotENS(lowerCasedValue);
  //   if (
  //     validateENSName(lowerCasedValue) ||
  //     (e.target.value === '' && subgraphInfo?.daoSnapshotENS)
  //   ) {
  //     setSnapshotENSValid(true);
  //   } else {
  //     setSnapshotENSValid(false);
  //   }
  // };

  useEffect(() => {
    if (!!formValues.general?.snapshot && validateENSName(formValues.general?.snapshot)) {
      setSnapshotENSValid(true);
    } else {
      setSnapshotENSValid(false);
    }
  }, [formValues.general?.snapshot]);

  const nameChanged = !!existingDaoName && existingDaoName !== subgraphInfo?.daoName;
  const snapshotChanged = snapshotENSValid && existingSnapshotENS !== subgraphInfo?.daoSnapshotENS;
  const gaslessVotingChanged = existingIsGaslessVotingEnabledToggled !== gaslessVotingEnabled;

  useEffect(() => {
    if (
      !formValues.general?.name &&
      !formValues.general?.snapshot &&
      formValues.general?.sponsoredVoting === undefined
    ) {
      setFieldValue('general', undefined);
    }
  }, [setFieldValue, formValues.general]);

  const { buildInstallVersionedVotingStrategies } = useInstallVersionedVotingStrategy();

  // @todo: Move logic to parent formik submit handler
  const handleEditGeneralGovernance = async () => {
    const changeTitles = [];
    const keyArgs = [];
    const valueArgs = [];

    if (nameChanged) {
      changeTitles.push(t('updatesSafeName', { ns: 'proposalMetadata' }));
      keyArgs.push('daoName');
      valueArgs.push(existingDaoName);
    }

    if (snapshotChanged) {
      changeTitles.push(t('updateSnapshotSpace', { ns: 'proposalMetadata' }));
      keyArgs.push('snapshotENS');
      valueArgs.push(existingSnapshotENS);
    }

    if (gaslessVotingChanged) {
      keyArgs.push('gaslessVotingEnabled');
      if (existingIsGaslessVotingEnabledToggled) {
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

    if (gaslessVotingChanged && existingIsGaslessVotingEnabledToggled) {
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
                  onChange={e => {
                    const newValue =
                      e.target.value === existingDaoName ? undefined : e.target.value;
                    setFieldValue('general.name', newValue);
                  }}
                  disabled={!canUserCreateProposal}
                  value={formValues.general?.name ?? existingDaoName}
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
                  onChange={e => {
                    const lowerCasedValue = e.target.value.toLowerCase();

                    const newValue =
                      lowerCasedValue === existingSnapshotENS ? undefined : lowerCasedValue;

                    setFieldValue('general.snapshot', newValue);
                  }}
                  value={formValues.general?.snapshot ?? existingSnapshotENS}
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
                  isEnabled={
                    formValues.general?.sponsoredVoting !== undefined
                      ? formValues.general?.sponsoredVoting
                      : existingIsGaslessVotingEnabledToggled
                  }
                  onToggle={() => {
                    let newValue;

                    if (formValues.general?.sponsoredVoting === undefined) {
                      // If no value is set yet, toggle from existing state
                      newValue = !existingIsGaslessVotingEnabledToggled;
                    } else if (
                      formValues.general?.sponsoredVoting === existingIsGaslessVotingEnabledToggled
                    ) {
                      // If current form value matches existing state, which means resulting toggle results in a new value that is different from existing state, toggle current value
                      newValue = !formValues.general?.sponsoredVoting;
                    } else {
                      // Resulting value will match existing state. No changes made -- reset to undefined
                      newValue = undefined;
                    }

                    setFieldValue('general.sponsoredVoting', newValue);
                  }}
                />
              </>
            )}
          </Flex>
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
