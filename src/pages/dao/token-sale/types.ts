import { BigIntValuePair } from '../../../types';

export interface TokenSaleFormValues {
  // Project Overview
  projectName: string;
  projectDescription: string;
  websiteUrl: string;
  xHandle: string;
  githubLink: string;
  telegramGroup: string;
  discordServer: string;

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

export const initialValues: TokenSaleFormValues = {
  projectName: '',
  projectDescription: '',
  websiteUrl: '',
  xHandle: '',
  githubLink: '',
  telegramGroup: '',
  discordServer: '',

  // Token Details
  tokenName: '',
  tokenSymbol: '',
  maxTokenSupply: { value: '', bigintValue: undefined },
  tokenPrice: 0,

  // Sale Pricing & Terms
  minimumFundraise: 0,
  fundraisingCap: 0,
  valuation: 0,
  startDate: null,
  acceptedToken: [],
  minPurchase: 0,
  maxPurchase: 0,

  // Legacy fields
  endDate: null,
  totalSupply: '',
  salePrice: '',
  whitelistAddress: '',
  kycProvider: '',
};
