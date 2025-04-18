import { useEffect } from 'react';
import { getAddress, isAddress } from 'viem';
import { createDecentSubgraphClient } from '../graphql';
import { DAOQuery, DAOQueryResponse } from '../graphql/DAOQueries';
import useFeatureFlag from '../helpers/environmentFeatureFlags';
import { useDecentModules } from '../hooks/DAO/loaders/useDecentModules';
import { useCurrentDAOKey } from '../hooks/DAO/useCurrentDAOKey';
import { useSafeAPI } from '../providers/App/hooks/useSafeAPI';
import { useNetworkConfigStore } from '../providers/NetworkConfig/useNetworkConfigStore';
import { DAOSubgraph } from '../types';
import { useGlobalStore } from './store';

// TODO: This will be split into multiple fetchers and invoking those fetchers, much like SafeController does
export const useGlobalStoreFetcher = () => {
  const safeApi = useSafeAPI();
  const lookupModules = useDecentModules();
  const { daoKey, safeAddress, invalidQuery, wrongNetwork } = useCurrentDAOKey();
  const { setDaoNode } = useGlobalStore();
  const { chain, getConfigByChainId } = useNetworkConfigStore();
  const storeFeatureEnabled = useFeatureFlag('flag_store_v2');

  useEffect(() => {
    async function fetchDaoNode() {
      if (!daoKey || !safeAddress || invalidQuery || wrongNetwork || !storeFeatureEnabled) return;

      const safeInfo = await safeApi.getSafeData(safeAddress);
      const modules = await lookupModules(safeInfo.modules);

      const client = createDecentSubgraphClient(getConfigByChainId(chain.id));
      const graphRawNodeData = await client.query<DAOQueryResponse>(DAOQuery, { safeAddress });

      if (graphRawNodeData.error) {
        console.error('Failed to fetch DAO data', graphRawNodeData.error);
        return;
      }

      const graphDAOData = graphRawNodeData.data?.daos[0];

      if (!graphDAOData) {
        console.error('No graph data found');
        return;
      }

      const daoInfo: DAOSubgraph = {
        parentAddress:
          graphDAOData?.parentAddress && isAddress(graphDAOData.parentAddress)
            ? getAddress(graphDAOData.parentAddress)
            : null,
        childAddresses:
          graphDAOData?.hierarchy?.map((child: { address: string }) => getAddress(child.address)) ??
          [],
        daoName: graphDAOData?.name ?? null,
        daoSnapshotENS: graphDAOData?.snapshotENS ?? null,
        proposalTemplatesHash: graphDAOData?.proposalTemplatesHash ?? null,
      };

      setDaoNode(daoKey, {
        safe: safeInfo,
        daoInfo,
        modules: modules,
      });
    }

    fetchDaoNode();
  }, [
    safeAddress,
    daoKey,
    safeApi,
    lookupModules,
    chain,
    setDaoNode,
    getConfigByChainId,
    invalidQuery,
    wrongNetwork,
    storeFeatureEnabled,
  ]);
};
