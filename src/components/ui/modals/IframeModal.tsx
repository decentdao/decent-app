import { Box, VStack } from '@chakra-ui/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDebounce } from '../../../hooks/utils/useDebounce';
import { InputComponent } from '../forms/InputComponent';

export function IframeModal() {
  const [urlInput, setUrlInput] = useState<string>('https://swap.cow.fi/');
  const [walletConnectUri, setWalletConnectUri] = useState<string>('');
  const [appUrl, setAppUrl] = useState<string>('https://swap.cow.fi/');

  useDebounce<string>(urlInput, 500, (k: string) => {
    if (k !== appUrl) {
      setAppUrl(k);
    }
  });

  const { t } = useTranslation(['proposalTemplate']);

  return (
    <VStack
      align="left"
      px="1rem"
    >
      <Box>
        <InputComponent
          label={t('labelIframeUrlInput')}
          helper={t('helperIframUrlInput')}
          placeholder="url"
          isRequired={true}
          value={urlInput}
          onChange={e => setUrlInput(e.target.value)}
          testId="iframe.urlInput"
        />
      </Box>

      <Box
        mt="1rem"
        mb="1rem"
      >
        <InputComponent
          label={t('labelIframeWalletConnectUri')}
          helper={t('helperIframeWalletConnectUri')}
          placeholder="uri"
          isRequired={false}
          value={walletConnectUri}
          onChange={e => setWalletConnectUri(e.target.value)}
          testId="iframe.walletConnectUri"
        />
      </Box>

      {appUrl && (
        <Box overflowY="auto">
          <Box
            as="iframe"
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
