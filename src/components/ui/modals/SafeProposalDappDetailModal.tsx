import { Box, CloseButton, Flex, Text } from '@chakra-ui/react';
import { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { isAddress } from 'viem';
import { decodeTransactionsWithABI } from '../../../helpers/transactionDecoder';
import { useSupportedDapps } from '../../../hooks/DAO/loaders/useSupportedDapps';
import { useABI } from '../../../hooks/utils/useABI';
import { useDebounce } from '../../../hooks/utils/useDebounce';
import LoadingProblem from '../../../pages/LoadingProblem';
import { useNetworkConfigStore } from '../../../providers/NetworkConfig/useNetworkConfigStore';
import { useDaoInfoStore } from '../../../store/daoInfo/useDaoInfoStore';
import { CreateProposalTransaction } from '../../../types';
import { SafeInjectContext } from '../../SafeInjectIframe/context/SafeInjectContext';
import { SafeInjectProvider } from '../../SafeInjectIframe/context/SafeInjectProvider';
import useWalletConnect from '../../SafeInjectIframe/hooks/useWalletConnect';
import { InputComponent } from '../forms/InputComponent';
import { InfoBoxLoader } from '../loaders/InfoBoxLoader';
import { ModalType } from './ModalProvider';
import { useDecentModal } from './useDecentModal';

function Iframe({ appUrl, enableWalletConnect }: { appUrl: string; enableWalletConnect: boolean }) {
  const { t } = useTranslation(['proposalDapps']);
  const {
    address,
    iframeRef,
    connecting: iframeConnecting,
    connectedAppUrl,
    setLatestTransactions,
  } = useContext(SafeInjectContext);
  const [walletConnectUri, setWalletConnectUri] = useState<string>('');
  const [lastConnectedUri, setLastConnectedUri] = useState<string>('');

  const { connect, disconnect, isConnected, connecting } = useWalletConnect({
    uri: walletConnectUri,
    address: address || '',
    setLatestTransactions,
    setUrlInput: () => {},
  });
  // Delay 300ms before connecting, it's time reserved for user input or state update.
  useDebounce<string>(walletConnectUri, 300, (k: string) => {
    if (k !== lastConnectedUri) {
      setLastConnectedUri(k);
      toast.promise(
        async () => {
          if (isConnected) {
            await disconnect();
          }
          await connect();
        },
        {
          loading: t('connectingWalletConnect'),
          success: t('successConnectingWalletConnect'),
          error: t('failConnectingWalletConnect'),
        },
      );
    }
  });

  const appNotSupported = !iframeConnecting && connectedAppUrl !== appUrl;
  const displayWalletConnectURIInput = enableWalletConnect || appNotSupported;

  return (
    <Box>
      {displayWalletConnectURIInput && (
        <Box>
          <InputComponent
            label={t('labelIframeWalletConnectUri')}
            helper={t('helperIframeWalletConnectUri')}
            placeholder="uri"
            isRequired={false}
            value={walletConnectUri}
            onChange={e => setWalletConnectUri(e.target.value)}
            disabled={!isAddress(address || '') || connecting}
            testId="iframe.walletConnectUri"
          />
        </Box>
      )}
      <Box overflowY="auto">
        {iframeConnecting && <InfoBoxLoader />}
        <Box
          as="iframe"
          ref={iframeRef}
          hidden={iframeConnecting}
          src={appUrl}
          height="80vh"
          width="full"
          p={2}
          allow="clipboard-write"
        />
      </Box>
    </Box>
  );
}

export function SafeProposalDappDetailModal({
  appUrl,
  onClose,
}: {
  appUrl: string;
  onClose: () => void;
}) {
  const { chain } = useNetworkConfigStore();
  const { loadABI } = useABI();
  const { safe } = useDaoInfoStore();
  const { dapps } = useSupportedDapps(chain.id);

  const safeAddress = safe?.address;
  const dapp = dapps.find(d => d.url === appUrl);
  const appName = dapp?.name || appUrl;

  const [decodedTransactions, setDecodedTransactions] = useState<CreateProposalTransaction[]>([]);
  const openConfirmTransactionModal = useDecentModal(ModalType.CONFIRM_TRANSACTION, {
    appName,
    transactionArray: decodedTransactions,
  });

  useEffect(() => {
    if (decodedTransactions.length > 0) {
      openConfirmTransactionModal();
      setDecodedTransactions([]);
    }
  }, [decodedTransactions, openConfirmTransactionModal]);

  if (!safeAddress) {
    return null;
  }
  if (!appUrl) {
    return <LoadingProblem type="badQueryParamAppUrl" />;
  }

  return (
    <div>
      <Flex
        justifyContent="space-between"
        gap="6rem"
      >
        <Text
          textStyle="heading-large"
          color="white-0"
        >
          {appName}
        </Text>

        <CloseButton onClick={onClose} />
      </Flex>

      <SafeInjectProvider
        defaultAddress={safeAddress}
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
        <Iframe
          appUrl={appUrl || ''}
          enableWalletConnect={!!dapp?.enableWalletConnect}
        />
      </SafeInjectProvider>
    </div>
  );
}
