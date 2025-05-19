import { Box, Button, Flex, Text } from '@chakra-ui/react';
import { abis } from '@fractal-framework/fractal-contracts';
import { Formik, Form, useFormikContext } from 'formik';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Address, encodeAbiParameters, encodeFunctionData, parseAbiParameters } from 'viem';
import { DAO_ROUTES } from '../../../constants/routes';
import { usePaymasterDepositInfo } from '../../../hooks/DAO/accountAbstraction/usePaymasterDepositInfo';
import { useCurrentDAOKey } from '../../../hooks/DAO/useCurrentDAOKey';
import { useValidationAddress } from '../../../hooks/schemas/common/useValidationAddress';
import { useNetworkEnsAddressAsync } from '../../../hooks/useNetworkEnsAddress';
import { useCanUserCreateProposal } from '../../../hooks/utils/useCanUserSubmitProposal';
import { useInstallVersionedVotingStrategy } from '../../../hooks/utils/useInstallVersionedVotingStrategy';
import { SafeGeneralSettingsPage } from '../../../pages/dao/settings/general/SafeGeneralSettingsPage';
import { useStore } from '../../../providers/App/AppProvider';
import { useNetworkConfigStore } from '../../../providers/NetworkConfig/useNetworkConfigStore';
import { useProposalActionsStore } from '../../../store/actions/useProposalActionsStore';
import {
  BigIntValuePair,
  CreateProposalActionData,
  CreateProposalTransaction,
  ProposalActionType,
} from '../../../types';
import { SENTINEL_MODULE } from '../../../utils/address';
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

  const { t } = useTranslation(['modals', 'common', 'proposalMetadata']);

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

  const { addAction, resetActions } = useProposalActionsStore();

  const { addressPrefix } = useNetworkConfigStore();

  const { buildInstallVersionedVotingStrategies } = useInstallVersionedVotingStrategy();
  const { depositInfo } = usePaymasterDepositInfo();
  const navigate = useNavigate();

  const { getEnsAddress } = useNetworkEnsAddressAsync();

  const ethValue = {
    bigintValue: 0n,
    value: '0',
  };

  const handleEditGeneralGovernance = async (updatedValues: SafeSettingsEdits) => {
    const changeTitles = [];
    const keyArgs: string[] = [];
    const valueArgs: string[] = [];

    const accountAbstractionSupported = bundlerMinimumStake !== undefined;
    const stakingRequired = accountAbstractionSupported && bundlerMinimumStake > 0n;

    const transactions: CreateProposalTransaction[] = [];

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

    const title = changeTitles.join(`; `);

    transactions.push({
      targetAddress: keyValuePairs,
      ethValue,
      functionName: 'updateValues',
      parameters: [
        {
          signature: 'bytes32[]',
          valueArray: keyArgs,
        },
        {
          signature: 'string[]',
          valueArray: valueArgs,
        },
      ],
    });

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
        const stakedAmount = depositInfo?.stake || 0n;

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
                signature: 'uint256',
                // one day in seconds, defined on https://github.com/alchemyplatform/rundler/blob/c17fd3dbc24d2af93fd68310031d445d5440794f/crates/sim/src/simulation/mod.rs#L170
                value: '86400', // @todo: might fail. is bigint, here string
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

  const submitAllSettingsEditsProposal = async (values: SafeSettingsEdits) => {
    if (!safe?.address) {
      throw new Error('Safe address is not set');
    }

    resetActions();
    const { general, multisig } = values;
    if (general) {
      const { action, title } = await handleEditGeneralGovernance(values);

      addAction({
        actionType: action.actionType,
        transactions: action.transactions,
        content: <Text>{title}</Text>,
      });
    }

    if (multisig) {
      const { action, title } = await handleEditMultisigGovernance(values);

      addAction({
        actionType: action.actionType,
        transactions: action.transactions,
        content: <Text>{title}</Text>,
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

        if (Object.values(errors).every(e => e === undefined)) {
          errors = {};
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
