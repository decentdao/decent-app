import { Address } from 'viem';

export interface RevenueSharingWalletSplit<
  A extends Address | string | undefined,
  P extends string | number | undefined,
> {
  address: A;
  percentage: P;
}

export interface RevenueSharingWallet {
  name: string;
  splits: RevenueSharingWalletSplit<Address, number>[];
  tokens: Address[];
  address: Address;
}

export interface RevenueSharingWalletForm {
  existing: RevenueSharingWalletFormValues[];
  new: RevenueSharingWalletFormValues[];
}

export interface RevenueSharingWalletFormValues {
  name?: string;
  specialSplits?: {
    dao?: Partial<RevenueSharingWalletSplit<string, string>>;
    parentDao?: Partial<RevenueSharingWalletSplit<string, string>>;
    stakingContract?: Partial<RevenueSharingWalletSplit<string, string>>;
  };
  splits?: Partial<RevenueSharingWalletSplit<string, string>>[];
  // new wallets will not have an address
  address?: string;
  // this is used to support the name edit and confirm flow
  lastEdit?: {
    name?: string;
    address?: string;
  };
}
export type RevenueSharingSplitFormError = Partial<RevenueSharingWalletSplit<string, string>>;
export type RevenueSharingSplitFormErrors = Record<number, RevenueSharingSplitFormError>;

export interface RevenueSharingWalletFormSpecialSplitsError {
  dao?: RevenueSharingSplitFormError;
  parentDao?: RevenueSharingSplitFormError;
  stakingContract?: RevenueSharingSplitFormError;
}

export interface RevenueSharingWalletFormError {
  name?: string;
  walletError?: string;
  splits?: RevenueSharingSplitFormErrors;
  specialSplits?: RevenueSharingWalletFormSpecialSplitsError;
}

export type RevenueSharingWalletFormErrors = Record<number, RevenueSharingWalletFormError>;

export type RevenueSharingWalletFormType = 'existing' | 'new';
