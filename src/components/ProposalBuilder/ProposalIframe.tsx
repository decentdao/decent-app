import { Box } from '@chakra-ui/react';
import { useNetworkConfigStore } from '../../providers/NetworkConfig/useNetworkConfigStore';
import { useDaoInfoStore } from '../../store/daoInfo/useDaoInfoStore';
import { Stream } from '../../types/proposalBuilder';
import SafeInjectIframeCard from '../SafeInjectIframeCard';
import {
  SafeInjectProvider,
  useSafeInject,
} from '../SafeInjectIframeCard/context/SafeInjectedContext';

export function ProposalIframe({
  pendingTransaction,
  values: { streams },
  setFieldValue,
}: {
  pendingTransaction: boolean;
  values: { streams: Stream[] };
  setFieldValue: (field: string, value: any) => void;
}) {
  const { safe } = useDaoInfoStore();
  const { chain } = useNetworkConfigStore();
  const { latestTransaction, setAddress, address } = useSafeInject();

  return (
    <Box>
      <SafeInjectProvider
        defaultAddress={safe?.address}
        chainId={chain.id}
      >
        <SafeInjectIframeCard />
      </SafeInjectProvider>
    </Box>
  );
}
