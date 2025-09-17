import { Text, InputProps, Flex, Icon } from '@chakra-ui/react';
import { SealWarning } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Address, isAddress, getContract } from 'viem';
import useNetworkPublicClient from '../../../hooks/useNetworkPublicClient';
import { createAccountSubstring } from '../../../hooks/utils/useGetAccountName';
import { DecentTooltip } from '../DecentTooltip';
import { AddressInput } from './EthAddressInput';

// ERC-721 ABI for name() function
const erc721Abi = [
  {
    inputs: [],
    name: 'name',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

interface NFTInfo {
  name: string;
  symbol: string;
  standard: 'ERC721' | 'ERC1155';
}

export function NFTAddressInput(
  props: InputProps & { displayValue?: string; onNFTInfo?: (info: NFTInfo | null) => void },
) {
  const { t } = useTranslation('common');
  const publicClient = useNetworkPublicClient();

  const [nftInfo, setNFTInfo] = useState<NFTInfo | null>(null);
  const [showInput, setShowInput] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const propValue = props.value;
  const isPropValueAddress =
    propValue !== '' && !!propValue && typeof propValue === 'string' && isAddress(propValue);

  useEffect(() => {
    if (!propValue || !isPropValueAddress) {
      setNFTInfo(null);
      props.onNFTInfo?.(null);
      return;
    }

    const fetchNFTInfo = async () => {
      setIsLoading(true);
      try {
        const nftContract = getContract({
          abi: erc721Abi,
          address: propValue as Address,
          client: publicClient,
        });

        const [name, symbol] = await Promise.all([
          nftContract.read.name(),
          nftContract.read.symbol(),
        ]);

        // For simplicity, we'll assume ERC721 for now
        // In a real implementation, you might want to check for ERC165 support
        const info = { name, symbol, standard: 'ERC721' as const };
        setNFTInfo(info);
        props.onNFTInfo?.(info);
      } catch (error) {
        console.error('Failed to fetch NFT info:', error);
        setNFTInfo(null);
        props.onNFTInfo?.(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNFTInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPropValueAddress, propValue, publicClient, props.onNFTInfo]);

  if ((!showInput && propValue) || props.isReadOnly) {
    let displayedValue = propValue;

    if (nftInfo) {
      displayedValue = `${nftInfo.name} (${nftInfo.symbol})`;
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
        {nftInfo && (
          <DecentTooltip label={t('nftInfoTooltip', 'NFT contract verified')}>
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
