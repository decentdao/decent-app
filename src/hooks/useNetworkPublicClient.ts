import { useMemo } from 'react';
import { createPublicClient, http } from 'viem';
import {
  getNetworkConfig,
  useNetworkConfigStore,
} from '../providers/NetworkConfig/useNetworkConfigStore';
import { getChainIdFromPrefix } from '../utils/url';
import { useCurrentDAOKey } from './DAO/useCurrentDAOKey';

export default function useNetworkPublicClient() {
  const { addressPrefix: urlAddressPrefix } = useCurrentDAOKey();
  const { addressPrefix, chain, rpcEndpoint } = useNetworkConfigStore();

  const publicClient = useMemo(() => {
    if (urlAddressPrefix && urlAddressPrefix !== addressPrefix) {
      return createPublicClient({
        chain: getNetworkConfig(getChainIdFromPrefix(urlAddressPrefix)).chain,
        transport: http(getNetworkConfig(getChainIdFromPrefix(urlAddressPrefix)).rpcEndpoint),
      });
    }
    return createPublicClient({
      chain,
      transport: http(rpcEndpoint),
    });
  }, [chain, rpcEndpoint, urlAddressPrefix, addressPrefix]);
  return publicClient;
}
