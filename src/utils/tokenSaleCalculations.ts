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

// Token Sale Calculation Utilities
export interface TokenSaleCalculationParams {
  treasuryTokenBalance: bigint;
  tokenPrice: bigint;
  tokenDecimals: number;
  fundraisingCap?: string;
}

export interface TokenSaleCalculationResult {
  maxPossibleFromTreasury: bigint;
  maxPossibleCommitment: bigint;
  saleTokenEscrowAmount: bigint;
  tokensForSale: bigint;
  canSupportFundraisingCap: boolean;
  errorMessage?: string;
}

/**
 * Calculate the maximum possible fundraising goal based on treasury balance
 * Per PRD: treasury must have enough tokens to cover goal + fee (goal * 1.025)
 * So max goal = treasury_value / 1.025
 *
 * @param treasuryTokenBalance - Treasury balance in token raw units (e.g., wei for 18-decimal tokens)
 * @param tokenPrice - Price in USDC units per whole token (6 decimals)
 * @param tokenDecimals - Number of decimals for the sale token
 * @returns Maximum possible commitment in USDC units (6 decimals)
 */
export function calculateMaxPossibleFromTreasury(
  treasuryTokenBalance: bigint,
  tokenPrice: bigint,
  tokenDecimals: number,
): bigint {
  // To avoid precision loss, we calculate: (balance * price * BPS_DIVISOR) / (10^tokenDecimals * (BPS_DIVISOR + PROTOCOL_FEE_BPS))
  // This is equivalent to: (treasury_value_usdc * BPS_DIVISOR) / (BPS_DIVISOR + PROTOCOL_FEE_BPS)
  // but avoids the intermediate division that causes precision loss

  const numerator = treasuryTokenBalance * tokenPrice * BPS_DIVISOR;
  const denominator = BigInt(10 ** tokenDecimals) * (BPS_DIVISOR + PROTOCOL_FEE_BPS);
  return numerator / denominator;
}

/**
 * Calculate the escrow amount needed for a given commitment amount
 * This includes the sale token protocol fee
 *
 * @param commitmentAmount - Commitment amount in USDC units (6 decimals)
 * @param tokenPrice - Price in USDC units per whole token (6 decimals)
 * @param tokenDecimals - Number of decimals for the sale token
 * @returns Escrow amount in token raw units (tokenDecimals)
 */
export function calculateSaleTokenEscrowAmount(
  commitmentAmount: bigint,
  tokenPrice: bigint,
  tokenDecimals: number,
): bigint {
  // Tokens needed = (commitment * 1.025 * 10^tokenDecimals) / price
  const withFee = (commitmentAmount * (BPS_DIVISOR + PROTOCOL_FEE_BPS)) / BPS_DIVISOR;
  return (withFee * BigInt(10 ** tokenDecimals)) / tokenPrice;
}

/**
 * Calculate the number of tokens that will be sold for a given commitment amount
 * This does NOT include the protocol fee (just the tokens going to buyers)
 *
 * @param commitmentAmount - Commitment amount in USDC units (6 decimals)
 * @param tokenPrice - Price in USDC units per whole token (6 decimals)
 * @param tokenDecimals - Number of decimals for the sale token
 * @returns Tokens for sale in token raw units (tokenDecimals)
 */
export function calculateTokensForSale(
  commitmentAmount: bigint,
  tokenPrice: bigint,
  tokenDecimals: number,
): bigint {
  // Tokens = (commitment * 10^tokenDecimals) / price
  return (commitmentAmount * BigInt(10 ** tokenDecimals)) / tokenPrice;
}

/**
 * Validate if a fundraising cap can be supported by the treasury
 */
export function validateFundraisingCap(
  fundraisingCapUSD: string,
  treasuryTokenBalance: bigint,
  tokenPrice: bigint,
  tokenDecimals: number,
): { isValid: boolean; errorMessage?: string } {
  const requestedCap = parseUnits(fundraisingCapUSD, USDC_DECIMALS);
  const maxPossibleFromTreasury = calculateMaxPossibleFromTreasury(
    treasuryTokenBalance,
    tokenPrice,
    tokenDecimals,
  );

  if (requestedCap > maxPossibleFromTreasury) {
    const requiredTokenValue = ((Number(requestedCap) * 1.025) / 1e6).toLocaleString();
    const availableTokenValue = (Number(maxPossibleFromTreasury) / 1e6).toLocaleString();

    return {
      isValid: false,
      errorMessage: `Fundraising cap of $${fundraisingCapUSD} requires $${requiredTokenValue} worth of tokens, but treasury only has $${availableTokenValue} worth available`,
    };
  }

  return { isValid: true };
}

/**
 * Comprehensive token sale calculation
 * Returns all the key values needed for both UI display and contract preparation
 */
export function calculateTokenSaleParameters(
  params: TokenSaleCalculationParams,
): TokenSaleCalculationResult {
  const { treasuryTokenBalance, tokenPrice, tokenDecimals, fundraisingCap } = params;

  // Calculate maximum possible from treasury
  const maxPossibleFromTreasury = calculateMaxPossibleFromTreasury(
    treasuryTokenBalance,
    tokenPrice,
    tokenDecimals,
  );

  let maxPossibleCommitment: bigint;
  let canSupportFundraisingCap = true;
  let errorMessage: string | undefined;

  // Determine the actual commitment amount
  if (fundraisingCap && parseFloat(fundraisingCap) > 0) {
    const validation = validateFundraisingCap(
      fundraisingCap,
      treasuryTokenBalance,
      tokenPrice,
      tokenDecimals,
    );

    if (!validation.isValid) {
      canSupportFundraisingCap = false;
      errorMessage = validation.errorMessage;
      maxPossibleCommitment = maxPossibleFromTreasury; // Fallback to max possible
    } else {
      maxPossibleCommitment = parseUnits(fundraisingCap, USDC_DECIMALS);
    }
  } else {
    maxPossibleCommitment = maxPossibleFromTreasury;
  }

  // Calculate derived values
  const saleTokenEscrowAmount = calculateSaleTokenEscrowAmount(
    maxPossibleCommitment,
    tokenPrice,
    tokenDecimals,
  );
  const tokensForSale = calculateTokensForSale(maxPossibleCommitment, tokenPrice, tokenDecimals);

  return {
    maxPossibleFromTreasury,
    maxPossibleCommitment,
    saleTokenEscrowAmount,
    tokensForSale,
    canSupportFundraisingCap,
    errorMessage,
  };
}

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

// Contract Interface Functions
// The contract expects 18-decimal precision regardless of actual token decimals

/**
 * Scale token price from USDC units (6 decimals) to contract precision (18 decimals)
 * @param priceInUSDC - Price in USDC units (6 decimals)
 * @returns Price scaled to 18-decimal precision for contract
 */
export function scaleTokenPriceForContract(priceInUSDC: bigint): bigint {
  // Contract expects price in 18-decimal precision
  // Scale from USDC (6) to contract precision (18)
  return priceInUSDC * BigInt(10 ** 12); // 10^(18-6)
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
