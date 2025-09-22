import { format } from 'date-fns';
import { formatUnits } from 'viem';
import { USDC_DECIMALS } from '../constants/common';
import { formatUSD } from './numberFormats';

/**
 * Formats a timestamp to a readable date string
 */
export const formatSaleDate = (timestamp: number | bigint): string => {
  const timestampNum = typeof timestamp === 'bigint' ? Number(timestamp) : timestamp;
  const date = new Date(timestampNum * 1000);
  return format(date, 'MMM dd, yyyy');
};

/**
 * Formats token sale amounts to USD currency
 * For commitment amounts, use the commitment token's decimals (typically 6 for USDC)
 */
export const formatSaleAmount = (amount: bigint, decimals: number = USDC_DECIMALS): string => {
  if (amount === 0n) {
    return '$0';
  }
  const formatted = parseFloat(formatUnits(amount, decimals));
  return formatUSD(formatted);
};

/**
 * Formats token sale price from contract storage
 * The contract stores saleTokenPrice in USDC units (6 decimals)
 */
export const formatTokenPrice = (priceFromContract: bigint): string => {
  if (priceFromContract === 0n) {
    return '$0';
  }
  const formatted = parseFloat(formatUnits(priceFromContract, USDC_DECIMALS));
  return formatUSD(formatted);
};

/**
 * Calculate token supply for sale from commitment amount and price
 * Both values come from contract in their stored formats
 */
export const calculateTokenSupplyForSale = (
  maxCommitment: bigint,
  tokenPrice: bigint,
  tokenDecimals: number,
): bigint => {
  if (tokenPrice === 0n) return 0n;
  // maxCommitment is in USDC units (6 decimals)
  // tokenPrice is in USDC units (6 decimals)
  // Result should be in token raw units (tokenDecimals)
  return (maxCommitment * BigInt(10 ** tokenDecimals)) / tokenPrice;
};

/**
 * Calculates progress percentage for token sale
 */
export const calculateSaleProgress = (
  raised: bigint,
  target: bigint,
  decimals: number = USDC_DECIMALS,
): number => {
  if (target === 0n) {
    return 0;
  }
  const raisedAmount = parseFloat(formatUnits(raised, decimals));
  const targetAmount = parseFloat(formatUnits(target, decimals));
  return Math.min((raisedAmount / targetAmount) * 100, 100);
};

/**
 * Determines if a token sale is active based on timestamps and state
 */
export const isSaleActive = (
  startTimestamp: number | bigint,
  endTimestamp: number | bigint,
  saleState: number,
): boolean => {
  const now = Math.floor(Date.now() / 1000);
  const startNum = typeof startTimestamp === 'bigint' ? Number(startTimestamp) : startTimestamp;
  const endNum = typeof endTimestamp === 'bigint' ? Number(endTimestamp) : endTimestamp;
  return saleState === 1 && now >= startNum && now <= endNum;
};

/**
 * Gets status text and type for a token sale
 */
export const getSaleStatus = (
  saleState: number,
): {
  status: 'Active' | 'Closed' | 'Not Started';
  type: 'active' | 'closed' | 'Not Started';
} => {
  switch (saleState) {
    case 0:
      return { status: 'Not Started', type: 'Not Started' };
    case 1:
      return { status: 'Active', type: 'active' };
    // for failed and successful sales
    case 2:
    case 3:
    default:
      return { status: 'Closed', type: 'closed' };
  }
};
