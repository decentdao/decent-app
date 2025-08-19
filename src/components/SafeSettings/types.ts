import { Address } from 'viem';
import { AzoriusGovernance, BigIntValuePair, FractalTokenType, GovernanceType } from '../../types';
import {
  RevenueSharingSplitFormError,
  RevenueSharingWalletForm,
  RevenueSharingWalletFormError,
  RevenueSharingWalletFormErrors,
  RevenueSharingWalletFormSpecialSplitsError,
  RevenueSharingWalletFormType,
  RevenueSharingWalletFormValues,
} from '../../types/revShare';

// Re-export frequently used external types for convenience in sibling modules
export type {
  AzoriusGovernance,
  BigIntValuePair,
  FractalTokenType,
  GovernanceType,
  RevenueSharingSplitFormError,
  RevenueSharingWalletForm,
  RevenueSharingWalletFormError,
  RevenueSharingWalletFormErrors,
  RevenueSharingWalletFormSpecialSplitsError,
  RevenueSharingWalletFormType,
  RevenueSharingWalletFormValues,
};

export type NewSignerItem = {
  key: string;
  address?: Address;
  isAdding: true;
  inputValue?: string;
};

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

export type MultisigEditGovernanceFormikErrors = {
  newSigners?: { key: string; error: string }[];
  threshold?: string;
};

export type GeneralEditFormikErrors = {
  name?: string;
  snapshot?: string;
};

export type PaymasterGasTankEditFormikErrors = {
  withdraw?: { amount?: string; recipientAddress?: string };
  deposit?: { amount?: string };
};

export type StakingEditFormikErrors = {
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
