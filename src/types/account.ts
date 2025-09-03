import { Address } from 'viem';
import { TokenBalance } from './daoTreasury';

export interface VotesTokenData extends VotesData, ERC20TokenData {}
export interface VotesData {
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
  balance?: bigint;
  allowance?: bigint;
}

export interface StakedTokenData extends ERC20TokenData {
  minimumStakingPeriod: bigint;
  rewardsTokens: {
    name: string;
    symbol: string;
    decimals: number;
    address: Address;
    // stake contract's total balances
    balance: string;
    formattedBalance: string;
    usdValue: number;
  }[];
  assetsFungible: TokenBalance[];
  distributableRewards: bigint[];
  totalStaked: bigint;
}

export interface ERC721TokenData extends BaseTokenData {
  totalSupply?: bigint;
  votingWeight: bigint;
}
