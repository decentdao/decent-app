import { BigIntValuePair } from '../../../types';

export interface TokenSaleFormValues {
  // Project Overview
  saleName: string;

  // Token Details
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
