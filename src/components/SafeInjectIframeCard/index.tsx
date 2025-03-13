import { Text, Icon, Button, Box, VStack } from '@chakra-ui/react';
import { CheckCircle } from '@phosphor-icons/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { isAddress } from 'viem';
import { useDebounce } from '../../hooks/utils/useDebounce';
import { InputComponent } from '../ui/forms/InputComponent';
import { DropdownMenu } from '../ui/menus/DropdownMenu';
import { useSafeInject } from './context/SafeInjectedContext';
import useWalletConnect from './hooks/WalletConnect';

const BUILDIN_APPS = [
  {
    value: 'https://swap.cow.fi/',
    label: 'CoW Swap',
  },
  {
    value: 'https://app.uniswap.org',
    label: 'Uniswap',
  },
  // Violate CSP, can't access sablier with iframe way
  // { value: 'https://app.sablier.com/', label: 'Sablier' },
  {
    value: 'https://jokerace.xyz',
    label: 'Jokerace',
  },
];

/**
 * @example wrap this component with SafeInjectProvider to provide address and chainId
 */
export default function SafeInjectIframeCard() {
  const { t } = useTranslation(['proposalTemplate', 'common']);
  const { appUrl, iframeRef, address, setAppUrl, setLatestTransactions } = useSafeInject();
  const [urlInput, setUrlInput] = useState<string>('');
  const [walletConnectUri, setWalletConnectUri] = useState<string>('');
  const [selectedItemIndex, setSelectedItemIndex] = useState<number>(0);

  const { connect, disconnect, isConnected, loading } = useWalletConnect({
    uri: walletConnectUri,
    address: address || '',
    setLatestTransactions,
  });

  useDebounce<string | undefined>(urlInput, 500, (k: string | undefined) => {
    if (k !== appUrl) {
      setAppUrl(k);
    }
  });

  const dropdownItems = [
    {
      value: '',
      label: '-- Select dApp --',
      selected: selectedItemIndex === 0,
    },
    ...BUILDIN_APPS.map((item, index) => {
      return { ...item, selected: selectedItemIndex === index + 1 };
    }),
  ];

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
          subLabel={
            <Box height="auto">
              <DropdownMenu<{}>
                items={dropdownItems}
                selectedItem={dropdownItems.find(item => item.selected)}
                onSelect={item => {
                  const index = dropdownItems.findIndex(i => i.value === item.value);
                  setSelectedItemIndex(index);
                  setUrlInput(item.value);
                }}
                title={t('titleIframeDappsDropdown')}
                isDisabled={!isAddress(address || '')}
                renderItem={(item, isSelected) => {
                  return (
                    <>
                      <Text
                        textStyle="labels-large"
                        color="white-0"
                      >
                        {item.label}
                      </Text>
                      {isSelected && (
                        <Icon
                          as={CheckCircle}
                          boxSize="1.5rem"
                          color="lilac-0"
                        />
                      )}
                    </>
                  );
                }}
              />
            </Box>
          }
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
                isDisabled={false}
                onClick={() => {
                  if (isConnected) {
                    disconnect();
                    setWalletConnectUri('');
                  } else {
                    connect();
                  }
                }}
              >
                {isConnected ? t('buttonDisconnectWalletConnect') : t('buttonConnectWalletConnect')}
              </Button>
            </Box>
          }
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
