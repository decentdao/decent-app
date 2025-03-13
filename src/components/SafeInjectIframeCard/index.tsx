import { Text, Icon, Button, Box, Input, Flex } from '@chakra-ui/react';
import { CheckCircle } from '@phosphor-icons/react';
import { t } from 'i18next';
import { useState } from 'react';
import { isAddress } from 'viem';
import { useDebounce } from '../../hooks/utils/useDebounce';
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
    <div>
      <Text
        as="label"
        display="block"
        fontSize="sm"
        fontWeight="medium"
        color="gray.700"
      >
        {'Load with other dApp'}
      </Text>
      <Text
        fontSize="xs"
        color="gray.500"
      >
        {
          'You can visit any dApps that supports Safe, interact with interface and get transaction you need to sign here.'
        }
      </Text>
      <Flex
        mt={1}
        flexDirection={{ base: 'column', md: 'row' }}
        gap={2}
      >
        <Input
          type="text"
          height="10"
          borderRadius="md"
          borderColor="gray.300"
          boxShadow="sm"
          _focus={{
            borderColor: 'indigo.500',
            ringColor: 'indigo.500',
          }}
          size="sm"
          width={{ base: 'full', md: '2/3' }}
          value={urlInput}
          onChange={e => setUrlInput(e.target.value)}
          isDisabled={!isAddress(address || '')}
          placeholder={
            isAddress(address || '')
              ? 'Input app url you want to load'
              : 'No project owner address founded'
          }
        />

        <Box width={{ base: 'full', md: '1/3' }}>
          <DropdownMenu<{}>
            items={dropdownItems}
            selectedItem={dropdownItems.find(item => item.selected)}
            onSelect={item => {
              const index = dropdownItems.findIndex(i => i.value === item.value);
              setSelectedItemIndex(index);
              setUrlInput(item.value);
            }}
            title={t('titleAssets', { ns: 'treasury' })}
            isDisabled={!isAddress(address || '')}
            selectPlaceholder={t('selectLabel', { ns: 'modals' })}
            emptyMessage={t('emptyRolesAssets', { ns: 'roles' })}
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
      </Flex>

      <Text
        mt={3}
        fontSize="xs"
        color="gray.500"
      >
        {"For dApps that doesn't support Safe, you can use WalletConnect to connect."}
      </Text>

      <Flex
        flexDirection={{ base: 'column', md: 'row' }}
        gap={2}
      >
        <Input
          type="text"
          height="10"
          borderRadius="md"
          borderColor="gray.300"
          boxShadow="sm"
          _focus={{
            borderColor: 'indigo.500',
            ringColor: 'indigo.500',
          }}
          size="sm"
          width={{ base: 'full', md: '2/3' }}
          value={walletConnectUri}
          onChange={e => setWalletConnectUri(e.target.value)}
          isDisabled={!isAddress(address || '')}
          placeholder={
            isAddress(address || '')
              ? 'Select WalletConnect method and copy URI here to connect'
              : 'No project owner address founded'
          }
        />

        <Flex
          justifyContent="flex-end"
          width={{ base: 'full', md: '1/3' }}
        >
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
            {t('confirm')}
          </Button>
        </Flex>
      </Flex>

      {appUrl && (
        <Box
          mt={2}
          overflowY="auto"
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
    </div>
  );
}
