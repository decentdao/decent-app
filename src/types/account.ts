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
export interface ERC20LockedTokenData extends ERC20TokenData {
  whitelistedAddresses: Address[];
  maxTotalSupply: bigint;
}

export interface StakedTokenData extends ERC20TokenData {
  minimumStakingPeriod: bigint;
  rewardsTokens: Address[];
  assetsFungible: TokenBalance[];
}

export interface ERC721TokenData extends BaseTokenData {
  totalSupply?: bigint;
  votingWeight: bigint;
}
