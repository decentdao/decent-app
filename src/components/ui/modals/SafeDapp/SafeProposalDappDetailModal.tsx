import * as amplitude from '@amplitude/analytics-browser';
import { Box, CloseButton, Flex, Text } from '@chakra-ui/react';
import { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { isAddress } from 'viem';
import { DAO_ROUTES } from '../../../../constants/routes';
import { decodeTransactionsWithABI } from '../../../../helpers/transactionDecoder';
import { useSupportedDapps } from '../../../../hooks/DAO/loaders/useSupportedDapps';
import { useCurrentDAOKey } from '../../../../hooks/DAO/useCurrentDAOKey';
import { useABI } from '../../../../hooks/utils/useABI';
import { useDebounce } from '../../../../hooks/utils/useDebounce';
import { analyticsEvents } from '../../../../insights/analyticsEvents';
import { useDAOStore } from '../../../../providers/App/AppProvider';
import { useNetworkConfigStore } from '../../../../providers/NetworkConfig/useNetworkConfigStore';
import { useProposalActionsStore } from '../../../../store/actions/useProposalActionsStore';
import { CreateProposalActionData, ProposalActionType } from '../../../../types';
import { SafeInjectContext } from '../../../SafeInjectIframe/context/SafeInjectContext';
import { SafeInjectProvider } from '../../../SafeInjectIframe/context/SafeInjectProvider';
import useWalletConnect from '../../../SafeInjectIframe/hooks/useWalletConnect';
import { InputComponent } from '../../forms/InputComponent';
import { InfoBoxLoader } from '../../loaders/InfoBoxLoader';

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
  useEffect(() => {
    amplitude.track(analyticsEvents.SafeProposalDappDetailModalOpened);
  }, []);

  const { t } = useTranslation(['proposalDapps']);
  const { chain, addressPrefix } = useNetworkConfigStore();
  const { loadABI } = useABI();
  const { daoKey } = useCurrentDAOKey();
  const {
    node: { safe },
  } = useDAOStore({ daoKey });
  const { dapps } = useSupportedDapps(chain.id);
  const { addAction, resetActions } = useProposalActionsStore();
  const navigate = useNavigate();

  const [customAppUrl, setCustomAppUrl] = useState('https://app.decentdao.org');
  const finalAppUrl = appUrl || customAppUrl;

  const safeAddress = safe?.address;
  const dapp = dapps.find(d => d.url === finalAppUrl);
  const appName = dapp?.name || finalAppUrl;
  const dappLabel = t('dappIntegrationActionLabel', { appName });

  return (
    <Box>
      <Flex
        justifyContent="space-between"
        gap="6rem"
        mb="0.5rem"
      >
        <Text
          textStyle="heading-medium"
          color="white-0"
        >
          {appName}
        </Text>

        <CloseButton onClick={onClose} />
      </Flex>

      {!appUrl && (
        <Box mt="2rem">
          <InputComponent
            label="Custom dApp Url"
            helper="Enter url of any dApp you want to load, then click Custom dApp card to open the modal."
            value={customAppUrl}
            onChange={e => setCustomAppUrl(e.target.value)}
            isRequired={false}
            testId={'customDappUrlInput'}
          />
        </Box>
      )}

      <SafeInjectProvider
        defaultAddress={safeAddress}
        defaultAppUrl={finalAppUrl}
        chainId={chain.id}
        onTransactionsReceived={async transactions => {
          const id = toast.promise(
            async () => {
              if (!safe?.address) {
                throw new Error('Safe address not found');
              }

              if (transactions && transactions.length > 0) {
                const { decodedTransactions, failedTransactions } = await decodeTransactionsWithABI(
                  transactions,
                  loadABI,
                );
                if (failedTransactions.length > 0) {
                  throw new Error('Failed to decode transactions');
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
                return true;
              }
            },
            {
              loading: t('processingTransactions'),
              success: t('successProcessingTransactions'),
              error: t('errorProcessingTransactions'),
            },
          );

          // Return wrapped promise
          // https://github.com/emilkowalski/sonner/pull/462
          return (id as any).unwrap();
        }}
      >
        <Iframe
          appUrl={finalAppUrl || ''}
          enableWalletConnect={!!dapp?.enableWalletConnect}
        />
      </SafeInjectProvider>
    </Box>
  );
}
