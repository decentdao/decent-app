import { useCallback } from 'react';
import { Address, getAddress, isAddress } from 'viem';
import { createDecentSubgraphClient } from '../../graphql';
import { DAOQuery, DAOQueryResponse } from '../../graphql/DAOQueries';
import { useDecentModules } from '../../hooks/DAO/loaders/useDecentModules';
import { useSafeAPI } from '../../providers/App/hooks/useSafeAPI';
import { useNetworkConfigStore } from '../../providers/NetworkConfig/useNetworkConfigStore';
import { DAOSubgraph } from '../../types';

/**
 * `useNodeFetcher` is used as an abstraction layer over logic of fetching DAO node data
 * For now it only loads data from Safe API and Decent Subgraph
 * In the future it will be extended to support other sources of data
 */
export function useNodeFetcher() {
  const lookupModules = useDecentModules();
  const safeApi = useSafeAPI();
  const { getConfigByChainId } = useNetworkConfigStore();

  const fetchDAONode = useCallback(
    async ({ safeAddress, chainId }: { safeAddress: Address; chainId: number }) => {
      const safe = await safeApi.getSafeData(safeAddress);
      const modules = await lookupModules(safe.modules);

      const client = createDecentSubgraphClient(getConfigByChainId(chainId));
      const graphRawNodeData = await client.query<DAOQueryResponse>(DAOQuery, { safeAddress });

      if (graphRawNodeData.error) {
        console.error('Failed to fetch DAO data', graphRawNodeData.error);
      }

      const graphDAOData = graphRawNodeData.data?.daos[0];

      if (!graphDAOData) {
        console.warn('No graph data found');
      }

      const parentAddress =
        graphDAOData?.parentAddress && isAddress(graphDAOData.parentAddress)
          ? getAddress(graphDAOData.parentAddress)
          : null;

      const daoInfo: DAOSubgraph = {
        parentAddress,
        childAddresses:
          graphDAOData?.hierarchy?.map((child: { address: string }) => getAddress(child.address)) ??
          [],
        daoName: graphDAOData?.name ?? null,
        daoSnapshotENS: graphDAOData?.snapshotENS ?? null,
        proposalTemplatesHash: graphDAOData?.proposalTemplatesHash ?? null,
      };

      return {
        safe,
        daoInfo,
        modules,
      };
    },
    [lookupModules, safeApi, getConfigByChainId],
  );

  return { fetchDAONode };
}
