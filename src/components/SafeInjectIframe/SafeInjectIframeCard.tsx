import { Box, Button, VStack } from '@chakra-ui/react';
import { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { isAddress } from 'viem';
import { useDebounce } from '../../hooks/utils/useDebounce';
import { isValidUrl } from '../../utils/url';
import { InputComponent } from '../ui/forms/InputComponent';
import { SafeInjectContext } from './context/SafeInjectContext';
import useWalletConnect from './hooks/useWalletConnect';

/**
 * @example wrap this component with SafeInjectProvider to provide address and chainId
 */
export default function SafeInjectIframeCard() {
  const { t } = useTranslation(['proposalTemplate', 'common']);
  const { appUrl, lastAppUrlSupported, iframeRef, address, setAppUrl, setLatestTransactions } =
    useContext(SafeInjectContext);
  const [urlInput, setUrlInput] = useState<string>('https://swap.cow.fi');
  const [walletConnectUri, setWalletConnectUri] = useState<string>('');

  const { connect, disconnect, isConnected, sessionMetadata, connecting } = useWalletConnect({
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

  useEffect(() => {
    let checkSupportTimeout: NodeJS.Timeout;

    if (appUrl && isValidUrl(appUrl)) {
      // Doc: as a security precaution user agents do not fire the error event on <iframe>s,
      // and the load event is always triggered even if the <iframe> content fails to load.
      //  check https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#error_and_load_event_behavior

      // Impl: so we need to check if the site is supported by the iframe
      //   by giving a timeout to check if the site response in time
      checkSupportTimeout = setTimeout(() => {
        if (lastAppUrlSupported !== appUrl && sessionMetadata?.url !== appUrl) {
          toast(t('toastIframedAppNotSupported'), {
            action: {
              label: 'Open in new tab',
              onClick: () => {
                // open in new tab
                window.open(appUrl, '_blank');
              },
            },
            duration: Infinity,
          });
        }
      }, 3000);
    }

    return () => {
      if (checkSupportTimeout) {
        clearTimeout(checkSupportTimeout);
      }
    };
  }, [appUrl, lastAppUrlSupported, sessionMetadata?.url, setAppUrl, t]);

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

      {appUrl && (
        <Box overflowY="auto">
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
    </VStack>
  );
}
