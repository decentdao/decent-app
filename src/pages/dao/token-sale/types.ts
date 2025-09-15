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

  // Sale Pricing & Terms
  minimumFundraise: number;
  fundraisingCap: number;
  valuation: number;
  startDate: Date | null;
  acceptedToken: string[];
  minPurchase: number;
  maxPurchase: number;

  // Legacy fields (keeping for compatibility)
  endDate: Date | null;
  totalSupply: string;
  salePrice: string;
  whitelistAddress: string;
  kycProvider: string;
}
