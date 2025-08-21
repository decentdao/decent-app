import { splitV2ABI } from '@0xsplits/splits-sdk/constants/abi';
import { useCallback, useState } from 'react';
import { Address, encodeFunctionData, getAddress } from 'viem';
import { useCreateSplitsClient } from '../../../hooks/revenueShare/useSplitsClient';
import { RevenueSharingWallet } from '../../../types/revShare';

export function useDistributeAllRevenue(wallet: RevenueSharingWallet | undefined) {
  const [isPending, setPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const splitClient = useCreateSplitsClient();

  const distribute = useCallback(async () => {
    setPending(true);
    setError(null);

    try {
      if (!wallet?.tokens || wallet.tokens.length === 0) {
        throw new Error('No tokens to distribute');
      }
      if (!splitClient) {
        throw new Error('No split client available');
      }

      // Build distribution calls for each token using Viem encoding but splits SDK multicall
      const calls = wallet.tokens.map(token => ({
        address: wallet.address as Address,
        value: 0n,
        data: encodeFunctionData({
          abi: splitV2ABI,
          functionName: 'distribute',
          args: [
            {
              recipients: wallet.splits?.map(split => getAddress(split.address)) || [],
              allocations: wallet.splits?.map(split => BigInt(split.percentage * 10000)) || [],
              totalAllocation: BigInt(1_000_000), // 100% in PPM
              distributionIncentive: 0,
            },
            token,
            splitClient._walletClient?.account?.address as Address,
          ],
        }),
      }));

      // Execute all distributions using splitsClient.multicall
      const { events } = await splitClient.multicall({ calls });

      return events;
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      setError(err);
      throw err;
    } finally {
      setPending(false);
    }
  }, [wallet, splitClient]);

  return {
    distribute,
    isPending,
    error,
  };
}
