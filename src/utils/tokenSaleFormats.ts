import { format } from 'date-fns';
import { formatUnits } from 'viem';
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
 */
export const formatSaleAmount = (amount: bigint, decimals: number = 6): string => {
  if (amount === 0n) {
    return '$0';
  }
  const formatted = parseFloat(formatUnits(amount, decimals));
  return formatUSD(formatted);
};

/**
 * Calculates progress percentage for token sale
 */
export const calculateSaleProgress = (
  raised: bigint,
  target: bigint,
  decimals: number = 6,
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
  startTimestamp: number | bigint,
  endTimestamp: number | bigint,
  saleState: number,
): { status: 'Active' | 'Closed'; type: 'active' | 'closed' } => {
  const isActive = isSaleActive(startTimestamp, endTimestamp, saleState);
  return {
    status: isActive ? 'Active' : 'Closed',
    type: isActive ? 'active' : 'closed',
  };
};
