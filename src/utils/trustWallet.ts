/**
 * Maps chain IDs to Trust Wallet's network naming convention
 * Trust Wallet uses specific directory names for different blockchains
 * @param chainId - The chain ID from publicClient.chain.id
 * @returns The Trust Wallet network name or 'ethereum' as fallback
 */
export function getChainIdToTrustWalletNetwork(chainId: number): string {
  const chainIdToNetworkMap: Record<number, string> = {
    // Ethereum Mainnet
    1: 'ethereum',
    // Ethereum Testnets - these typically don't have logos in Trust Wallet
    11155111: 'ethereum',

    // Polygon
    137: 'polygon',

    // Optimism
    10: 'optimism',

    // Base
    8453: 'base',
  };

  return chainIdToNetworkMap[chainId] || 'ethereum';
}

/**
 * Generates a Trust Wallet asset logo URL for a given token address and chain ID
 * @param tokenAddress - The token contract address
 * @param chainId - The chain ID from publicClient.chain.id
 * @returns The complete Trust Wallet logo URL
 */
export function getTrustWalletLogoUrl(tokenAddress: string, chainId: number): string {
  const networkName = getChainIdToTrustWalletNetwork(chainId);
  return `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/${networkName}/assets/${tokenAddress}/logo.png`;
}

/**
 * Checks if a Trust Wallet logo exists and returns the URL or undefined
 * @param tokenAddress - The token contract address
 * @param chainId - The chain ID from publicClient.chain.id
 * @returns Promise<string | undefined> - The logo URL if it exists, undefined otherwise
 */
export async function getValidatedTrustWalletLogoUrl(
  tokenAddress: string,
  chainId: number,
): Promise<string | undefined> {
  const logoUrl = getTrustWalletLogoUrl(tokenAddress, chainId);
  
  try {
    const response = await fetch(logoUrl, { method: 'HEAD' });
    if (response.ok && response.headers.get('content-type')?.startsWith('image/')) {
      return logoUrl;
    }
    return undefined;
  } catch {
    return undefined;
  }
}
