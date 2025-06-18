import { Address } from 'viem';
import { BigIntValuePair } from './common';
import { TokenBalance } from './daoTreasury';

export interface AirdropFormValues {
  selectedAsset: TokenBalance;
  recipients: {
    address: string;
    amount: BigIntValuePair;
  }[];
}

export interface AirdropData {
  recipients: {
    address: Address;
    amount: bigint;
  }[];
  asset: TokenBalance;
}
