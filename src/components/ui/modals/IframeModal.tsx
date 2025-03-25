import { Box, VStack, Text } from '@chakra-ui/react';
import { useContext, useEffect, useState } from 'react';
import { decodeTransactionsWithABI } from '../../../helpers/transactionDecoder';
import { useABI } from '../../../hooks/utils/useABI';
import { useNetworkConfigStore } from '../../../providers/NetworkConfig/useNetworkConfigStore';
import { useDaoInfoStore } from '../../../store/daoInfo/useDaoInfoStore';
import { CreateProposalTransaction } from '../../../types';
import { SafeInjectContext } from '../../SafeInjectIframe/context/SafeInjectContext';
import { SafeInjectProvider } from '../../SafeInjectIframe/context/SafeInjectProvider';
import { InfoBoxLoader } from '../loaders/InfoBoxLoader';
import { ModalType } from './ModalProvider';
import { useDecentModal } from './useDecentModal';

function Iframe({ appUrl }: { appUrl: string }) {
  const { iframeRef, connecting } = useContext(SafeInjectContext);

  return (
    <Box overflowY="auto">
      {connecting && <InfoBoxLoader />}
      <Box
        as="iframe"
        ref={iframeRef}
        hidden={connecting}
        src={appUrl}
        height="80vh"
        width="full"
        p={2}
        allow="clipboard-write"
      />
    </Box>
  );
}

export function IframeModal({ appName, appUrl }: { appName: string; appUrl: string }) {
  const { safe } = useDaoInfoStore();
  const { chain } = useNetworkConfigStore();
  const { loadABI } = useABI();

  const [decodedTransactions, setDecodedTransactions] = useState<CreateProposalTransaction[]>([]);
  const openConfirmTransactionModal = useDecentModal(ModalType.CONFIRM_TRANSACTION, {
    appName,
    transactionArray: decodedTransactions,
  });

  useEffect(() => {
    if (decodedTransactions.length > 0) {
      openConfirmTransactionModal();
    }
  }, [decodedTransactions, openConfirmTransactionModal]);

  return (
    <SafeInjectProvider
      defaultAddress={safe?.address}
      defaultAppUrl={appUrl}
      chainId={chain.id}
      onTransactionsReceived={transactions => {
        (async () => {
          if (transactions && transactions.length > 0) {
            const { decodedTransactions: decoded } = await decodeTransactionsWithABI(
              transactions,
              loadABI,
            );
            setDecodedTransactions(decoded);
          }
        })();
      }}
    >
      <VStack
        align="left"
        px="1rem"
        mt={3}
      >
        <Text
          textStyle="heading-large"
          color="white-0"
        >
          {appName}
        </Text>

        <Iframe appUrl={appUrl} />
      </VStack>
    </SafeInjectProvider>
  );
}
