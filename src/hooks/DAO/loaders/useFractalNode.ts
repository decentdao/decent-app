import { useCallback, useEffect, useRef, useState } from 'react';
import { Address, getAddress, isAddress } from 'viem';
import { createDecentSubgraphClient } from '../../../graphql';
import { DAOQuery, DAOQueryResponse } from '../../../graphql/DAOQueries';
import { useFractal } from '../../../providers/App/AppProvider';
import { useSafeAPI } from '../../../providers/App/hooks/useSafeAPI';
import { useNetworkConfigStore } from '../../../providers/NetworkConfig/useNetworkConfigStore';
import { useDaoInfoStore } from '../../../store/daoInfo/useDaoInfoStore';
import { useDecentModules } from './useDecentModules';

export const useFractalNode = ({
  addressPrefix,
  safeAddress,
  wrongNetwork,
  invalidQuery,
}: {
  addressPrefix?: string;
  safeAddress?: Address;
  wrongNetwork?: boolean;
  invalidQuery?: boolean;
}) => {
  const safeApi = useSafeAPI();
  const lookupModules = useDecentModules();
  // tracks the current valid Safe address and chain id; helps prevent unnecessary calls
  const currentValidSafe = useRef<string>();
  const [errorLoading, setErrorLoading] = useState<boolean>(false);
  const { getConfigByChainId, chain } = useNetworkConfigStore();

  const { action } = useFractal();

  const { setDaoInfo, setSafeInfo, setDecentModules } = useDaoInfoStore();

  const reset = useCallback(
    ({ error }: { error: boolean }) => {
      currentValidSafe.current = undefined;
      action.resetSafeState();
      setErrorLoading(error);
    },
    [action],
  );

  const setDAO = useCallback(async () => {
    if (addressPrefix && safeAddress) {
      currentValidSafe.current = `${addressPrefix}${safeAddress}`;
      setErrorLoading(false);

      try {
        const safeInfo = await safeApi.getSafeData(safeAddress);
        setSafeInfo(safeInfo);

        const modules = await lookupModules(safeInfo.modules);

        const client = createDecentSubgraphClient(getConfigByChainId(chain.id));
        const graphRawNodeData = await client.query<DAOQueryResponse>(DAOQuery, { safeAddress });

        if (graphRawNodeData.error) {
          console.error('Failed to fetch DAO data', graphRawNodeData.error);
        }

        const graphDAOData = graphRawNodeData.data?.daos[0];

        if (!graphRawNodeData || !graphDAOData) {
          setDaoInfo({
            parentAddress: null,
            childAddresses: [],
            daoName: null,
            daoSnapshotENS: null,
            proposalTemplatesHash: null,
          });
          console.error('No graph data found');
        }

        setDecentModules(modules);

        setDaoInfo({
          parentAddress:
            graphDAOData?.parentAddress && isAddress(graphDAOData.parentAddress)
              ? getAddress(graphDAOData.parentAddress)
              : null,
          childAddresses:
            graphDAOData?.hierarchy?.map((child: { address: string }) =>
              getAddress(child.address),
            ) ?? [],
          daoName: graphDAOData?.name ?? null,
          daoSnapshotENS: graphDAOData?.snapshotENS ?? null,
          proposalTemplatesHash: graphDAOData?.proposalTemplatesHash ?? null,
        });
      } catch (e) {
        console.error('Error in setDAO:', e);
        reset({ error: true });
        return;
      }
    }
  }, [
    addressPrefix,
    safeAddress,
    safeApi,
    setSafeInfo,
    lookupModules,
    getConfigByChainId,
    chain.id,
    setDecentModules,
    setDaoInfo,
    reset,
  ]);

  useEffect(() => {
    if (
      `${addressPrefix}${safeAddress}` !== currentValidSafe.current &&
      !wrongNetwork &&
      !invalidQuery
    ) {
      reset({ error: false });
      setDAO();
    }
  }, [addressPrefix, safeAddress, setDAO, reset, wrongNetwork, invalidQuery]);

  return { errorLoading };
};
