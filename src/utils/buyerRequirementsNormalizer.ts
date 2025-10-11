import { Address, erc20Abi } from 'viem';
import { BuyerRequirement, TokenBuyerRequirement, NFTBuyerRequirement } from '../types/tokenSale';

// Normalize legacy buyer requirements data format with token metadata fetching
export const normalizeBuyerRequirements = async (
  requirements: any[],
  publicClient: any,
): Promise<BuyerRequirement[]> => {
  // Collect all unique token addresses that need metadata
  const tokenAddresses = new Set<Address>();
  const nftAddresses = new Set<Address>();

  requirements.forEach(requirement => {
    if (requirement.type === 'erc20') {
      tokenAddresses.add(requirement.tokenAddress);
    } else if (requirement.type === 'erc721' || requirement.type === 'erc1155') {
      nftAddresses.add(requirement.tokenAddress);
    }
  });

  // Fetch ERC20 token metadata using multicall
  const tokenMetadata = new Map<Address, { name?: string; symbol?: string; decimals?: number }>();
  if (tokenAddresses.size > 0) {
    const tokenCalls = Array.from(tokenAddresses).flatMap(address => [
      {
        address,
        abi: erc20Abi,
        functionName: 'name',
      },
      {
        address,
        abi: erc20Abi,
        functionName: 'symbol',
      },
      {
        address,
        abi: erc20Abi,
        functionName: 'decimals',
      },
    ]);

    try {
      const results = await publicClient.multicall({
        contracts: tokenCalls,
        allowFailure: true,
      });

      let resultIndex = 0;
      for (const address of tokenAddresses) {
        const name = results[resultIndex]?.result;
        const symbol = results[resultIndex + 1]?.result;
        const decimals = results[resultIndex + 2]?.result;

        tokenMetadata.set(address, { name, symbol, decimals });
        resultIndex += 3;
      }
    } catch (error) {
      console.warn('Failed to fetch token metadata:', error);
    }
  }

  // Fetch NFT collection names using multicall
  const nftMetadata = new Map<Address, { name?: string }>();
  if (nftAddresses.size > 0) {
    const nftCalls = Array.from(nftAddresses).map(address => ({
      address,
      abi: [
        {
          name: 'name',
          type: 'function',
          stateMutability: 'view',
          inputs: [],
          outputs: [{ name: '', type: 'string' }],
        },
      ],
      functionName: 'name',
    }));

    try {
      const results = await publicClient.multicall({
        contracts: nftCalls,
        allowFailure: true,
      });

      Array.from(nftAddresses).forEach((address, index) => {
        const name = results[index]?.result;
        nftMetadata.set(address, { name });
      });
    } catch (error) {
      console.warn('Failed to fetch NFT metadata:', error);
    }
  }

  // Now normalize with the fetched metadata
  return requirements.map(requirement => {
    if (requirement.type === 'erc20') {
      const metadata = tokenMetadata.get(requirement.tokenAddress);
      return {
        type: 'token',
        tokenAddress: requirement.tokenAddress,
        tokenName: metadata?.name,
        tokenSymbol: metadata?.symbol,
        tokenDecimals: metadata?.decimals,
        minimumBalance: BigInt(requirement.amount),
      } as TokenBuyerRequirement;
    }

    if (requirement.type === 'erc721') {
      const metadata = nftMetadata.get(requirement.tokenAddress);
      return {
        type: 'nft',
        contractAddress: requirement.tokenAddress,
        collectionName: metadata?.name,
        tokenStandard: 'ERC721',
        minimumBalance: BigInt(requirement.amount),
      } as NFTBuyerRequirement;
    }

    if (requirement.type === 'erc1155') {
      const metadata = nftMetadata.get(requirement.tokenAddress);
      return {
        type: 'nft',
        contractAddress: requirement.tokenAddress,
        collectionName: metadata?.name,
        tokenStandard: 'ERC1155',
        minimumBalance: BigInt(requirement.amount),
      } as NFTBuyerRequirement;
    }

    // For whitelist, return as-is
    return requirement as BuyerRequirement;
  });
};
