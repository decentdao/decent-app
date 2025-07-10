import { legacy } from '@decentdao/decent-contracts';
import { hatIdToTreeId } from '@hatsprotocol/sdk-v1-core';
import { useCallback } from 'react';
import { Address, GetContractEventsReturnType, getContract } from 'viem';
import { logError } from '../../helpers/errorLogging';
import useNetworkPublicClient from '../../hooks/useNetworkPublicClient';
import { useNetworkConfigStore } from '../../providers/NetworkConfig/useNetworkConfigStore';

export function useKeyValuePairsFetcher() {
  const publicClient = useNetworkPublicClient();
  const {
    contracts: { keyValuePairs, sablierV2LockupLinear },
  } = useNetworkConfigStore();
  const getHatsTreeId = useCallback(
    ({
      events,
      chainId,
    }: {
      events: GetContractEventsReturnType<typeof legacy.abis.KeyValuePairs> | undefined;
      chainId: number;
    }) => {
      if (!events) {
        return null;
      }

      // get most recent event where `topHatId` was set
      const topHatIdEvent = events
        .filter(event => event.args.key && event.args.key === 'topHatId')
        .pop();

      if (!topHatIdEvent) {
        return null;
      }

      if (!topHatIdEvent.args.value) {
        logError({
          message: "KVPairs 'topHatIdEvent' without a value",
          network: chainId,
          args: {
            transactionHash: topHatIdEvent.transactionHash,
            logIndex: topHatIdEvent.logIndex,
          },
        });
        return undefined;
      }

      try {
        const topHatId = BigInt(topHatIdEvent.args.value);
        const treeId = hatIdToTreeId(topHatId);
        return treeId;
      } catch (e) {
        logError({
          message: "KVPairs 'topHatIdEvent' value not a number",
          network: chainId,
          args: {
            transactionHash: topHatIdEvent.transactionHash,
            logIndex: topHatIdEvent.logIndex,
          },
        });
        return undefined;
      }
    },
    [],
  );

  const getStreamIdsToHatIds = useCallback(
    ({
      events,
      chainId,
    }: {
      events: GetContractEventsReturnType<typeof legacy.abis.KeyValuePairs> | undefined;
      chainId: number;
    }) => {
      if (!events) {
        return [];
      }

      const hatIdToStreamIdEvents = events.filter(
        event => event.args.key && event.args.key === 'hatIdToStreamId',
      );

      const hatIdIdsToStreamIds = [];
      for (const event of hatIdToStreamIdEvents) {
        const hatIdToStreamId = event.args.value;
        if (hatIdToStreamId !== undefined) {
          const [hatId, streamId] = hatIdToStreamId.split(':');
          hatIdIdsToStreamIds.push({
            hatId: BigInt(hatId),
            streamId: `${sablierV2LockupLinear.toLowerCase()}-${chainId}-${streamId}`,
          });
          continue;
        }
        logError({
          message: "KVPairs 'hatIdToStreamId' without a value",
          network: chainId,
          args: {
            transactionHash: event.transactionHash,
            logIndex: event.logIndex,
          },
        });
      }
      return hatIdIdsToStreamIds;
    },
    [sablierV2LockupLinear],
  );

  const fetchKeyValuePairsData = useCallback(
    async ({ safeAddress }: { safeAddress?: Address }) => {
      if (!safeAddress) {
        return;
      }

      const keyValuePairsContract = getContract({
        abi: legacy.abis.KeyValuePairs,
        address: keyValuePairs,
        client: publicClient,
      });

      const events = await keyValuePairsContract.getEvents.ValueUpdated(
        { theAddress: safeAddress },
        { fromBlock: 0n },
      );

      return {
        events,
        hatsTreeId: getHatsTreeId({ events, chainId: publicClient.chain.id }),
        streamIdsToHatIds: getStreamIdsToHatIds({ events, chainId: publicClient.chain.id }),
      };
    },
    [getHatsTreeId, getStreamIdsToHatIds, keyValuePairs, publicClient],
  );

  return { getHatsTreeId, getStreamIdsToHatIds, fetchKeyValuePairsData };
}
