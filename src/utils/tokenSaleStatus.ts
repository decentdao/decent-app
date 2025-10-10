import { TokenSaleData } from '../types/tokenSale';

/**
 * Sale settlement action states for UI.
 */
export interface TokenSaleActionState {
  /** Show "reclaim tokens" action (sale failed - minimum not met OR no sales) */
  canReclaimTokens: boolean;
  /** Show "claim proceeds" action (sale succeeded - minimum met OR had sales) */
  canClaimProceeds: boolean;
}

/**
 * Determines which settlement actions should be available for a token sale.
 * Only returns true when: sale ended + not settled + user has permissions + outcome determined.
 *
 * @param sale - TokenSaleData from store
 * @param userHasPermissions - Whether current user can settle the sale
 * @returns Action availability flags
 */
export function getTokenSaleActionState(
  sale: TokenSaleData,
  userHasPermissions: boolean = false,
): TokenSaleActionState {
  // Contract uses 1n as default "no minimum" value
  const isMinimumSet = sale.minimumTotalCommitment !== 1n;
  const isMinimumReached = sale.totalCommitments >= sale.minimumTotalCommitment;

  // Sale has ended if: time expired OR max commitment reached
  const hasSaleEnded =
    sale.saleEndTimestamp < BigInt(Math.floor(Date.now() / 1000)) ||
    sale.totalCommitments >= sale.maximumTotalCommitment;

  // Only show actions if sale ended, not settled, and user has permissions
  const shouldShowAction = hasSaleEnded && !sale.sellerSettled && userHasPermissions;

  // Failed sale: minimum was set but not reached, OR no minimum but zero sales
  const canReclaimTokens =
    shouldShowAction &&
    ((isMinimumSet && !isMinimumReached) || (!isMinimumSet && sale.totalCommitments === 0n));

  // Successful sale: minimum was set and reached, OR no minimum but had sales
  const canClaimProceeds =
    shouldShowAction &&
    ((isMinimumSet && isMinimumReached) || (!isMinimumSet && sale.totalCommitments > 0n));

  return {
    canReclaimTokens,
    canClaimProceeds,
  };
}
