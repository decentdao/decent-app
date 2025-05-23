import { abis } from '@fractal-framework/fractal-contracts';
import { useEffect } from 'react';
import { Address, getContract } from 'viem';
import useFeatureFlag from '../../helpers/environmentFeatureFlags';
import useNetworkPublicClient from '../../hooks/useNetworkPublicClient';
import { useNetworkConfigStore } from '../../providers/NetworkConfig/useNetworkConfigStore';
import { useGovernanceFetcher } from '../fetchers/governance';
import { useRolesFetcher } from '../fetchers/roles';

export function useRolesListener({
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
  onGaslessVotingDataFetched: (gasslesVotingData: {
    gaslessVotingEnabled: boolean;
    paymasterAddress: Address | null;
  }) => void;
}) {
  const { getStreamIdsToHatIds, getHatsTreeId } = useRolesFetcher();
  const { fetchGaslessVotingDAOData } = useGovernanceFetcher();
  const storeFeatureEnabled = useFeatureFlag('flag_store_v2');
  const publicClient = useNetworkPublicClient();
  const {
    contracts: { keyValuePairs },
  } = useNetworkConfigStore();

  useEffect(() => {
    if (!storeFeatureEnabled || !safeAddress) {
      return;
    }

    const keyValuePairsContract = getContract({
      abi: abis.KeyValuePairs,
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
    storeFeatureEnabled,
    keyValuePairs,
  ]);
}
