import { legacy } from '@decentdao/decent-contracts';
import { useEffect } from 'react';
import { Address, getContract } from 'viem';
import { logError } from '../../helpers/errorLogging';
import useNetworkPublicClient from '../../hooks/useNetworkPublicClient';
import { useNetworkConfigStore } from '../../providers/NetworkConfig/useNetworkConfigStore';
import { GaslessVotingDaoData } from '../../types';
import { BuyerRequirement } from '../../types/tokenSale';
import { useGovernanceFetcher } from '../fetchers/governance';
import { useKeyValuePairsFetcher } from '../fetchers/keyValuePairs';

export function useKeyValuePairsListener({
  safeAddress,
  onRolesDataFetched,
  onGaslessVotingDataFetched,
  onTokenSalesDataFetched,
}: {
  safeAddress?: Address;
  onRolesDataFetched: (rolesData: {
    contextChainId: number;
    hatsTreeId: number | null | undefined;
    streamIdsToHatIds: { hatId: bigint; streamId: string }[];
  }) => void;
  onGaslessVotingDataFetched: (gasslesVotingData: GaslessVotingDaoData) => void;
  onTokenSalesDataFetched: (
    tokenSaleAddresses: string[],
    tokenSaleMetadata?: Array<{
      address: string;
      name?: string;
      buyerRequirements?: BuyerRequirement[];
    }>,
  ) => void;
}) {
  const { getStreamIdsToHatIds, getHatsTreeId, getTokenSaleAddresses } = useKeyValuePairsFetcher();
  const { fetchGaslessVotingDAOData } = useGovernanceFetcher();
  const publicClient = useNetworkPublicClient();
  const {
    contracts: { keyValuePairs },
  } = useNetworkConfigStore();

  useEffect(() => {
    if (!safeAddress) {
      return;
    }

    const keyValuePairsContract = getContract({
      abi: legacy.abis.KeyValuePairs,
      address: keyValuePairs,
      client: publicClient,
    });

    const handleValueUpdated = async (logs: any[]) => {
      try {
        // dev: when this event is captured in realtime, give the subgraph
        // time to index, and do that most cleanly by not even telling the rest
        // of our code that we have the hats tree id until some time has passed.
        onRolesDataFetched({
          contextChainId: publicClient.chain.id,
          hatsTreeId: getHatsTreeId({ events: logs, chainId: publicClient.chain.id }),
          streamIdsToHatIds: getStreamIdsToHatIds({
            events: logs,
            chainId: publicClient.chain.id,
          }),
        });

        const gaslessVotingDaoData = await fetchGaslessVotingDAOData({
          events: logs,
          safeAddress,
        });

        if (gaslessVotingDaoData) {
          onGaslessVotingDataFetched(gaslessVotingDaoData);
        }

        const tokenSaleMetadata = getTokenSaleAddresses({
          events: logs,
          chainId: publicClient.chain.id,
        });

        if (tokenSaleMetadata.length > 0) {
          const addresses = tokenSaleMetadata.map(meta => meta.address);
          onTokenSalesDataFetched(addresses, tokenSaleMetadata);
        }
      } catch (e) {
        logError(e as Error);
      }
    };

    const unwatch = keyValuePairsContract.watchEvent.ValueUpdated(
      {
        theAddress: safeAddress,
      },
      {
        onLogs: handleValueUpdated,
      },
    );

    return () => {
      unwatch();
    };
  }, [
    publicClient,
    safeAddress,
    keyValuePairs,
    fetchGaslessVotingDAOData,
    getHatsTreeId,
    getStreamIdsToHatIds,
    getTokenSaleAddresses,
    onGaslessVotingDataFetched,
    onRolesDataFetched,
    onTokenSalesDataFetched,
  ]);
}
