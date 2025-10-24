import { legacy } from '@decentdao/decent-contracts';
import { hatIdToTreeId } from '@hatsprotocol/sdk-v1-core';
import { useCallback } from 'react';
import { Address, GetContractEventsReturnType, getContract } from 'viem';
import { logError } from '../../helpers/errorLogging';
import useNetworkPublicClient from '../../hooks/useNetworkPublicClient';
import { useNetworkConfigStore } from '../../providers/NetworkConfig/useNetworkConfigStore';
import { TokenSaleMetadata } from '../../types/tokenSale';
import { normalizeBuyerRequirements } from '../../utils/buyerRequirementsNormalizer';

export function useKeyValuePairsFetcher() {
  const publicClient = useNetworkPublicClient();
  const {
    contracts: { keyValuePairs, sablierV2Lockup },
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

      // Support both legacy (hatIdToStreamId) and V2 (hatIdToStreamIdV2) events
      const legacyEvents = events.filter(
        event => event.args.key && event.args.key === 'hatIdToStreamId',
      );

      const hatIdIdsToStreamIds = [];

      // Process legacy events using sablierV2LockupLinear address
      for (const event of legacyEvents) {
        const hatIdToStreamId = event.args.value;
        if (hatIdToStreamId !== undefined) {
          const [hatId, streamId] = hatIdToStreamId.split(':');
          const formattedStreamId = `${sablierV2Lockup.toLowerCase()}-${chainId}-${streamId}`;
          const hatIdBigInt = BigInt(hatId);

          hatIdIdsToStreamIds.push({
            hatId: hatIdBigInt,
            streamId: formattedStreamId,
          });
          continue;
        }
        logError({
          message: "KVPairs 'hatIdToStreamId' (legacy) without a value",
          network: chainId,
          args: {
            transactionHash: event.transactionHash,
            logIndex: event.logIndex,
          },
        });
      }

      return hatIdIdsToStreamIds;
    },
    [sablierV2Lockup],
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

  const getTokenSaleAddresses = useCallback(
    async ({
      events,
      chainId,
    }: {
      events: GetContractEventsReturnType<typeof legacy.abis.KeyValuePairs> | undefined;
      chainId: number;
    }) => {
      if (!events) {
        return [];
      }

      // get all events where `newtokensale` was set
      const tokenSaleEvents = events.filter(
        event => event.args.key && event.args.key === 'newtokensale',
      );

      const tokenSaleMetadata: TokenSaleMetadata[] = [];

      for (const event of tokenSaleEvents) {
        if (event.args.value) {
          try {
            const metadata = JSON.parse(event.args.value);
            if (metadata.tokenSaleAddress) {
              const normalizedRequirements = await normalizeBuyerRequirements(
                metadata.buyerRequirements || [],
                publicClient,
              );
              tokenSaleMetadata.push({
                tokenSaleAddress: metadata.tokenSaleAddress,
                tokenSaleName: metadata.tokenSaleName,
                buyerRequirements: normalizedRequirements,
                kyc: metadata.kyc || null,
                orOutOf: metadata.orOutOf,
              });
            }
          } catch (error) {
            logError({
              message: 'Failed to parse token sale metadata from KVPairs event',
              network: chainId,
              args: {
                transactionHash: event.transactionHash,
                logIndex: event.logIndex,
                value: event.args.value,
              },
            });
          }
        }
      }

      return tokenSaleMetadata;
    },
    [publicClient],
  );

  return { getHatsTreeId, getStreamIdsToHatIds, getTokenSaleAddresses, fetchKeyValuePairsData };
}
