import { Text, InputProps, Flex, Icon } from '@chakra-ui/react';
import { SealWarning } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Address, isAddress, erc20Abi } from 'viem';
import useNetworkPublicClient from '../../../hooks/useNetworkPublicClient';
import { createAccountSubstring } from '../../../hooks/utils/useGetAccountName';
import { DecentTooltip } from '../DecentTooltip';
import { AddressInput } from './EthAddressInput';

interface TokenInfo {
  name: string;
  symbol: string;
  decimals: number;
}

export function TokenAddressInput(
  props: InputProps & { displayValue?: string; onTokenInfo?: (info: TokenInfo | null) => void },
) {
  const { t } = useTranslation('common');
  const publicClient = useNetworkPublicClient();

  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [showInput, setShowInput] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const propValue = props.value;
  const isPropValueAddress =
    propValue !== '' && !!propValue && typeof propValue === 'string' && isAddress(propValue);

  useEffect(() => {
    if (!propValue || !isPropValueAddress) {
      setTokenInfo(null);
      props.onTokenInfo?.(null);
      return;
    }

    const fetchTokenInfo = async () => {
      setIsLoading(true);
      try {
        const contractAddress = propValue as Address;

        // Use multicall for efficient batch calls
        const multicallCalls = [
          {
            address: contractAddress,
            abi: erc20Abi,
            functionName: 'name',
          },
          {
            address: contractAddress,
            abi: erc20Abi,
            functionName: 'symbol',
          },
          {
            address: contractAddress,
            abi: erc20Abi,
            functionName: 'decimals',
          },
        ];

        const results = await publicClient.multicall({
          contracts: multicallCalls,
          allowFailure: true,
        });

        const [nameResult, symbolResult, decimalsResult] = results;

        // All three functions must succeed for a valid ERC20 token
        if (nameResult.error || symbolResult.error || decimalsResult.error) {
          console.log('Contract missing required ERC20 functions');
          setTokenInfo(null);
          props.onTokenInfo?.(null);
          return;
        }

        const info: TokenInfo = {
          name: nameResult.result as string,
          symbol: symbolResult.result as string,
          decimals: decimalsResult.result as number,
        };

        setTokenInfo(info);
        props.onTokenInfo?.(info);
      } catch (error) {
        console.error('Failed to fetch token info:', error);
        setTokenInfo(null);
        props.onTokenInfo?.(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTokenInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPropValueAddress, propValue, publicClient, props.onTokenInfo]);

  if ((!showInput && propValue) || props.isReadOnly) {
    let displayedValue = propValue;

    if (tokenInfo) {
      displayedValue = `${tokenInfo.name} (${tokenInfo.symbol})`;
    } else if (isPropValueAddress) {
      displayedValue = createAccountSubstring(propValue);
    }

    return (
      <Flex
        alignItems="center"
        justifyContent="space-between"
        w="full"
        minH="36px"
        px="12px"
        py="6px"
        bg="color-neutral-900"
        border="1px solid"
        borderColor="color-neutral-800"
        borderRadius="8px"
        cursor={props.isReadOnly ? 'default' : 'pointer'}
        onClick={() => {
          if (!props.isReadOnly) {
            setShowInput(true);
          }
        }}
        onBlur={() => {
          setShowInput(false);
        }}
        _hover={{
          borderColor: props.isReadOnly
            ? 'color-neutral-800'
            : props.isInvalid
              ? 'color-error-400'
              : 'color-neutral-700',
        }}
        _focus={{
          borderColor: props.isInvalid ? 'color-error-400' : 'color-primary-500',
          boxShadow: 'none',
        }}
      >
        <Text
          textStyle="text-sm-regular"
          color={props.isInvalid ? 'color-error-400' : 'color-layout-foreground'}
          overflow="hidden"
          textOverflow="ellipsis"
          whiteSpace="nowrap"
          flex={1}
        >
          {props.displayValue ?? (isLoading ? 'Loading...' : displayedValue)}
        </Text>
        {tokenInfo && (
          <DecentTooltip label={t('tokenInfoTooltip', 'Token contract verified')}>
            <Icon
              as={SealWarning}
              boxSize="1rem"
              ml={2}
            />
          </DecentTooltip>
        )}
      </Flex>
    );
  }

  return (
    <AddressInput
      {...props}
      onBlur={() => {
        // delay to allow the input's debounce to finish
        setTimeout(() => {
          setShowInput(false);
        }, 200);
      }}
      autoFocus
    />
  );
}
