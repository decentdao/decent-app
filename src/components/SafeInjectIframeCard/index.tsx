import { Text, Icon, Button } from '@chakra-ui/react';
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
    value: 'https://juicebox.money',
    label: 'Juicebox',
  },
  {
    value: 'https://app.uniswap.org',
    label: 'Uniswap',
  },
  {
    value: 'https://stake.lido.fi',
    label: 'Lido Finance',
  },
  {
    value: 'https://jokerace.xyz',
    label: 'Jokerace',
  },
];

export default function SafeInjectIframeCard() {
  const { appUrl, iframeRef, address, setAppUrl, setLatestTransaction } = useSafeInject();
  const [urlInput, setUrlInput] = useState<string>('');
  const [walletConnectUri, setWalletConnectUri] = useState<string>('');
  const [selectedItemIndex, setSelectedItemIndex] = useState<number>(0);

  const { connect, disconnect, isConnected, loading } = useWalletConnect({
    uri: walletConnectUri,
    address: address || '',
    setLatestTransaction,
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
      <label className="block text-sm font-medium text-gray-700">{'Load with other dApp'}</label>
      <p className="text-xs text-gray-500">
        {
          'You can visit any dApps that supports Safe, interact with interface and get transaction you need to sign here.'
        }
      </p>
      <div className="mt-1 flex flex-col gap-2 md:flex-row">
        <input
          type="text"
          className="block h-10 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm md:w-2/3"
          value={urlInput}
          onChange={e => setUrlInput(e.target.value)}
          disabled={!isAddress(address || '')}
          placeholder={
            isAddress(address || '')
              ? 'Input app url you want to load'
              : 'No project owner address founded'
          }
        />

        <div className="md:1/3">
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
        </div>
      </div>

      <p className="mt-3 text-xs text-gray-500">
        {"For dApps that doesn't support Safe, you can use WalletConnect to connect."}
      </p>

      <div className="flex flex-col gap-2 md:flex-row">
        <input
          type="text"
          className="block h-10 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm md:w-2/3"
          value={walletConnectUri}
          onChange={e => setWalletConnectUri(e.target.value)}
          disabled={!isAddress(address || '')}
          placeholder={
            isAddress(address || '')
              ? 'Select WalletConnect method and copy URI here to connect'
              : 'No project owner address founded'
          }
        />

        <div className="flex content-end md:w-1/3">
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
        </div>
      </div>

      {appUrl && (
        <div className="mt-2 overflow-y-auto">
          <iframe
            ref={iframeRef}
            src={appUrl}
            className="h-[60vh] w-full p-2"
            // to support copy to clipboard programmatically inside iframe
            allow="clipboard-write"
          />
        </div>
      )}
    </div>
  );
}
