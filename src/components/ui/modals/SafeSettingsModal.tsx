import { Button, Flex, Text } from '@chakra-ui/react';
import { Formik, Form, useFormikContext } from 'formik';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Address } from 'viem';
import { useAccount, useBalance } from 'wagmi';
import { DAO_ROUTES } from '../../../constants/routes';
import useFeatureFlag from '../../../helpers/environmentFeatureFlags';
import { usePaymasterDepositInfo } from '../../../hooks/DAO/accountAbstraction/usePaymasterDepositInfo';
import { useCurrentDAOKey } from '../../../hooks/DAO/useCurrentDAOKey';
import { useValidationAddress } from '../../../hooks/schemas/common/useValidationAddress';
import useNetworkPublicClient from '../../../hooks/useNetworkPublicClient';
import { useCanUserCreateProposal } from '../../../hooks/utils/useCanUserSubmitProposal';
import { useInstallVersionedVotingStrategy } from '../../../hooks/utils/useInstallVersionedVotingStrategy';
import { useDAOStore } from '../../../providers/App/AppProvider';
import { useNetworkConfigStore } from '../../../providers/NetworkConfig/useNetworkConfigStore';
import { useProposalActionsStore } from '../../../store/actions/useProposalActionsStore';
import {
  BigIntValuePair,
} from '../../../types';
import {
  RevenueSharingSplitFormError,
  RevenueSharingWalletForm,
  RevenueSharingWalletFormError,
  RevenueSharingWalletFormErrors,
  RevenueSharingWalletFormSpecialSplitsError,
  RevenueSharingWalletFormType,
  RevenueSharingWalletFormValues,
} from '../../../types/revShare';
import { validateENSName } from '../../../utils/url';
import { isNonEmpty } from '../../../utils/valueCheck';
import { handleEditRevenueShare } from '../../SafeSettings/RevenueShare/revenueShareFormHandlers';
import { SettingsNavigation } from '../../SafeSettings/SettingsNavigation';
import { NewSignerItem } from '../../SafeSettings/Signers/SignersContainer';
import { SafeGeneralSettingTab } from '../../SafeSettings/TabContents/general/SafeGeneralSettingTab';
import {
  handleEditPaymaster,
  handleEditGeneral,
  handleEditMultisigGovernance,
  handleEditAzoriusGovernance,
  handleEditPermissions,
  handleEditStaking,
} from '../../SafeSettings/handlers';
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
  revenueSharing?: RevenueSharingWalletForm;
  staking?: {
    deploying?: boolean;
    newRewardTokens?: Address[];
    minimumStakingPeriod?: BigIntValuePair;
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

type PaymasterGasTankEditFormikErrors = {
  withdraw?: { amount?: string; recipientAddress?: string };
  deposit?: { amount?: string };
};

type StakingEditFormikErrors = {
  newRewardTokens?: { key: string; error: string }[];
  minimumStakingPeriod?: string;
};

export type SafeSettingsFormikErrors = {
  multisig?: MultisigEditGovernanceFormikErrors;
  general?: GeneralEditFormikErrors;
  paymasterGasTank?: PaymasterGasTankEditFormikErrors;
  revenueSharing?: {
    existing: RevenueSharingWalletFormErrors;
    new: RevenueSharingWalletFormErrors;
  };
  staking?: StakingEditFormikErrors;
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

  const stakingContractAddress = governance?.stakedToken?.address;

  const [settingsContent, setSettingsContent] = useState(<SafeGeneralSettingTab />);

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
      votesERC20StakedV1MasterCopy,
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
        key => Object.keys((errors.revenueSharing as any)[key]).length > 0,
      ) ||
      Object.keys(errors.staking ?? {}).some(
        key => (errors.staking as StakingEditFormikErrors)[key as keyof StakingEditFormikErrors],
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

  const publicClient = useNetworkPublicClient();

  const gaslessVotingFeatureEnabled = useFeatureFlag('flag_gasless_voting');

  const ethValue = {
    bigintValue: 0n,
    value: '0',
  };


  const submitAllSettingsEditsProposal = async (values: SafeSettingsEdits) => {
    if (!safe?.address) {
      throw new Error('Safe address is not set');
    }

    resetActions();
    const { general, multisig, azorius, permissions, paymasterGasTank, staking, revenueSharing } =
      values;
    if (general) {
      const { action, title } = await handleEditGeneral(values, {
        t,
        safe,
        governance,
        accountAbstraction,
        keyValuePairs,
        ethValue,
        zodiacModuleProxyFactory,
        paymaster,
        chainId,
        bundlerMinimumStake,
        paymasterDepositInfo,
        buildInstallVersionedVotingStrategies,
        strategies,
      });

      addAction({
        actionType: action.actionType,
        transactions: action.transactions,
        content: <Text>{title}</Text>,
      });
    }

    if (paymasterGasTank) {
      const actions = await handleEditPaymaster(
        values,
        governance,
        accountAbstraction,
        publicClient,
      );

      if (actions && actions.length > 0) {
        actions.forEach(action => {
          addAction(action);
        });
      }
    }

    if (multisig) {
      const { action, title } = await handleEditMultisigGovernance(values, {
        t,
        safe,
        ethValue,
        getEnsAddress: async ({ name }) => {
          return publicClient.getEnsAddress({ name: name || '' });
        },
      });

      addAction({
        actionType: action.actionType,
        transactions: action.transactions,
        content: <Text>{title}</Text>,
      });
    }

    if (azorius) {
      const { action, title } = await handleEditAzoriusGovernance(values, {
        t,
        moduleAzoriusAddress,
        strategies,
        ethValue,
        publicClient,
      });

      addAction({
        actionType: action.actionType,
        transactions: action.transactions,
        content: <Text>{title}</Text>,
      });
    }

    if (permissions) {
      const action = await handleEditPermissions(values, {
        safe,
        governance,
        moduleAzoriusAddress,
        linearVotingErc20Address,
        linearVotingErc721Address,
        linearVotingErc20WithHatsWhitelistingAddress,
        linearVotingErc721WithHatsWhitelistingAddress,
        linearVotingErc20MasterCopy,
        linearVotingErc721MasterCopy,
        linearVotingErc20V1MasterCopy,
        linearVotingErc721V1MasterCopy,
        zodiacModuleProxyFactory,
        hatsProtocol,
        accountAbstraction,
        gaslessVotingFeatureEnabled,
        publicClient,
      });

      addAction(action);
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
    if (staking) {
      if (!zodiacModuleProxyFactory) {
        throw new Error('Zodiac module proxy factory is not available');
      }
      if (!votesERC20StakedV1MasterCopy) {
        throw new Error('VotesERC20StakedV1MasterCopy is not available');
      }
      
      const { action, title } = await handleEditStaking(values, {
        safe,
        governance,
        votesERC20StakedV1MasterCopy,
        zodiacModuleProxyFactory,
        ethValue,
        chainId,
        t,
      });

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

        if (values.staking) {
          const { deploying, minimumStakingPeriod } = values.staking;
          const errorsStaking = errors.staking ?? {};

          // Validate required fields if deploying
          if (!!deploying && minimumStakingPeriod === undefined) {
            errorsStaking.minimumStakingPeriod = t('stakingPeriodMoreThanZero', { ns: 'common' });
            errors.staking = errorsStaking;
          }
        } else {
          errors.staking = undefined;
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

        /* -------------------------------------------------------------------------- */
        /*                      REVENUE-SHARING (existing / new)                      */
        /* -------------------------------------------------------------------------- */
        if (values.revenueSharing) {
          const { existing: existingWallets = [], new: newWallets = [] } = values.revenueSharing;

          const revShareErrors: NonNullable<SafeSettingsFormikErrors['revenueSharing']> = {
            existing: {},
            new: {},
          };

          /** Validate one wallet (existing | new) in place */
          const validateWallet = async (
            wallet: RevenueSharingWalletFormValues,
            index: number,
            type: RevenueSharingWalletFormType,
          ) => {
            const walletError: RevenueSharingWalletFormError = {};

            /* ---------- name ---------- */
            if (
              (type === 'new' && !wallet.name) || // required for new wallets
              (wallet.name !== undefined && wallet.name.trim() === '')
            ) {
              walletError.name = t('walletNameRequired', { ns: 'revenueSharing' });
            }

            /* ---------- regular splits ---------- */
            if (wallet.splits && wallet.splits.length > 0) {
              await Promise.all(
                wallet.splits.map(async (split, splitIdx) => {
                  const splitErr: RevenueSharingSplitFormError = {};
                  const existingWallet = type === 'existing' ? revShareWallets?.[index] : undefined;
                  const existingSplit = existingWallet?.splits?.[splitIdx];

                  /* address */
                  if (type === 'existing') {
                    const effectiveAddress = split?.address ?? existingSplit?.address;
                    if (!effectiveAddress) {
                      splitErr.address = t('addressRequired', { ns: 'common' });
                    } else if (split?.address) {
                      const { validation } = await validateAddress({ address: split.address });
                      if (!validation.isValidAddress) {
                        splitErr.address = t('errorInvalidAddress', { ns: 'common' });
                      }
                    }
                  } else {
                    if (!split?.address) {
                      splitErr.address = t('addressRequired', { ns: 'common' });
                    } else {
                      const { validation } = await validateAddress({ address: split.address });
                      if (!validation.isValidAddress) {
                        splitErr.address = t('errorInvalidAddress', { ns: 'common' });
                      }
                    }
                  }

                  /* percentage */
                  if (type === 'existing') {
                    const effectivePct =
                      split?.percentage !== undefined && split?.percentage !== ''
                        ? split.percentage
                        : existingSplit?.percentage?.toString();
                    if (effectivePct === undefined || effectivePct === '') {
                      splitErr.percentage = t('percentageRequired', { ns: 'revenueSharing' });
                    } else if (split?.percentage !== undefined && split?.percentage !== '') {
                      const pct = Number(split.percentage);
                      if (isNaN(pct) || pct < 0 || pct > 100) {
                        splitErr.percentage = t('percentageRangeInvalid', { ns: 'revenueSharing' });
                      }
                    }
                  } else {
                    if (split?.percentage === undefined || split.percentage === '') {
                      splitErr.percentage = t('percentageRequired', { ns: 'revenueSharing' });
                    } else {
                      const pct = Number(split.percentage);
                      if (isNaN(pct) || pct < 0 || pct > 100) {
                        splitErr.percentage = t('percentageRangeInvalid', { ns: 'revenueSharing' });
                      }
                    }
                  }

                  if (Object.keys(splitErr).length > 0) {
                    walletError.splits = walletError.splits ?? {};
                    walletError.splits[splitIdx] = {
                      ...(walletError.splits[splitIdx] ?? {}),
                      ...splitErr,
                    };
                  }
                }),
              );
            }
            // Determine if we truly have no regular splits considering existing data
            const existingWallet = type === 'existing' ? revShareWallets?.[index] : undefined;
            const noRegularSplits = (() => {
              const hasFormSplits = !!wallet.splits && wallet.splits.length > 0;
              if (type === 'existing') {
                const hasExistingSplits = (existingWallet?.splits?.length ?? 0) > 0;
                return !hasFormSplits && !hasExistingSplits;
              }
              return !hasFormSplits;
            })();

            if (noRegularSplits && !wallet.specialSplits) {
              walletError.walletError = t('splitsRequired', { ns: 'revenueSharing' });
            }
            /* ---------- special splits ---------- */
            if (wallet.specialSplits) {
              const addSpecialErr = (
                key: keyof RevenueSharingWalletFormSpecialSplitsError,
                err: RevenueSharingSplitFormError,
              ) => {
                if (!walletError.specialSplits) walletError.specialSplits = {};
                walletError.specialSplits[key] = err;
              };

              const specials: (keyof typeof wallet.specialSplits)[] = [
                'dao',
                'parentDao',
                'stakingContract',
              ];

              for (const key of specials) {
                const split = wallet.specialSplits[key];
                if (!split) continue;

                const splitErr: RevenueSharingSplitFormError = {};

                /* percentage */
                if (split.percentage !== undefined) {
                  const pct = Number(split.percentage);
                  if (isNaN(pct) || pct < 0 || pct > 100) {
                    splitErr.percentage = t('percentageRangeInvalid', { ns: 'revenueSharing' });
                  }
                } else {
                  splitErr.percentage = t('percentageRequired', { ns: 'revenueSharing' });
                }

                if (Object.keys(splitErr).length > 0) addSpecialErr(key, splitErr);
              }
            }

            /* ---------- percentage total (regular + specials) ---------- */
            const sum = (...nums: (string | number | undefined)[]): number =>
              nums.reduce<number>(
                (tot, n) => tot + (n !== undefined && n !== '' ? Number(n) : 0),
                0,
              );

            // Build effective regular splits for 'existing' by merging form deltas over existing data
            const effectiveRegularSplits:
              | { address: string | undefined; percentage: number }[]
              | undefined = (() => {
              if (type !== 'existing') {
                return wallet.splits?.map(s => ({
                  address: s?.address,
                  percentage:
                    s?.percentage !== undefined && s?.percentage !== '' ? Number(s.percentage) : 0,
                }));
              }
              const existingSplits = existingWallet?.splits ?? [];
              const formSplits = wallet.splits ?? [];
              const maxLen = Math.max(existingSplits.length, formSplits.length);
              return Array.from({ length: maxLen }, (_, i) => {
                const f = formSplits[i];
                const ex = existingSplits[i] as
                  | { address?: string; percentage?: number }
                  | undefined;
                const addr = f?.address ?? ex?.address;
                const percentage =
                  f?.percentage !== undefined && f?.percentage !== ''
                    ? Number(f.percentage)
                    : ex?.percentage !== undefined
                      ? Number(ex.percentage)
                      : 0;
                return { address: addr, percentage };
              });
            })();

            let totalPct = sum(...(effectiveRegularSplits?.map(s => s.percentage) ?? []));

            if (type === 'existing' && wallet.specialSplits) {
              const specialsMap: {
                key: keyof RevenueSharingWalletFormSpecialSplitsError;
                addr?: string;
                pct?: string | number;
              }[] = [
                { key: 'dao', addr: safe?.address, pct: wallet.specialSplits.dao?.percentage },
                {
                  key: 'parentDao',
                  addr: subgraphInfo?.parentAddress ?? undefined,
                  pct: wallet.specialSplits.parentDao?.percentage,
                },
                {
                  key: 'stakingContract',
                  addr: stakingContractAddress,
                  pct: wallet.specialSplits.stakingContract?.percentage,
                },
              ];

              for (const { addr, pct } of specialsMap) {
                if (!addr || pct === undefined || pct === '') continue;
                const idx = effectiveRegularSplits?.findIndex(s => s.address === addr) ?? -1;
                if (idx >= 0 && effectiveRegularSplits) {
                  const prev = effectiveRegularSplits[idx].percentage || 0;
                  totalPct -= prev; // remove previous value for this special
                }
                totalPct += Number(pct); // add new special value
              }
            } else if (type === 'new') {
              // For new wallets, specials are additive to regular splits
              totalPct += sum(
                wallet.specialSplits?.dao?.percentage,
                wallet.specialSplits?.parentDao?.percentage,
                wallet.specialSplits?.stakingContract?.percentage,
              );
            }

            if (totalPct !== 100) {
              const msg = t('errorTotalPercentage', { ns: 'revenueSharing' });

              /* root-level (regular) split error */
              walletError.splits = walletError.splits ?? {};
              walletError.splits[0] = { ...(walletError.splits[0] ?? {}), percentage: msg };

              /* also flag every special-split that exists */
              const specials: (keyof RevenueSharingWalletFormSpecialSplitsError)[] = [
                'dao',
                'parentDao',
                'stakingContract',
              ];

              for (const key of specials) {
                if (wallet.specialSplits?.[key]) {
                  if (!walletError.specialSplits) walletError.specialSplits = {};
                  walletError.specialSplits[key] = {
                    ...(walletError.specialSplits[key] ?? {}),
                    percentage: msg,
                  };
                }
              }
            }

            /* ---------- collect ---------- */
            if (Object.keys(walletError).length > 0) {
              revShareErrors[type][index] = walletError;
            }
          };

          await Promise.all([
            ...existingWallets.map((w, i) => validateWallet(w, i, 'existing')),
            ...newWallets.map((w, i) => validateWallet(w, i, 'new')),
          ]);

          if (
            Object.keys(revShareErrors.existing).length > 0 ||
            Object.keys(revShareErrors.new).length > 0
          ) {
            errors.revenueSharing = revShareErrors;
          } else {
            errors.revenueSharing = undefined;
          }
        } else {
          errors.revenueSharing = undefined;
        }

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
