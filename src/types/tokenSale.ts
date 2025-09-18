import { Address } from 'viem';
import { BigIntValuePair } from './common';

export type BuyerRequirementType = 'token' | 'nft' | 'whitelist';

export interface TokenBuyerRequirement {
  type: 'token';
  tokenAddress: Address;
  tokenName?: string;
  tokenSymbol?: string;
  tokenDecimals?: number;
  minimumBalance: bigint;
}

export interface NFTBuyerRequirement {
  type: 'nft';
  contractAddress: Address;
  collectionName?: string;
  tokenStandard: 'ERC721' | 'ERC1155';
  minimumBalance: bigint;
  tokenId?: bigint; // For ERC1155 specific token requirements
}

export interface WhitelistBuyerRequirement {
  type: 'whitelist';
  name: string;
  addresses: Address[];
}

export type BuyerRequirement =
  | TokenBuyerRequirement
  | NFTBuyerRequirement
  | WhitelistBuyerRequirement;

export interface TokenSaleData {
  address: Address;
  name: string;
  saleToken: Address;
  commitmentToken: Address;
  tokenName: string;
  tokenSymbol: string;
  tokenDecimals: number;
  saleTokenPrice: bigint;
  maximumTotalCommitment: bigint;
  totalCommitments: bigint;
  saleStartTimestamp: bigint;
  saleEndTimestamp: bigint;
  minimumCommitment: bigint;
  maximumCommitment: bigint;
  // TODO create enum
  saleState: number; // 0: NOT_STARTED, 1: ACTIVE, 2: SUCCEEDED, 3: FAILED
  saleProceedsReceiver: Address;
  // Buyer Requirements
  buyerRequirements?: BuyerRequirement[];
  // Computed fields for compatibility
  isActive: boolean;
}

export interface TokenSaleStats {
  totalSales: number;
  activeSales: number;
  totalRaised: bigint;
}

export interface TokenSaleFormValues {
  // Project Overview
  saleName: string;

  // Token Details
  tokenAddress: string;
  tokenName: string;
  tokenSymbol: string;
  maxTokenSupply: BigIntValuePair;

  // Sale Timing
  startDate: Date | null;
  endDate: Date | null;

  // Sale Pricing & Terms
  minimumFundraise: number;
  fundraisingCap: number;
  valuation: number;
  minPurchase: number;
  maxPurchase: number;

  // Sale Configuration
  commitmentToken: Address | null; // Will be set based on acceptedToken selection
  verifier: Address | null; // Will be set from network config
  saleProceedsReceiver: Address | null; // Will be set to DAO address
  protocolFeeReceiver: Address | null; // Will be set from network config
  minimumCommitment: BigIntValuePair;
  maximumCommitment: BigIntValuePair;
  minimumTotalCommitment: BigIntValuePair;
  maximumTotalCommitment: BigIntValuePair;
  saleTokenPrice: BigIntValuePair; // Keep mocked as requested
  commitmentTokenProtocolFee: BigIntValuePair;
  saleTokenProtocolFee: BigIntValuePair;
  saleTokenHolder: Address | null; // Will be set to DAO address

  // Hedgey Lockup Configuration
  hedgeyLockupEnabled: boolean;
  hedgeyLockupStart: BigIntValuePair;
  hedgeyLockupCliff: BigIntValuePair;
  hedgeyLockupRatePercentage: BigIntValuePair;
  hedgeyLockupPeriod: BigIntValuePair;
  hedgeyVotingTokenLockupPlans: Address | null;

  // Buyer Requirements
  buyerRequirements: BuyerRequirement[];
}
