import { TFunction } from 'i18next';
import { Address } from 'viem';
import {
  RevenueSharingWalletFormError,
  RevenueSharingWalletFormSpecialSplitsError,
  RevenueSharingWalletFormType,
  RevenueSharingWalletFormValues,
  RevenueSharingSplitFormError,
} from '../../../types/revShare';
import { validateENSName } from '../../../utils/url';
import { SafeSettingsEdits, SafeSettingsFormikErrors } from '../types';

interface ValidationDependencies {
  validateAddress: (params: {
    address: string;
  }) => Promise<{ validation: { isValidAddress: boolean } }>;
  paymasterDepositInfo?: { balance: bigint };
  userBalance?: { value: bigint };
  safeBalance?: { value: bigint };
  safe?: { address: Address; owners?: string[] } | null;
  revShareWallets?: any[];
  subgraphInfo?: { parentAddress?: string };
  stakingContractAddress?: string;
  t: TFunction;
}

export const validateMultisigSettings = async (
  values: NonNullable<SafeSettingsEdits['multisig']>,
  dependencies: ValidationDependencies,
): Promise<SafeSettingsFormikErrors['multisig']> => {
  const { validateAddress, safe, t } = dependencies;
  const { newSigners, signerThreshold, signersToRemove } = values;
  const errorsMultisig: NonNullable<SafeSettingsFormikErrors['multisig']> = {};

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
    }
  }

  if (signerThreshold && signerThreshold < 1) {
    errorsMultisig.threshold = t('errorLowSignerThreshold', { ns: 'daoCreate' });
  }

  if (signerThreshold) {
    const totalResultingSigners =
      (safe?.owners?.length ?? 0) - (signersToRemove?.length ?? 0) + (newSigners?.length ?? 0);

    if (signerThreshold > totalResultingSigners) {
      errorsMultisig.threshold = t('errorHighSignerThreshold', { ns: 'daoCreate' });
    }
  }

  return Object.keys(errorsMultisig).length > 0 ? errorsMultisig : undefined;
};

export const validateStakingSettings = async (
  values: NonNullable<SafeSettingsEdits['staking']>,
  dependencies: ValidationDependencies,
): Promise<SafeSettingsFormikErrors['staking']> => {
  const { t } = dependencies;
  const { deploying, minimumStakingPeriod } = values;
  const errorsStaking: NonNullable<SafeSettingsFormikErrors['staking']> = {};

  // Validate required fields if deploying
  if (!!deploying && minimumStakingPeriod === undefined) {
    errorsStaking.minimumStakingPeriod = t('stakingPeriodMoreThanZero', { ns: 'common' });
  }

  return Object.keys(errorsStaking).length > 0 ? errorsStaking : undefined;
};

export const validateGeneralSettings = async (
  values: NonNullable<SafeSettingsEdits['general']>,
  dependencies: ValidationDependencies,
): Promise<SafeSettingsFormikErrors['general']> => {
  const { t } = dependencies;
  const { name, snapshot } = values;
  const errorsGeneral: NonNullable<SafeSettingsFormikErrors['general']> = {};

  if (snapshot && !validateENSName(snapshot)) {
    errorsGeneral.snapshot = t('errorInvalidENSName', { ns: 'common' });
  }

  if (name !== undefined && name === '') {
    errorsGeneral.name = t('daoNameRequired', { ns: 'common' });
  }

  return Object.keys(errorsGeneral).length > 0 ? errorsGeneral : undefined;
};

export const validatePaymasterSettings = async (
  values: NonNullable<SafeSettingsEdits['paymasterGasTank']>,
  dependencies: ValidationDependencies,
): Promise<SafeSettingsFormikErrors['paymasterGasTank']> => {
  const { validateAddress, paymasterDepositInfo, userBalance, safeBalance, t } = dependencies;
  const { withdraw, deposit } = values;
  let errors: SafeSettingsFormikErrors['paymasterGasTank'] = {};

  if (withdraw) {
    if (withdraw.amount?.bigintValue !== undefined && paymasterDepositInfo?.balance !== undefined) {
      if (withdraw.amount.bigintValue > paymasterDepositInfo.balance) {
        errors = {
          ...errors,
          withdraw: {
            ...errors?.withdraw,
            amount: t('amountExceedsAvailableBalance', { ns: 'gaslessVoting' }),
          },
        };
      }
    }

    if (withdraw.recipientAddress !== undefined) {
      const validation = await validateAddress({ address: withdraw.recipientAddress });
      if (!validation.validation.isValidAddress) {
        errors = {
          ...errors,
          withdraw: {
            ...errors?.withdraw,
            recipientAddress: t('errorInvalidAddress', { ns: 'common' }),
          },
        };
      }
    }
  } else {
    errors = {
      ...errors,
      withdraw: undefined,
    };
  }

  if (deposit) {
    const balanceToDepositFrom = deposit.isDirectDeposit ? userBalance : safeBalance;

    const overDraft =
      deposit.amount?.bigintValue !== undefined &&
      balanceToDepositFrom !== undefined &&
      deposit.amount.bigintValue > balanceToDepositFrom.value;

    if (overDraft && errors?.deposit?.amount === undefined) {
      errors = {
        ...errors,
        deposit: {
          ...errors?.deposit,
          amount: t('amountExceedsAvailableBalance', { ns: 'gaslessVoting' }),
        },
      };
    } else if (!overDraft && errors?.deposit?.amount !== undefined) {
      errors = {
        ...errors,
        deposit: undefined,
      };
    }
  } else {
    errors = {
      ...errors,
      deposit: undefined,
    };
  }

  // dynamically check if all fields in paymasterGasTank are undefined before clearing the object
  if (errors && Object.values(errors).every(field => field === undefined)) {
    errors = undefined;
  }

  return errors;
};

export const validateRevenueSharingSettings = async (
  values: NonNullable<SafeSettingsEdits['revenueSharing']>,
  dependencies: ValidationDependencies,
): Promise<SafeSettingsFormikErrors['revenueSharing']> => {
  const { validateAddress, safe, revShareWallets, subgraphInfo, stakingContractAddress, t } =
    dependencies;
  const { existing: existingWallets = [], new: newWallets = [] } = values;

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
      nums.reduce<number>((tot, n) => tot + (n !== undefined && n !== '' ? Number(n) : 0), 0);

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
        const ex = existingSplits[i] as { address?: string; percentage?: number } | undefined;
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
    return revShareErrors;
  }

  return undefined;
};

export const validateFormHasEdits = (values: SafeSettingsEdits): boolean => {
  return Object.keys(values).some(key => {
    const value = values[key as keyof SafeSettingsEdits];
    return (
      value !== undefined &&
      value !== null &&
      (typeof value === 'object' ? Object.keys(value).length > 0 : true)
    );
  });
};

export const validateFormHasErrors = (errors: any): boolean => {
  return (
    Object.keys(errors.general ?? {}).some(key => (errors.general as any)[key]) ||
    Object.keys(errors.multisig ?? {}).some(key => (errors.multisig as any)[key]) ||
    Object.keys(errors.paymasterGasTank ?? {}).some(key => (errors.paymasterGasTank as any)[key]) ||
    Object.keys(errors.revenueSharing ?? {}).some(
      key => Object.keys((errors.revenueSharing as any)[key]).length > 0,
    ) ||
    Object.keys(errors.staking ?? {}).some(key => (errors.staking as any)[key])
  );
};

export const validateSafeSettingsForm = async (
  values: SafeSettingsEdits,
  dependencies: ValidationDependencies,
): Promise<SafeSettingsFormikErrors> => {
  let errors: SafeSettingsFormikErrors = {};

  if (values.multisig) {
    errors.multisig = await validateMultisigSettings(values.multisig, dependencies);
  }

  if (values.staking) {
    errors.staking = await validateStakingSettings(values.staking, dependencies);
  }

  if (values.general) {
    errors.general = await validateGeneralSettings(values.general, dependencies);
  }

  if (values.paymasterGasTank) {
    errors.paymasterGasTank = await validatePaymasterSettings(
      values.paymasterGasTank,
      dependencies,
    );
  }

  if (values.revenueSharing) {
    errors.revenueSharing = await validateRevenueSharingSettings(
      values.revenueSharing,
      dependencies,
    );
  }

  if (Object.values(errors).every(e => e === undefined)) {
    errors = {};
  }

  return errors;
};
