import { useEffect, useState } from 'react';
import { decodeTransactionsWithABI } from '../../../helpers/transactionDecoder';
import { useABI } from '../../../hooks/utils/useABI';
import { useNetworkConfigStore } from '../../../providers/NetworkConfig/useNetworkConfigStore';
import { useDaoInfoStore } from '../../../store/daoInfo/useDaoInfoStore';
import { CreateProposalTransaction } from '../../../types';
import SafeInjectIframeCard from '../../SafeInjectIframe/SafeInjectIframeCard';
import { SafeInjectProvider } from '../../SafeInjectIframe/context/SafeInjectProvider';
import { ModalType } from './ModalProvider';
import { useDecentModal } from './useDecentModal';

export function IframeModal() {
  const { safe } = useDaoInfoStore();
  const { chain } = useNetworkConfigStore();
  const { loadABI } = useABI();

  const [connectAppUrl, setConnectAppUrl] = useState<string>('Unknown');
  const [decodedTransactions, setDecodedTransactions] = useState<CreateProposalTransaction[]>([]);
  const openConfirmTransactionModal = useDecentModal(ModalType.CONFIRM_TRANSACTION, {
    appName: connectAppUrl, // url can be a key to real appName in future
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
      onAppConnected={url => {
        setConnectAppUrl(url);
      }}
    >
      <SafeInjectIframeCard />
    </SafeInjectProvider>
  );
}
