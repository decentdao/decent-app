import { useNetworkConfigStore } from '../../../providers/NetworkConfig/useNetworkConfigStore';
import { useDaoInfoStore } from '../../../store/daoInfo/useDaoInfoStore';
import SafeInjectIframeCard from '../../SafeInjectIframe/SafeInjectIframeCard';
import { SafeInjectProvider } from '../../SafeInjectIframe/context/SafeInjectProvider';

export function IframeModal() {
  const { safe } = useDaoInfoStore();
  const { chain } = useNetworkConfigStore();

  return (
    <SafeInjectProvider
      defaultAddress={safe?.address}
      chainId={chain.id}
    >
      <SafeInjectIframeCard />
    </SafeInjectProvider>
  );
}
