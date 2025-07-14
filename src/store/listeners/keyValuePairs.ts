import { legacy } from '@decentdao/decent-contracts';
import { useEffect } from 'react';
import { Address, getContract } from 'viem';
import useNetworkPublicClient from '../../hooks/useNetworkPublicClient';
import { useNetworkConfigStore } from '../../providers/NetworkConfig/useNetworkConfigStore';
import { GaslessVotingDaoData } from '../../types';
import { useGovernanceFetcher } from '../fetchers/governance';
import { useKeyValuePairsFetcher } from '../fetchers/keyValuePairs';

export function useKeyValuePairsListener({
  safeAddress,
  onRolesDataFetched,
  onGaslessVotingDataFetched,
}: {
  safeAddress?: Address;
  onRolesDataFetched: (rolesData: {
    contextChainId: number;
    hatsTreeId: number | null | undefined;
    streamIdsToHatIds: { hatId: bigint; streamId: string }[];
  }) => void;
  onGaslessVotingDataFetched: (gasslesVotingData: GaslessVotingDaoData) => void;
}) {
  const { getStreamIdsToHatIds, getHatsTreeId } = useKeyValuePairsFetcher();
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

    const unwatch = keyValuePairsContract.watchEvent.ValueUpdated(
      {
        theAddress: safeAddress,
      },
      {
        onLogs: logs => {
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

          fetchGaslessVotingDAOData({
            events: logs,
            safeAddress,
          }).then(gaslessVotingDaoData => {
            if (gaslessVotingDaoData) {
              onGaslessVotingDataFetched(gaslessVotingDaoData);
            }
          });
        },
      },
    );
    return () => {
      unwatch();
    };
  }, [
    fetchGaslessVotingDAOData,
    getHatsTreeId,
    getStreamIdsToHatIds,
    onGaslessVotingDataFetched,
    onRolesDataFetched,
    publicClient,
    safeAddress,
    keyValuePairs,
  ]);
}
