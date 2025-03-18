import { Box, VStack } from '@chakra-ui/react';
import { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { isAddress } from 'viem';
import { useDebounce } from '../../hooks/utils/useDebounce';
import { isValidUrl } from '../../utils/url';
import { InputComponent } from '../ui/forms/InputComponent';
import { SafeInjectContext } from './context/SafeInjectContext';

/**
 * @example wrap this component with SafeInjectProvider to provide address and chainId
 */
export default function SafeInjectIframeCard() {
  const { t } = useTranslation(['proposalTemplate', 'common']);
  const { appUrl, lastAppUrlSupported, iframeRef, address, setAppUrl } =
    useContext(SafeInjectContext);
  const [urlInput, setUrlInput] = useState<string>('');

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
        if (lastAppUrlSupported !== appUrl) {
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
  }, [appUrl, lastAppUrlSupported, setAppUrl, t]);

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

      {appUrl && (
        <Box overflowY="auto">
          <Box
            as="iframe"
            ref={iframeRef}
            src={appUrl}
            height="80vh"
            width="full"
            p={2}
            allow="clipboard-write"
          />
        </Box>
      )}
    </VStack>
  );
}
