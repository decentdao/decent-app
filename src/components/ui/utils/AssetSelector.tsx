import { Button, Flex, Icon, Image, MenuButton, Text } from '@chakra-ui/react';
import { CaretDown, CheckCircle } from '@phosphor-icons/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useBalance } from 'wagmi';
import { useCurrentDAOKey } from '../../../hooks/DAO/useCurrentDAOKey';
import { useDAOStore } from '../../../providers/App/AppProvider';
import { useNetworkConfigStore } from '../../../providers/NetworkConfig/useNetworkConfigStore';
import { formatCoin, formatUSD } from '../../../utils';
import { DropdownMenu } from '../menus/DropdownMenu';

interface AssetSelectorProps {
  disabled?: boolean;
  includeNativeToken?: boolean;
  onlyNativeToken?: boolean;
  onSelect?: (addresses: string[]) => void;
  canSelectMultiple?: boolean;
  /**
   * Can't unselected these pre-selected assets
   */
  lockedSelections?: string[];
}

export const NATIVE_TOKEN_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

export function AssetSelector({
  disabled,
  includeNativeToken,
  onlyNativeToken,
  onSelect,
  canSelectMultiple = false,
  lockedSelections = [],
}: AssetSelectorProps) {
  const { t } = useTranslation(['roles', 'treasury', 'modals']);

  const { getConfigByChainId, chain } = useNetworkConfigStore();
  const networkConfig = getConfigByChainId(chain.id);
  const { daoKey } = useCurrentDAOKey();
  const {
    treasury: { assetsFungible },
    node: { safe },
  } = useDAOStore({ daoKey });

  const { data: nativeTokenBalance } = useBalance({
    address: safe?.address,
  });

  const [selectedAddresses, setSelectedAddresses] = useState<string[]>(
    lockedSelections || (onlyNativeToken ? [NATIVE_TOKEN_ADDRESS] : []),
  );

  const nonNativeFungibleAssets = assetsFungible.filter(
    asset => parseFloat(asset.balance) > 0 && !asset.nativeToken,
  );

  const nativeTokenItem = {
    value: NATIVE_TOKEN_ADDRESS,
    label: nativeTokenBalance?.symbol ?? 'Native Token',
    icon: networkConfig.nativeTokenIcon,
    selected: selectedAddresses.includes(NATIVE_TOKEN_ADDRESS),
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
        ...nonNativeFungibleAssets.map(asset => ({
          value: asset.tokenAddress,
          label: asset.symbol,
          icon: asset.logo ?? asset.thumbnail ?? '/images/coin-icon-default.svg',
          selected: selectedAddresses.includes(asset.tokenAddress),
          assetData: {
            name: asset.name,
            balance: asset.balance,
            decimals: asset.decimals,
            usdValue: asset.usdValue,
            symbol: asset.symbol,
          },
        })),
      ];
  const selectedItems = dropdownItems.filter(i => i.selected);

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
      selectedItem={selectedItems[0]}
      onSelect={item => {
        if (canSelectMultiple) {
          if (!selectedAddresses.includes(item.value)) {
            const newSelection = [...selectedAddresses, item.value];
            setSelectedAddresses(newSelection);
            onSelect?.(newSelection);
          } else {
            if (lockedSelections.includes(item.value)) {
              return;
            }

            const newSelection = selectedAddresses.filter(address => address !== item.value);
            setSelectedAddresses(newSelection);
            onSelect?.(newSelection);
          }
        } else {
          setSelectedAddresses([item.value]);
          onSelect?.([item.value]);
        }
      }}
      title={t('titleAssets', { ns: 'treasury' })}
      isDisabled={disabled}
      selectPlaceholder={t('selectLabel', { ns: 'modals' })}
      emptyMessage={t('emptyRolesAssets', { ns: 'roles' })}
      closeOnSelect={!canSelectMultiple}
      renderButton={
        canSelectMultiple && selectedItems.length > 1
          ? () => (
              <MenuButton
                as={Button}
                variant="unstyled"
                bgColor="transparent"
                isDisabled={disabled}
                cursor={disabled ? 'not-allowed' : 'pointer'}
                p={0}
                sx={{
                  '&:disabled': {
                    '.payment-menu-asset *': {
                      color: 'color-neutral-400',
                      bg: 'transparent',
                    },
                  },
                }}
              >
                <Flex
                  gap={2}
                  alignItems="center"
                  border="1px solid"
                  borderColor="color-neutral-800"
                  borderRadius="9999px"
                  w={`${(selectedItems.length - 1) * 0.7 + 6}rem`}
                  className="payment-menu-asset"
                  p="0.5rem"
                >
                  <Flex
                    position="relative"
                    minW="2rem"
                    alignItems="center"
                  >
                    {selectedItems.map((item, idx) => (
                      <Image
                        key={item.value}
                        src={item.icon}
                        fallbackSrc="/images/coin-icon-default.svg"
                        boxSize="1.5rem"
                        border="2px solid white"
                        borderRadius="full"
                        position="absolute"
                        left={`${idx * 0.8}rem`}
                        zIndex={selectedItems.length - idx}
                      />
                    ))}
                  </Flex>
                  <Flex
                    alignItems="center"
                    ml={`${selectedItems.length * 0.8}rem`}
                  >
                    <Icon
                      color="color-neutral-400"
                      as={CaretDown}
                      boxSize="1.5rem"
                    />
                  </Flex>
                </Flex>
              </MenuButton>
            )
          : undefined
      }
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
                  textStyle="text-sm-medium"
                  color="color-white"
                >
                  {item.label}
                </Text>
                <Flex
                  alignItems="center"
                  gap={2}
                >
                  <Text
                    textStyle="text-lg-regular"
                    color="color-neutral-300"
                  >
                    {balanceText}
                  </Text>
                  {usdValue && (
                    <>
                      <Text
                        textStyle="text-lg-regular"
                        color="color-neutral-300"
                      >
                        {'•'}
                      </Text>
                      <Text
                        textStyle="text-lg-regular"
                        color="color-neutral-300"
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
                color="color-lilac-100"
              />
            )}
          </>
        );
      }}
    />
  );
}
