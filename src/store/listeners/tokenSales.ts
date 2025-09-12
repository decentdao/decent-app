import { abis } from '@decentdao/decent-contracts';
import { useCallback, useEffect } from 'react';
import { Address } from 'viem';
import { logError } from '../../helpers/errorLogging';
import useNetworkPublicClient from '../../hooks/useNetworkPublicClient';
import { useTokenSalesFetcher } from '../fetchers/tokenSales';

interface UseTokenSaleListenersProps {
  tokenSaleAddresses: Address[];
  onTokenSaleUpdated: (tokenSaleAddress: Address) => void;
}

export const useTokenSaleListeners = ({
  tokenSaleAddresses,
  onTokenSaleUpdated,
}: UseTokenSaleListenersProps) => {
  const publicClient = useNetworkPublicClient();
  const { fetchTokenSaleData } = useTokenSalesFetcher();

  const handleTokenSaleEvent = useCallback(
    async (tokenSaleAddress: Address) => {
      try {
        // Refetch the token sale data when any event occurs
        const updatedData = await fetchTokenSaleData(tokenSaleAddress);
        if (updatedData) {
          onTokenSaleUpdated(tokenSaleAddress);
        }
      } catch (error) {
        logError(error as Error);
      }
    },
    [fetchTokenSaleData, onTokenSaleUpdated],
  );

  useEffect(() => {
    if (!publicClient || tokenSaleAddresses.length === 0) {
      return;
    }

    const unwatchFunctions: (() => void)[] = [];

    // Set up listeners for each token sale contract
    tokenSaleAddresses.forEach(tokenSaleAddress => {
      try {
        // Listen for CommitmentIncreased events
        const unwatchCommitmentIncreased = publicClient.watchContractEvent({
          address: tokenSaleAddress,
          abi: abis.deployables.TokenSaleV1,
          eventName: 'CommitmentIncreased',
          onLogs: () => handleTokenSaleEvent(tokenSaleAddress),
        });

        // Listen for SuccessfulSaleBuyerSettled events
        const unwatchSuccessfulBuyerSettled = publicClient.watchContractEvent({
          address: tokenSaleAddress,
          abi: abis.deployables.TokenSaleV1,
          eventName: 'SuccessfulSaleBuyerSettled',
          onLogs: () => handleTokenSaleEvent(tokenSaleAddress),
        });

        // Listen for SuccessfulSaleBuyerSettledHedgey events
        const unwatchSuccessfulBuyerSettledHedgey = publicClient.watchContractEvent({
          address: tokenSaleAddress,
          abi: abis.deployables.TokenSaleV1,
          eventName: 'SuccessfulSaleBuyerSettledHedgey',
          onLogs: () => handleTokenSaleEvent(tokenSaleAddress),
        });

        // Listen for FailedSaleBuyerSettled events
        const unwatchFailedBuyerSettled = publicClient.watchContractEvent({
          address: tokenSaleAddress,
          abi: abis.deployables.TokenSaleV1,
          eventName: 'FailedSaleBuyerSettled',
          onLogs: () => handleTokenSaleEvent(tokenSaleAddress),
        });

        // Listen for SuccessfulSaleSellerSettled events
        const unwatchSuccessfulSellerSettled = publicClient.watchContractEvent({
          address: tokenSaleAddress,
          abi: abis.deployables.TokenSaleV1,
          eventName: 'SuccessfulSaleSellerSettled',
          onLogs: () => handleTokenSaleEvent(tokenSaleAddress),
        });

        // Listen for FailedSaleSellerSettled events
        const unwatchFailedSellerSettled = publicClient.watchContractEvent({
          address: tokenSaleAddress,
          abi: abis.deployables.TokenSaleV1,
          eventName: 'FailedSaleSellerSettled',
          onLogs: () => handleTokenSaleEvent(tokenSaleAddress),
        });

        // Store all unwatch functions
        unwatchFunctions.push(
          unwatchCommitmentIncreased,
          unwatchSuccessfulBuyerSettled,
          unwatchSuccessfulBuyerSettledHedgey,
          unwatchFailedBuyerSettled,
          unwatchSuccessfulSellerSettled,
          unwatchFailedSellerSettled,
        );
      } catch (error) {
        logError(error as Error);
      }
    });

    // Cleanup function
    return () => {
      unwatchFunctions.forEach(unwatch => {
        try {
          unwatch();
        } catch (error) {
          logError(error as Error);
        }
      });
    };
  }, [publicClient, tokenSaleAddresses, handleTokenSaleEvent]);
};
