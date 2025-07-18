import { Address } from 'viem';

export interface RevenueSharingWalletSplit<A extends Address | string, P extends string | number> {
  address: A;
  percentage: P;
}

export interface RevenueSharingWallet {
  name: string;
  splits: RevenueSharingWalletSplit<Address, number>[];
  address: Address;
}

export interface RevenueSharingWalletFormValues {
  name?: string;
  splits?: Partial<RevenueSharingWalletSplit<string, string>>[];
  address?: string;
  // this is used to support the name edit and confirm flow
  lastEdit?: {
    name?: string;
    address?: string;
  };
}
