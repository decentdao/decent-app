import { mainnet } from 'viem/chains';
import { useEnsAvatar } from 'wagmi';
import {
  supportedEnsNetworks,
  useNetworkConfigStore,
} from '../providers/NetworkConfig/useNetworkConfigStore';

interface UseNetworkEnsAvatarProps {
  name?: string;
  chainId?: number;
}

export function useNetworkEnsAvatar(props?: UseNetworkEnsAvatarProps) {
  const { chain } = useNetworkConfigStore();

  let effectiveChainId: number;

  if (props?.chainId !== undefined) {
    if (!supportedEnsNetworks.includes(props.chainId)) {
      throw new Error(`ENS is not supported for chain ${props.chainId}`);
    }
    effectiveChainId = props.chainId;
  } else {
    // Use the network's chain id if supported, otherwise fallback to mainnet.
    effectiveChainId = supportedEnsNetworks.includes(chain.id) ? chain.id : mainnet.id;
  }

  return useEnsAvatar({ name: props?.name, chainId: effectiveChainId });
}
