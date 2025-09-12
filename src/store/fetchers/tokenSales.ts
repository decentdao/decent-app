import { abis } from '@decentdao/decent-contracts';
import { useCallback } from 'react';
import { Address, getContract, erc20Abi } from 'viem';
import { logError } from '../../helpers/errorLogging';
import useNetworkPublicClient from '../../hooks/useNetworkPublicClient';
import { TokenSaleData } from '../../types/tokenSale';

export function useTokenSalesFetcher() {
  const publicClient = useNetworkPublicClient();

  const fetchTokenSaleData = useCallback(
    async (tokenSaleAddress: Address): Promise<TokenSaleData | null> => {
      try {
        const tokenSaleContract = getContract({
          abi: abis.deployables.TokenSaleV1,
          address: tokenSaleAddress,
          client: publicClient,
        });

        // Prepare multicall requests for token sale contract data
        const tokenSaleMulticallCalls = [
          {
            ...tokenSaleContract,
            functionName: 'saleToken',
          },
          {
            ...tokenSaleContract,
            functionName: 'commitmentToken',
          },
          {
            ...tokenSaleContract,
            functionName: 'saleTokenPrice',
          },
          {
            ...tokenSaleContract,
            functionName: 'maximumTotalCommitment',
          },
          {
            ...tokenSaleContract,
            functionName: 'totalCommitments',
          },
          {
            ...tokenSaleContract,
            functionName: 'saleStartTimestamp',
          },
          {
            ...tokenSaleContract,
            functionName: 'saleEndTimestamp',
          },
          {
            ...tokenSaleContract,
            functionName: 'minimumCommitment',
          },
          {
            ...tokenSaleContract,
            functionName: 'maximumCommitment',
          },
          {
            ...tokenSaleContract,
            functionName: 'saleState',
          },
          {
            ...tokenSaleContract,
            functionName: 'saleProceedsReceiver',
          },
        ];

        // Execute multicall for token sale data
        const [
          saleTokenData,
          commitmentTokenData,
          priceData,
          maxTotalCommitmentData,
          totalCommitmentsData,
          startTimeData,
          endTimeData,
          minCommitmentData,
          maxCommitmentData,
          saleStateData,
          ownerData,
        ] = await publicClient.multicall({
          contracts: tokenSaleMulticallCalls,
          allowFailure: true,
        });

        const saleToken = saleTokenData.result as Address;
        if (!saleToken) {
          logError(new Error(`Failed to fetch sale token address for token sale ${tokenSaleAddress}`));
          return null;
        }

        // Create token contract to get token details
        const tokenContract = getContract({
          abi: erc20Abi,
          address: saleToken,
          client: publicClient,
        });

        // Prepare multicall requests for token data
        const tokenMulticallCalls = [
          {
            ...tokenContract,
            functionName: 'name',
          },
          {
            ...tokenContract,
            functionName: 'symbol',
          },
          {
            ...tokenContract,
            functionName: 'decimals',
          },
        ];

        // Execute multicall for token data
        const [tokenNameData, tokenSymbolData, tokenDecimalsData] = await publicClient.multicall({
          contracts: tokenMulticallCalls,
          allowFailure: true,
        });

        // Construct the token sale data object
        const saleStateValue = (saleStateData.result as number) || 0;
        const tokenSaleData: TokenSaleData = {
          address: tokenSaleAddress,
          name: '', // Will be set from metadata in the fetcher orchestrator
          saleToken,
          commitmentToken: (commitmentTokenData.result as Address) || '0x0000000000000000000000000000000000000000',
          tokenName: (tokenNameData.result as string) || '',
          tokenSymbol: (tokenSymbolData.result as string) || '',
          tokenDecimals: (tokenDecimalsData.result as number) || 18,
          saleTokenPrice: (priceData.result as bigint) || 0n,
          maximumTotalCommitment: (maxTotalCommitmentData.result as bigint) || 0n,
          totalCommitments: (totalCommitmentsData.result as bigint) || 0n,
          saleStartTimestamp: (startTimeData.result as bigint) || 0n,
          saleEndTimestamp: (endTimeData.result as bigint) || 0n,
          minimumCommitment: (minCommitmentData.result as bigint) || 0n,
          maximumCommitment: (maxCommitmentData.result as bigint) || 0n,
          saleState: saleStateValue,
          saleProceedsReceiver: (ownerData.result as Address) || '0x0000000000000000000000000000000000000000',
          // Computed field: sale is active if state is 1 (ACTIVE)
          isActive: saleStateValue === 1,
        };

        return tokenSaleData;
      } catch (error) {
        logError(error as Error);
        return null;
      }
    },
    [publicClient],
  );

  const fetchMultipleTokenSales = useCallback(
    async (tokenSaleAddresses: Address[]): Promise<TokenSaleData[]> => {
      try {
        const tokenSalesData = await Promise.all(
          tokenSaleAddresses.map(address => fetchTokenSaleData(address)),
        );

        // Filter out null results
        return tokenSalesData.filter((data): data is TokenSaleData => data !== null);
      } catch (error) {
        logError(error as Error);
        return [];
      }
    },
    [fetchTokenSaleData],
  );

  return {
    fetchTokenSaleData,
    fetchMultipleTokenSales,
  };
}
