import { parseUnits, formatUnits } from 'viem';
import { USDC_DECIMALS } from '../constants/common';

// Token Sale Constants
export const COMMITMENT_TOKEN_PROTOCOL_FEE = BigInt('25000'); // 2.5% = 0.025 * 10^6 (for USDC with 6 decimals)

// Protocol fee in basis points (2.5% = 250 basis points)
export const PROTOCOL_FEE_BPS = 250n;
export const BPS_DIVISOR = 10000n;

/**
 * Calculate token price from FDV and total supply
 *
 * @param fdvUSD - Fully diluted valuation in USD (human readable number)
 * @param totalSupplyRaw - Total supply in token raw units (e.g., wei for 18-decimal tokens)
 * @param tokenDecimals - Number of decimals for the sale token
 * @returns Token price in USDC units per whole token (6 decimals)
 */
export function calculateTokenPrice(
  fdvUSD: number,
  totalSupplyRaw: bigint,
  tokenDecimals: number,
): bigint {
  const fdvBigInt = parseUnits(fdvUSD.toString(), USDC_DECIMALS);
  // Price = FDV / (totalSupply / 10^decimals)
  // Price in USDC units per whole token
  return (fdvBigInt * BigInt(10 ** tokenDecimals)) / totalSupplyRaw;
}

// Utility functions for formatting (kept for potential UI use)

/**
 * Format a token amount for display
 */
export function formatTokenAmount(amount: bigint, decimals: number): string {
  return parseFloat(formatUnits(amount, decimals)).toLocaleString();
}

/**
 * Format a USD amount for display
 */
export function formatUSDAmount(amount: bigint): string {
  return `$${(Number(amount) / 1e6).toLocaleString()}`;
}

/**
 * Calculate sale token protocol fee for contract (always 18-decimal precision)
 * @returns Protocol fee in 18-decimal precision for contract
 */
export function calculateSaleTokenProtocolFeeForContract(): bigint {
  // Contract expects 18-decimal precision regardless of token decimals
  return (PROTOCOL_FEE_BPS * BigInt(10 ** 18)) / BPS_DIVISOR;
}

/**
 * Calculate escrow amount exactly as the contract will
 * Used for validation before sending transaction
 * @param commitmentAmount - Commitment amount in USDC units (6 decimals)
 * @param tokenPrice - Token price in USDC units (6 decimals) - NOT scaled
 * @returns Escrow amount in token raw units as calculated by contract
 */
export function calculateContractEscrowAmount(
  commitmentAmount: bigint,
  tokenPrice: bigint,
): bigint {
  const PRECISION = BigInt(10 ** 18);
  const saleTokenProtocolFee = calculateSaleTokenProtocolFeeForContract();

  // Match contract's exact calculation
  return (commitmentAmount * (PRECISION + saleTokenProtocolFee)) / tokenPrice;
}

/**
 * Calculate gross token amount needed from net tokens for sale
 * Used when user enters net tokens for sale and we need to calculate total escrow amount
 *
 * @param netTokensForSale - Net tokens that will be available to buyers
 * @returns Gross tokens needed (including protocol fee)
 */
export function calculateGrossTokensFromNet(netTokensForSale: bigint): bigint {
  const PRECISION = BigInt(10 ** 18);
  const saleTokenProtocolFee = calculateSaleTokenProtocolFeeForContract();

  // grossTokens = (netTokens * (PRECISION + fee)) / PRECISION
  return (netTokensForSale * (PRECISION + saleTokenProtocolFee)) / PRECISION;
}

/**
 * Calculate net tokens for sale from gross token amount
 * Used for validation and display purposes
 *
 * @param grossTokens - Total tokens including protocol fee
 * @returns Net tokens available to buyers
 */
export function calculateNetTokensFromGross(grossTokens: bigint): bigint {
  const PRECISION = BigInt(10 ** 18);
  const saleTokenProtocolFee = calculateSaleTokenProtocolFeeForContract();

  // netTokens = (grossTokens * PRECISION) / (PRECISION + fee)
  return (grossTokens * PRECISION) / (PRECISION + saleTokenProtocolFee);
}

/**
 * Calculate protocol fee amount in tokens from net tokens for sale
 *
 * @param netTokensForSale - Net tokens that will be available to buyers
 * @returns Protocol fee amount in tokens
 */
export function calculateProtocolFeeTokens(netTokensForSale: bigint): bigint {
  const grossTokens = calculateGrossTokensFromNet(netTokensForSale);
  return grossTokens - netTokensForSale;
}

/**
 * Calculate maximum net tokens for sale given treasury balance
 * Used for "Max" button functionality
 *
 * @param treasuryBalance - Available token balance in treasury
 * @returns Maximum net tokens that can be put up for sale
 */
export function calculateMaxNetTokensForSale(treasuryBalance: bigint): bigint {
  return calculateNetTokensFromGross(treasuryBalance);
}
