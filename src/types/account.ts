import { Address } from 'viem';
import { TokenBalance } from './daoTreasury';

export interface VotesTokenData extends VotesData, ERC20TokenData {}
export interface VotesData {
  balance: bigint | null;
  delegatee: Address | null;
}

export interface BaseTokenData {
  name: string;
  symbol: string;
  address: Address;
}
export interface ERC20TokenData extends BaseTokenData {
  decimals: number;
  totalSupply: bigint;
}

export interface StakedTokenData extends ERC20TokenData {
  minimumStakingPeriod: bigint;
  rewardsTokens: {
    name: string;
    symbol: string;
    decimals: number;
    address: Address;
    balance: string;
    formattedBalance: string;
    usdValue: number;
  }[];
  assetsFungible: TokenBalance[];
  balance: bigint | null;
}

export interface ERC721TokenData extends BaseTokenData {
  totalSupply?: bigint;
  votingWeight: bigint;
}
