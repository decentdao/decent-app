import { Box, CloseButton, Flex, Text } from '@chakra-ui/react';
import { useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { isAddress } from 'viem';
import { DAO_ROUTES } from '../../../constants/routes';
import { decodeTransactionsWithABI } from '../../../helpers/transactionDecoder';
import { useSupportedDapps } from '../../../hooks/DAO/loaders/useSupportedDapps';
import { useABI } from '../../../hooks/utils/useABI';
import { useDebounce } from '../../../hooks/utils/useDebounce';
import { useNetworkConfigStore } from '../../../providers/NetworkConfig/useNetworkConfigStore';
import { useProposalActionsStore } from '../../../store/actions/useProposalActionsStore';
import { useDaoInfoStore } from '../../../store/daoInfo/useDaoInfoStore';
import { CreateProposalActionData, ProposalActionType } from '../../../types';
import { SafeInjectContext } from '../../SafeInjectIframe/context/SafeInjectContext';
import { SafeInjectProvider } from '../../SafeInjectIframe/context/SafeInjectProvider';
import useWalletConnect from '../../SafeInjectIframe/hooks/useWalletConnect';
import { InputComponent } from '../forms/InputComponent';
import { InfoBoxLoader } from '../loaders/InfoBoxLoader';

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
  const { t } = useTranslation(['common']);
  const { chain, addressPrefix } = useNetworkConfigStore();
  const { loadABI } = useABI();
  const { safe } = useDaoInfoStore();
  const { dapps } = useSupportedDapps(chain.id);
  const { addAction, resetActions } = useProposalActionsStore();
  const navigate = useNavigate();

  const safeAddress = safe?.address;
  const dapp = dapps.find(d => d.url === appUrl);
  const appName = dapp?.name || appUrl;
  const dappLabel = t('dappIntegration', { appName });

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
              const { decodedTransactions } = await decodeTransactionsWithABI(
                transactions,
                loadABI,
              );

              if (!safe?.address) {
                return;
              }

              const action: CreateProposalActionData = {
                actionType: ProposalActionType.DAPP_INTEGRATION,
                transactions: decodedTransactions,
              };
              resetActions();
              addAction({
                ...action,
                content: <Text>{dappLabel}</Text>,
              });
              onClose();
              navigate(DAO_ROUTES.proposalWithActionsNew.relative(addressPrefix, safe.address));
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
