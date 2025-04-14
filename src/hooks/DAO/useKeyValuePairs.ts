import { abis } from '@fractal-framework/fractal-contracts';
import { hatIdToTreeId } from '@hatsprotocol/sdk-v1-core';
import { useEffect } from 'react';
import { Address, GetContractEventsReturnType, PublicClient, getContract, zeroAddress } from 'viem';
import { logError } from '../../helpers/errorLogging';
import { useNetworkConfigStore } from '../../providers/NetworkConfig/useNetworkConfigStore';
import { useDaoInfoStore } from '../../store/daoInfo/useDaoInfoStore';
import { useRolesStore } from '../../store/roles/useRolesStore';
import { getPaymasterAddress } from '../../utils/gaslessVoting';
import useNetworkPublicClient from '../useNetworkPublicClient';

const getGaslessVotingDaoData = async (
  events: GetContractEventsReturnType<typeof abis.KeyValuePairs>,
  safeAddress: Address,
  publicClient: PublicClient,
  zodiacModuleProxyFactory: Address,
  paymasterMastercopy: Address,
  accountAbstraction?: {
    entryPointv07: Address;
    lightAccountFactory: Address;
  },
) => {
  // get most recent event where `gaslessVotingEnabled` was set
  const gaslessVotingEnabledEvent = events
    .filter(event => event.args.key && event.args.key === 'gaslessVotingEnabled')
    .pop();

  if (!gaslessVotingEnabledEvent || !accountAbstraction || !publicClient.chain) {
    return { gaslessVotingEnabled: false, paymasterAddress: null };
  }

  try {
    const paymasterAddress = getPaymasterAddress({
      safeAddress,
      zodiacModuleProxyFactory,
      paymasterMastercopy,
      entryPoint: accountAbstraction.entryPointv07,
      lightAccountFactory: accountAbstraction.lightAccountFactory,
      chainId: publicClient.chain.id,
    });

    const paymasterCode = await publicClient.getCode({
      address: paymasterAddress,
    });

    const paymasterExists = !!paymasterCode && paymasterCode !== '0x';

    const gaslessVotingEnabled = gaslessVotingEnabledEvent.args.value === 'true';
    return { gaslessVotingEnabled, paymasterAddress: paymasterExists ? paymasterAddress : null };
  } catch (e) {
    logError({
      message: 'Error getting gasless voting dao data',
      network: publicClient.chain!.id,
      args: {
        transactionHash: gaslessVotingEnabledEvent.transactionHash,
        logIndex: gaslessVotingEnabledEvent.logIndex,
      },
    });

    return;
  }
};

const getHatsTreeId = (
  events: GetContractEventsReturnType<typeof abis.KeyValuePairs> | undefined,
  chainId: number,
) => {
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
};

const getHatIdsToStreamIds = (
  events: GetContractEventsReturnType<typeof abis.KeyValuePairs> | undefined,
  sablierV2LockupLinear: Address,
  chainId: number,
) => {
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
};

const useKeyValuePairs = () => {
  const publicClient = useNetworkPublicClient();
  const node = useDaoInfoStore();
  const {
    contracts: {
      keyValuePairs,
      sablierV2LockupLinear,
      zodiacModuleProxyFactory,
      paymaster,
      accountAbstraction,
    },
  } = useNetworkConfigStore();
  const { setHatKeyValuePairData, resetHatsStore } = useRolesStore();
  const { setGaslessVotingDaoData } = useDaoInfoStore();
  const safeAddress = node.safe?.address;

  useEffect(() => {
    if (!safeAddress || !publicClient.chain) {
      return;
    }

    const keyValuePairsContract = getContract({
      abi: abis.KeyValuePairs,
      address: keyValuePairs,
      client: publicClient,
    });
    keyValuePairsContract.getEvents
      .ValueUpdated({ theAddress: safeAddress }, { fromBlock: 0n })
      .then(safeEvents => {
        setHatKeyValuePairData({
          contextChainId: publicClient.chain.id,
          hatsTreeId: getHatsTreeId(safeEvents, publicClient.chain.id),
          streamIdsToHatIds: getHatIdsToStreamIds(
            safeEvents,
            sablierV2LockupLinear,
            publicClient.chain.id,
          ),
        });

        getGaslessVotingDaoData(
          safeEvents,
          safeAddress,
          publicClient,
          zodiacModuleProxyFactory,
          paymaster?.decentPaymasterV1MasterCopy ?? zeroAddress,
          accountAbstraction,
        ).then(gaslessVotingDaoData => {
          if (gaslessVotingDaoData) {
            setGaslessVotingDaoData(gaslessVotingDaoData);
          }
        });
      })
      .catch(error => {
        setHatKeyValuePairData({
          hatsTreeId: null,
          contextChainId: publicClient.chain.id,
          streamIdsToHatIds: [],
        });
        logError(error);
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
          setTimeout(() => {
            setHatKeyValuePairData({
              contextChainId: publicClient.chain.id,
              hatsTreeId: getHatsTreeId(logs, publicClient.chain.id),
              streamIdsToHatIds: getHatIdsToStreamIds(
                logs,
                sablierV2LockupLinear,
                publicClient.chain.id,
              ),
            });
          }, 20_000);

          getGaslessVotingDaoData(
            logs,
            safeAddress,
            publicClient,
            zodiacModuleProxyFactory,
            paymaster?.decentPaymasterV1MasterCopy ?? zeroAddress,
            accountAbstraction,
          ).then(gaslessVotingDaoData => {
            if (gaslessVotingDaoData) {
              setGaslessVotingDaoData(gaslessVotingDaoData);
            }
          });
        },
      },
    );
    return () => {
      unwatch();
    };
  }, [
    keyValuePairs,
    safeAddress,
    publicClient,
    setHatKeyValuePairData,
    sablierV2LockupLinear,
    setGaslessVotingDaoData,
    accountAbstraction,
    paymaster,
    zodiacModuleProxyFactory,
  ]);

  useEffect(() => {
    if (safeAddress === undefined) {
      resetHatsStore();
    }
  }, [resetHatsStore, safeAddress]);
};

export { useKeyValuePairs };
