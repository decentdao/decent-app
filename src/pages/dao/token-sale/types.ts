import { Address } from 'viem';
import { BigIntValuePair } from '../../../types';
import { TokenBalance } from '../../../types/daoTreasury';

export interface TokenSaleFormValues {
  // Project Overview
  saleName: string;

  // Token Details
  selectedToken: TokenBalance | null;
  tokenName: string;
  tokenSymbol: string;
  maxTokenSupply: BigIntValuePair;
  tokenPrice: number;

  // Sale Timing
  startDate: Date | null;
  endDate: Date | null;

  // Sale Pricing & Terms
  minimumFundraise: number;
  fundraisingCap: number;
  valuation: number;
  acceptedToken: string[];
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

  // Legacy fields (keeping for compatibility)
  totalSupply: string;
  salePrice: string;
  whitelistAddress: string;
  kycProvider: string;
}
