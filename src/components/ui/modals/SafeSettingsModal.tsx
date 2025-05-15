import { Box, Button, Flex } from '@chakra-ui/react';
import { abis } from '@fractal-framework/fractal-contracts';
import { Formik, Form, useFormikContext } from 'formik';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { encodeAbiParameters, encodeFunctionData, parseAbiParameters } from 'viem';
import { ZodiacModuleProxyFactoryAbi } from '../../../assets/abi/ZodiacModuleProxyFactoryAbi';
import { usePaymasterDepositInfo } from '../../../hooks/DAO/accountAbstraction/usePaymasterDepositInfo';
import { useCurrentDAOKey } from '../../../hooks/DAO/useCurrentDAOKey';
import { useValidationAddress } from '../../../hooks/schemas/common/useValidationAddress';
import { useCanUserCreateProposal } from '../../../hooks/utils/useCanUserSubmitProposal';
import { useInstallVersionedVotingStrategy } from '../../../hooks/utils/useInstallVersionedVotingStrategy';
import { SafeGeneralSettingsPage } from '../../../pages/dao/settings/general/SafeGeneralSettingsPage';
import { useStore } from '../../../providers/App/AppProvider';
import { useNetworkConfigStore } from '../../../providers/NetworkConfig/useNetworkConfigStore';
import { BigIntValuePair } from '../../../types';
import {
  getPaymasterSaltNonce,
  getPaymasterAddress,
  getVoteSelectorAndValidator,
} from '../../../utils/gaslessVoting';
import { validateENSName } from '../../../utils/url';
import { SettingsNavigation } from '../../SafeSettings/SettingsNavigation';
import { NewSignerItem } from '../../SafeSettings/Signers/SignersContainer';
import Divider from '../utils/Divider';

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
  permissions?: {
    proposerThreshold?: BigIntValuePair;
  };
};

type MultisigEditGovernanceFormikErrors = {
  newSigners?: { key: string; error: string }[];
  threshold?: string;
};

type GeneralEditFormikErrors = {
  name?: string;
  snapshot?: string;
};

export type SafeSettingsFormikErrors = {
  multisig?: MultisigEditGovernanceFormikErrors;
  general?: GeneralEditFormikErrors;
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
    node: { safe, paymasterAddress },
    governanceContracts: { strategies },
  } = useStore({ daoKey });

  const [settingsContent, setSettingsContent] = useState(<SafeGeneralSettingsPage />);

  const handleSettingsNavigationClick = (content: JSX.Element) => {
    setSettingsContent(content);
  };

  const { canUserCreateProposal } = useCanUserCreateProposal();

  const { t } = useTranslation(['modals', 'common']);

  const { validateAddress } = useValidationAddress();

  const {
    chain: { id: chainId },
    contracts: { keyValuePairs, accountAbstraction, paymaster, zodiacModuleProxyFactory },
    bundlerMinimumStake,
  } = useNetworkConfigStore();

  function ActionButtons() {
    const { values } = useFormikContext<SafeSettingsEdits>();
    const { errors } = useFormikContext<SafeSettingsFormikErrors>();

    const hasEdits = Object.keys(values).some(key => values[key as keyof SafeSettingsEdits]);
    const hasErrors =
      Object.keys(errors.general ?? {}).some(
        key => (errors.general as GeneralEditFormikErrors)[key as keyof GeneralEditFormikErrors],
      ) ||
      Object.keys(errors.multisig ?? {}).some(
        key =>
          (errors.multisig as MultisigEditGovernanceFormikErrors)[
            key as keyof MultisigEditGovernanceFormikErrors
          ],
      );

    return (
      <Flex
        flexDirection="row"
        justifyContent="flex-end"
        mt="1rem"
        mr={4}
        alignItems="center"
        alignSelf="center"
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

  const { buildInstallVersionedVotingStrategies } = useInstallVersionedVotingStrategy();
  const { depositInfo } = usePaymasterDepositInfo();

  const handleEditGeneralGovernance = async (updatedValues: SafeSettingsEdits) => {
    const changeTitles = [];
    const keyArgs = [];
    const valueArgs = [];
    const accountAbstractionSupported = bundlerMinimumStake !== undefined;
    const stakingRequired = accountAbstractionSupported && bundlerMinimumStake > 0n;

    if (updatedValues.general?.name) {
      changeTitles.push(t('updatesSafeName', { ns: 'proposalMetadata' }));
      keyArgs.push('daoName');
      valueArgs.push(updatedValues.general.name);
    }

    if (updatedValues.general?.snapshot) {
      changeTitles.push(t('updateSnapshotSpace', { ns: 'proposalMetadata' }));
      keyArgs.push('snapshotENS');
      valueArgs.push(updatedValues.general.snapshot);
    }

    if (updatedValues.general?.sponsoredVoting) {
      keyArgs.push('gaslessVotingEnabled');
      if (updatedValues.general.sponsoredVoting) {
        changeTitles.push(t('enableGaslessVoting', { ns: 'proposalMetadata' }));
        valueArgs.push('true');
      } else {
        changeTitles.push(t('disableGaslessVoting', { ns: 'proposalMetadata' }));
        valueArgs.push('false');
      }
    }

    // const title = changeTitles.join(`; `);

    const targets = [keyValuePairs];
    const calldatas = [
      encodeFunctionData({
        abi: abis.KeyValuePairs,
        functionName: 'updateValues',
        args: [keyArgs, valueArgs],
      }),
    ];
    const values = [0n];

    if (updatedValues.general?.sponsoredVoting) {
      if (!safe?.address) {
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
              safe.address,
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
              getPaymasterSaltNonce(safe.address, chainId),
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
        safeAddress: safe.address,
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

    // const proposalData: ProposalExecuteData = {
    //   metaData: {
    //     title,
    //     description: '',
    //     documentationUrl: '',
    //   },
    //   targets,
    //   values: values,
    //   calldatas,
    // };
  };

  // const { submitProposal } = useSubmitProposal();

  const submitAllSettingsEditsProposal = async (values: SafeSettingsEdits) => {
    const { general } = values;
    if (general) {
      await handleEditGeneralGovernance(values);
    }

    // submitProposal({
    //   safeAddress: safe?.address,
    //   proposalData,
    //   nonce: safe?.nextNonce,
    //   pendingToastMessage: t('proposalCreatePendingToastMessage', { ns: 'proposal' }),
    //   successToastMessage: t('proposalCreateSuccessToastMessage', { ns: 'proposal' }),
    //   failedToastMessage: t('proposalCreateFailureToastMessage', { ns: 'proposal' }),
    // });
  };

  return (
    <Formik<SafeSettingsEdits>
      initialValues={{}}
      validate={async values => {
        const errors: SafeSettingsFormikErrors = {};

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

        if (values.general) {
          const { snapshot } = values.general;
          const errorsGeneral = errors.general ?? {};

          if (snapshot && !validateENSName(snapshot)) {
            errorsGeneral.snapshot = t('errorInvalidENSName', { ns: 'common' });
            errors.general = errorsGeneral;
          }
        } else {
          errors.general = undefined;
        }

        return errors;
      }}
      onSubmit={values => {
        closeAllModals();
        submitAllSettingsEditsProposal(values);
      }}
    >
      <Form>
        <Box
          flexDirection="column"
          height="85vh"
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
        </Box>
      </Form>
    </Formik>
  );
}
