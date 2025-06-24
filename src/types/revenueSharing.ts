import { Address } from 'viem';
import { ERC20TokenData } from './account';

export type StakingTokenData = {
  balance: bigint;
  usdPrice?: number;
  stakedToken: {
    usdPrice?: number;
  } & ERC20TokenData;
  daos: {
    address: Address;
    name: string;
  }[];
} & ERC20TokenData;
