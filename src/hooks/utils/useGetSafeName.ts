import { useCallback } from 'react';
import { Address, GetEnsNameReturnType } from 'viem';
import { createDecentSubgraphClient } from '../../graphql';
import { DAOQuery, DAOQueryResponse } from '../../graphql/DAOQueries';
import { useNetworkConfigStore } from '../../providers/NetworkConfig/useNetworkConfigStore';
import { NetworkConfig } from '../../types/network';
import { useNetworkEnsNameAsync } from '../useNetworkEnsName';
import { createAccountSubstring } from './useGetAccountName';

export const getSafeName = async (
  networkConfig: NetworkConfig,
  address: Address,
  getEnsName: (args: { address: Address }) => Promise<GetEnsNameReturnType>,
) => {
  const ensName = await getEnsName({ address });
  if (ensName) {
    return ensName;
  }

  const client = createDecentSubgraphClient(networkConfig);
  const queryResult = await client.query<DAOQueryResponse>(DAOQuery, { safeAddress: address });

  const subgraphName = queryResult.data?.daos[0]?.name;

  if (subgraphName) {
    return subgraphName;
  }

  return createAccountSubstring(address);
};

export const useGetSafeName = (chainId?: number) => {
  const { getConfigByChainId } = useNetworkConfigStore();
  const { getEnsName } = useNetworkEnsNameAsync();

  return {
    getSafeName: useCallback(
      (address: Address) => {
        const config = getConfigByChainId(chainId);
        return getSafeName(config, address, getEnsName);
      },
      [chainId, getConfigByChainId, getEnsName],
    ),
  };
};
