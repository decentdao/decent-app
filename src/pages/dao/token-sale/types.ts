export interface TokenSaleFormValues {
  // Project Overview
  projectName: string;
  projectDescription: string;
  websiteUrl: string;
  xHandle: string;
  githubLink: string;
  telegramGroup: string;
  discordServer: string;
  
  // Sale Terms
  startDate: Date | null;
  endDate: Date | null;
  totalSupply: string;
  salePrice: string;
  acceptedToken: string[];
  
  // Buyer Requirements
  minPurchase: string;
  maxPurchase: string;
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
  startDate: null,
  endDate: null,
  totalSupply: '',
  salePrice: '',
  acceptedToken: [],
  minPurchase: '',
  maxPurchase: '',
  whitelistAddress: '',
  kycProvider: '',
};
