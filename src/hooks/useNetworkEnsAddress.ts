import { useCallback } from 'react';
import { createPublicClient, http, isAddress } from 'viem';
import { mainnet } from 'viem/chains';
import { useEnsAddress } from 'wagmi';
import {
  supportedEnsNetworks,
  useNetworkConfigStore,
} from '../providers/NetworkConfig/useNetworkConfigStore';

interface UseNetworkEnsAddressProps {
  chainId?: number;
  name?: string;
}

export function useNetworkEnsAddress(props?: UseNetworkEnsAddressProps) {
  const { chain } = useNetworkConfigStore();
  const desiredChainId = props?.chainId ?? chain.id;
  const effectiveChainId = supportedEnsNetworks.includes(desiredChainId)
    ? desiredChainId
    : mainnet.id;

  return useEnsAddress({ name: props?.name, chainId: effectiveChainId });
}

export function useNetworkEnsAddressAsync() {
  const { chain, getConfigByChainId } = useNetworkConfigStore();

  const getEnsAddress = useCallback(
    (args: { name: string; chainId?: number }) => {
      if (isAddress(args.name)) {
        return Promise.resolve(args.name);
      }

      let effectiveChainId: number;
      if (args.chainId !== undefined) {
        if (!supportedEnsNetworks.includes(args.chainId)) {
          throw new Error(`ENS is not supported for chain ${args.chainId}`);
        }
        effectiveChainId = args.chainId;
      } else {
        effectiveChainId = supportedEnsNetworks.includes(chain.id) ? chain.id : mainnet.id;
      }

      const networkConfig = getConfigByChainId(effectiveChainId);
      const publicClient = createPublicClient({
        chain: networkConfig.chain,
        transport: http(networkConfig.rpcEndpoint),
      });
      return publicClient.getEnsAddress({ name: args.name });
    },
    [chain, getConfigByChainId],
  );

  return { getEnsAddress };
}
