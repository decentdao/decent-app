import { useCallback } from 'react';
import { Address, getAddress, isAddress } from 'viem';
import { createDecentSubgraphClient } from '../../graphql';
import { DAOQuery, DAOQueryResponse } from '../../graphql/DAOQueries';
import useFeatureFlag from '../../helpers/environmentFeatureFlags';
import { useDecentModules } from '../../hooks/DAO/loaders/useDecentModules';
import { getDaoData } from '../../providers/App/decentAPI';
import { useSafeAPI } from '../../providers/App/hooks/useSafeAPI';
import { useNetworkConfigStore } from '../../providers/NetworkConfig/useNetworkConfigStore';
import { DAOSubgraph, DecentModule, FractalModuleType } from '../../types';

/**
 * `useNodeFetcher` is used as an abstraction layer over logic of fetching DAO node data
 * For now it only loads data from Safe API and Decent Subgraph
 * In the future it will be extended to support other sources of data
 */
export function useNodeFetcher() {
  const USE_API = useFeatureFlag('flag_api');
  const lookupModules = useDecentModules();
  const safeApi = useSafeAPI();
  const { getConfigByChainId } = useNetworkConfigStore();

  const fetchDAONodeFromAPI = useCallback(
    async ({ safeAddress, chainId }: { safeAddress: Address; chainId: number }) => {
      const safe = await safeApi.getSafeData(safeAddress); // @TODO: get from API

      const daoData = await getDaoData(chainId, safeAddress);
      const daoInfo = {
        parentAddress: daoData.parentAddress,
        childAddresses: [], // @TODO: update API to return this field
        daoName: daoData.name,
        daoSnapshotENS: daoData.snapshotENS,
        proposalTemplatesHash: daoData.proposalTemplatesCID,
      };

      const modules =
        daoData.governanceModules.map(
          module =>
            ({
              moduleAddress: module.address,
              moduleType: FractalModuleType[module.type],
            }) as DecentModule,
        ) || [];

      return {
        safe,
        daoInfo,
        modules,
      };
    },
    [safeApi],
  );

  const fetchDAONodeFromApp = useCallback(
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
  const fetchDAONode = USE_API ? fetchDAONodeFromAPI : fetchDAONodeFromApp;
  return { fetchDAONode };
}
