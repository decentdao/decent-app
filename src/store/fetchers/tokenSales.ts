import { abis } from '@decentdao/decent-contracts';
import { useCallback } from 'react';
import { Address, getContract, erc20Abi } from 'viem';
import { logError } from '../../helpers/errorLogging';
import useNetworkPublicClient from '../../hooks/useNetworkPublicClient';
import { TokenSaleData, TokenSaleState } from '../../types/tokenSale';

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
            functionName: 'minimumTotalCommitment',
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
          {
            ...tokenSaleContract,
            functionName: 'verifier',
          },
          {
            ...tokenSaleContract,
            functionName: 'protocolFeeReceiver',
          },
          {
            ...tokenSaleContract,
            functionName: 'commitmentTokenProtocolFee',
          },
          {
            ...tokenSaleContract,
            functionName: 'saleTokenProtocolFee',
          },
          {
            ...tokenSaleContract,
            functionName: 'sellerSettled',
          },
        ];

        // Execute multicall for token sale data
        const [
          saleTokenData,
          commitmentTokenData,
          priceData,
          minTotalCommitmentData,
          maxTotalCommitmentData,
          totalCommitmentsData,
          startTimeData,
          endTimeData,
          minCommitmentData,
          maxCommitmentData,
          saleStateData,
          saleProceedsReceiverData,
          verifierData,
          protocolFeeReceiverData,
          commitmentTokenProtocolFeeData,
          saleTokenProtocolFeeData,
          sellerSettledData,
        ] = await publicClient.multicall({
          contracts: tokenSaleMulticallCalls,
          allowFailure: true,
        });

        const saleToken = saleTokenData.result as Address;
        if (!saleToken) {
          logError(
            new Error(`Failed to fetch sale token address for token sale ${tokenSaleAddress}`),
          );
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
        const saleStateValue =
          (saleStateData.result as TokenSaleState) || TokenSaleState.NOT_STARTED;
        const tokenSaleData: TokenSaleData = {
          address: tokenSaleAddress,
          name: '', // Will be set from metadata in the fetcher orchestrator
          saleToken,
          commitmentToken:
            (commitmentTokenData.result as Address) || '0x0000000000000000000000000000000000000000',
          tokenName: (tokenNameData.result as string) || '',
          tokenSymbol: (tokenSymbolData.result as string) || '',
          tokenDecimals: (tokenDecimalsData.result as number) || 18,
          saleTokenPrice: (priceData.result as bigint) || 0n,
          maximumTotalCommitment: (maxTotalCommitmentData.result as bigint) || 0n,
          minimumTotalCommitment: (minTotalCommitmentData.result as bigint) || 0n,
          totalCommitments: (totalCommitmentsData.result as bigint) || 0n,
          saleStartTimestamp: (startTimeData.result as bigint) || 0n,
          saleEndTimestamp: (endTimeData.result as bigint) || 0n,
          minimumCommitment: (minCommitmentData.result as bigint) || 0n,
          maximumCommitment: (maxCommitmentData.result as bigint) || 0n,
          saleState: saleStateValue,
          saleProceedsReceiver:
            (saleProceedsReceiverData.result as Address) ||
            '0x0000000000000000000000000000000000000000',
          verifier:
            (verifierData.result as Address) || '0x0000000000000000000000000000000000000000',
          protocolFeeReceiver:
            (protocolFeeReceiverData.result as Address) ||
            '0x0000000000000000000000000000000000000000',
          commitmentTokenProtocolFee: (commitmentTokenProtocolFeeData.result as bigint) || 0n,
          saleTokenProtocolFee: (saleTokenProtocolFeeData.result as bigint) || 0n,
          sellerSettled: (sellerSettledData.result as boolean) || false,
          // Computed field: sale is active if state is ACTIVE
          isActive: saleStateValue === TokenSaleState.ACTIVE,
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
