import { Box, Button, VStack, Text } from '@chakra-ui/react';
import { useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { isAddress } from 'viem';
import { useDebounce } from '../../hooks/utils/useDebounce';
import { InputComponent } from '../ui/forms/InputComponent';
import { SafeInjectContext } from './context/SafeInjectContext';
import useWalletConnect from './hooks/useWalletConnect';

/**
 * @example wrap this component with SafeInjectProvider to provide address and chainId
 */
export default function SafeInjectIframeCard() {
  const { t } = useTranslation(['proposalTemplate']);
  const {
    appUrl,
    connecting: iframeConnecting,
    connectedAppUrl,
    iframeRef,
    address,
    setAppUrl,
    setLatestTransactions,
  } = useContext(SafeInjectContext);
  const appNotSupported = !!appUrl && !iframeConnecting && connectedAppUrl !== appUrl;
  const [urlInput, setUrlInput] = useState<string>('https://swap.cow.fi');
  const [walletConnectUri, setWalletConnectUri] = useState<string>('');

  const { connect, disconnect, isConnected, connecting } = useWalletConnect({
    uri: walletConnectUri,
    address: address || '',
    setLatestTransactions,
    setUrlInput,
  });

  useDebounce<string | undefined>(urlInput, 500, (k: string | undefined) => {
    if (k !== appUrl) {
      setAppUrl(k);
    }
  });

  return (
    <VStack
      align="left"
      px="1.5rem"
      mt={6}
    >
      <Box>
        <InputComponent
          label={t('labelIframeUrlInput')}
          helper={t('helperIframUrlInput')}
          placeholder="url"
          isRequired={true}
          value={urlInput}
          onChange={e => setUrlInput(e.target.value)}
          disabled={!isAddress(address || '')}
          testId="iframe.urlInput"
        />
      </Box>

      {appNotSupported && (
        <Box
          mt="2rem"
          mb="2rem"
        >
          <InputComponent
            label={t('labelIframeWalletConnectUri')}
            helper={t('helperIframeWalletConnectUri')}
            placeholder="uri"
            isRequired={false}
            value={walletConnectUri}
            onChange={e => setWalletConnectUri(e.target.value)}
            disabled={!isAddress(address || '')}
            subLabel={
              <Box height="auto">
                <Button
                  px="2rem"
                  isDisabled={connecting}
                  onClick={() => {
                    if (isConnected) {
                      disconnect();
                      setWalletConnectUri('');
                    } else {
                      connect();
                    }
                  }}
                >
                  {connecting
                    ? t('buttonConnectingWalletConnect')
                    : isConnected
                      ? t('buttonDisconnectWalletConnect')
                      : t('buttonConnectWalletConnect')}
                </Button>
              </Box>
            }
            testId="iframe.walletConnectUri"
          />
        </Box>
      )}

      {appUrl && (
        <Box
          overflowY="auto"
          hidden={appNotSupported}
          mb="2rem"
        >
          <Box
            as="iframe"
            ref={iframeRef}
            src={appUrl}
            height="60vh"
            width="full"
            p={2}
            allow="clipboard-write"
          />
        </Box>
      )}

      {appNotSupported && !isConnected && (
        <Box
          mt="2rem"
          mb="2rem"
        >
          <Text>{t('toastIframedAppNotSupported')}</Text>
          <Button
            mt="1rem"
            onClick={() => {
              window.open(appUrl, '_blank');
            }}
          >
            {t('toastIframedAppNotSupportedButtonLabel')}
          </Button>
        </Box>
      )}
    </VStack>
  );
}
