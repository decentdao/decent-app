import { Flex, Image, Text, Icon } from '@chakra-ui/react';
import { CheckCircle } from '@phosphor-icons/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Address, getAddress } from 'viem';
import { useBalance } from 'wagmi';
import { useFractal } from '../../../providers/App/AppProvider';
import { useNetworkConfigStore } from '../../../providers/NetworkConfig/useNetworkConfigStore';
import { useDaoInfoStore } from '../../../store/daoInfo/useDaoInfoStore';
import { formatCoin, formatUSD } from '../../../utils';
import { DropdownMenu } from '../menus/DropdownMenu';

interface Asset {
  name: string;
  symbol: string;
  decimals: number;
  address: Address;
  logo: string;
}

interface AssetSelectorProps {
  disabled?: boolean;
  includeNativeToken?: boolean;
  onlyNativeToken?: boolean;
  onSelect?: (asset: Asset) => void;
}

export function AssetSelector({
  disabled,
  includeNativeToken,
  onlyNativeToken,
}: AssetSelectorProps) {
  const { t } = useTranslation(['roles', 'treasury', 'modals']);
  const { safe } = useDaoInfoStore();

  const { data: nativeTokenBalance } = useBalance({
    address: safe?.address,
  });

  const { getConfigByChainId, chain } = useNetworkConfigStore();
  const networkConfig = getConfigByChainId(chain.id);

  const {
    treasury: { assetsFungible },
  } = useFractal();

  const [selectedAssetIndex, setSelectedAssetIndex] = useState<number | null>(
    onlyNativeToken ? 0 : null,
  );

  const nonNativeFungibleAssets = assetsFungible.filter(
    asset => parseFloat(asset.balance) > 0 && !asset.nativeToken,
  );

  const nativeTokenId = '0x0000000000000000000000000000000000000000';
  const nativeTokenItem = {
    value: nativeTokenId,
    label: nativeTokenBalance?.symbol ?? 'Native Token',
    icon: networkConfig.nativeTokenIcon,
    selected: selectedAssetIndex === 0,
    assetData: {
      name: nativeTokenBalance?.symbol ?? 'Native Token',
      balance: nativeTokenBalance?.value.toString() ?? '0',
      decimals: nativeTokenBalance?.decimals ?? 18,
      symbol: nativeTokenBalance?.symbol ?? 'Native Token',
    },
  };

  const dropdownItems = onlyNativeToken
    ? [nativeTokenItem]
    : [
        ...(includeNativeToken ? [nativeTokenItem] : []),
        ...nonNativeFungibleAssets.map((asset, index) => ({
          value: asset.tokenAddress,
          label: asset.symbol,
          icon: asset.logo ?? asset.thumbnail ?? '/images/coin-icon-default.svg',
          selected: selectedAssetIndex === index + 1,
          assetData: {
            name: asset.name,
            balance: asset.balance,
            decimals: asset.decimals,
            usdValue: asset.usdValue,
            symbol: asset.symbol,
          },
        })),
      ];

  return (
    <DropdownMenu<{
      assetData: {
        name: string;
        symbol: string;
        decimals: number;
        balance: string;
        usdValue?: number;
      };
    }>
      items={dropdownItems}
      selectedItem={dropdownItems.find(item => item.selected)}
      onSelect={item => {
        if (item.value === nativeTokenId) {
          setSelectedAssetIndex(0);
        } else {
          const index = nonNativeFungibleAssets.findIndex(
            asset => asset.tokenAddress === getAddress(item.value),
          );
          setSelectedAssetIndex(index >= 0 ? index + 1 : null);
        }
      }}
      title={t('titleAssets', { ns: 'treasury' })}
      isDisabled={disabled}
      selectPlaceholder={t('selectLabel', { ns: 'modals' })}
      emptyMessage={t('emptyRolesAssets', { ns: 'roles' })}
      renderItem={(item, isSelected) => {
        const { balance, decimals, usdValue, symbol } = item.assetData;
        const balanceText = formatCoin(balance, true, decimals, symbol, true);

        return (
          <>
            <Flex
              alignItems="center"
              gap="1rem"
            >
              <Image
                src={item.icon}
                fallbackSrc="/images/coin-icon-default.svg"
                boxSize="2rem"
              />
              <Flex flexDir="column">
                <Text
                  textStyle="labels-large"
                  color="white-0"
                >
                  {item.label}
                </Text>
                <Flex
                  alignItems="center"
                  gap={2}
                >
                  <Text
                    textStyle="body-large"
                    color="neutral-7"
                  >
                    {balanceText}
                  </Text>
                  {usdValue && (
                    <>
                      <Text
                        textStyle="body-large"
                        color="neutral-7"
                      >
                        {'•'}
                      </Text>
                      <Text
                        textStyle="body-large"
                        color="neutral-7"
                      >
                        {formatUSD(usdValue)}
                      </Text>
                    </>
                  )}
                </Flex>
              </Flex>
            </Flex>
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
  );
}
