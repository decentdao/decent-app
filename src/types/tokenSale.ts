import { Address } from 'viem';
import { BigIntValuePair } from './common';

export enum TokenSaleState {
  NOT_STARTED = 0,
  ACTIVE = 1,
  SUCCEEDED = 2,
  FAILED = 3,
}

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
  addresses: Address[];
}

export type BuyerRequirement =
  | TokenBuyerRequirement
  | NFTBuyerRequirement
  | WhitelistBuyerRequirement;

export interface TokenSaleMetadata {
  tokenSaleAddress: string;
  tokenSaleName?: string;
  buyerRequirements?: BuyerRequirement[];
  kyc?: {
    type: 'kyc';
    provider: string;
  } | null;
  orOutOf?: number;
}

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
  minimumTotalCommitment: bigint;
  totalCommitments: bigint;
  saleStartTimestamp: bigint;
  saleEndTimestamp: bigint;
  minimumCommitment: bigint;
  maximumCommitment: bigint;
  saleState: TokenSaleState;
  saleProceedsReceiver: Address;
  verifier: Address;
  protocolFeeReceiver: Address;
  commitmentTokenProtocolFee: bigint;
  saleTokenProtocolFee: bigint;
  sellerSettled: boolean;
  // Buyer Requirements from metadata
  buyerRequirements?: BuyerRequirement[];
  kyc?: {
    type: 'kyc';
    provider: string;
  } | null;
  orOutOf?: number;
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
  maxTokenSupply: BigIntValuePair; // Total supply of the token (for price calculation)
  saleTokenSupply: BigIntValuePair; // Tokens allocated for this sale (for display)

  // Sale Timing
  startDate: string;
  startTime: string;     // New: "HH:MM" format
  endDate: string;
  endTime: string;       // New: "HH:MM" format

  // Sale Pricing & Terms
  minimumFundraise: string;
  valuation: string;
  minPurchase: string;
  maxPurchase: string;

  commitmentToken: Address | null; // Will be set based on commitmentToken selection
  protocolFeeReceiver: string | null;

  // Sale Configuration - calculated fields
  saleTokenPrice: BigIntValuePair;

  // Hedgey Lockup Configuration
  hedgeyLockupEnabled: boolean;
  hedgeyLockupStart: BigIntValuePair;
  hedgeyLockupCliff: BigIntValuePair;
  hedgeyLockupRatePercentage: BigIntValuePair;
  hedgeyLockupPeriod: BigIntValuePair;
  hedgeyVotingTokenLockupPlans: string | null;

  // Buyer Requirements
  kycEnabled: boolean;
  buyerRequirements: BuyerRequirement[];
  orOutOf?: 'all' | number; // Number of requirements that must be met, defaults to 'all'
}
