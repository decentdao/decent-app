import { Text, InputProps, Flex, Icon } from '@chakra-ui/react';
import { SealWarning } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Address, isAddress, erc721Abi } from 'viem';
import { erc1155Abi } from '../../../assets/abi/erc1155Abi';
import useNetworkPublicClient from '../../../hooks/useNetworkPublicClient';
import { createAccountSubstring } from '../../../hooks/utils/useGetAccountName';
import { DecentTooltip } from '../DecentTooltip';
import { AddressInput } from './EthAddressInput';

interface NFTInfo {
  name: string;
  symbol: string;
  standard: 'ERC721' | 'ERC1155';
}

export function NFTAddressInput(
  props: InputProps & { displayValue?: string; onNFTInfo?: (info: NFTInfo | null) => void },
) {
  const { onNFTInfo, ...inputProps } = props;
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
      onNFTInfo?.(null);
      setIsLoading(false);
      return;
    }

    // Debounce the API call to prevent continuous loading
    const timeoutId = setTimeout(() => {
      const fetchNFTInfo = async () => {
        setIsLoading(true);
        try {
          const contractAddress = propValue as Address;

          // Test for both ERC721 and ERC1155 functions
          const multicallCalls = [
            // ERC721 functions
            {
              address: contractAddress,
              abi: erc721Abi,
              functionName: 'name',
            },
            {
              address: contractAddress,
              abi: erc721Abi,
              functionName: 'symbol',
            },
            {
              address: contractAddress,
              abi: erc721Abi,
              functionName: 'ownerOf',
              args: [BigInt(1)],
            },
            {
              address: contractAddress,
              abi: erc721Abi,
              functionName: 'tokenURI',
              args: [BigInt(1)],
            },
            // ERC1155 functions
            {
              address: contractAddress,
              abi: erc1155Abi,
              functionName: 'balanceOf',
              args: [contractAddress, BigInt(1)], // Use contract address as dummy account
            },
            {
              address: contractAddress,
              abi: erc1155Abi,
              functionName: 'uri',
              args: [BigInt(1)],
            },
          ];

          const results = await publicClient.multicall({
            contracts: multicallCalls,
            allowFailure: true,
          });

          const [
            nameResult,
            symbolResult,
            ownerOfResult,
            tokenURIResult,
            balanceOfResult,
            uriResult,
          ] = results;

          // Check if it has ERC721 functions
          const hasERC721Functions = !ownerOfResult.error || !tokenURIResult.error;

          // Check if it has ERC1155 functions
          const hasERC1155Functions = !balanceOfResult.error || !uriResult.error;

          // Must have either ERC721 or ERC1155 functions to be considered an NFT
          if (!hasERC721Functions && !hasERC1155Functions) {
            console.log('Contract does not have NFT-specific functions');
            setNFTInfo(null);
            onNFTInfo?.(null);
            return;
          }

          // Determine the standard
          const standard: 'ERC721' | 'ERC1155' = hasERC721Functions ? 'ERC721' : 'ERC1155';

          // Name and symbol can be blank for NFTs, so provide fallbacks
          const name =
            !nameResult.error && nameResult.result ? (nameResult.result as string) : 'Unknown NFT';
          const symbol =
            !symbolResult.error && symbolResult.result ? (symbolResult.result as string) : 'NFT';

          const info: NFTInfo = {
            name,
            symbol,
            standard,
          };

          setNFTInfo(info);
          onNFTInfo?.(info);
        } catch (error) {
          console.error('Failed to fetch NFT info:', error);
          setNFTInfo(null);
          onNFTInfo?.(null);
        } finally {
          setIsLoading(false);
        }
      };

      fetchNFTInfo();
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPropValueAddress, propValue, publicClient]);

  if ((!showInput && propValue) || inputProps.isReadOnly) {
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
        cursor={inputProps.isReadOnly ? 'default' : 'pointer'}
        onClick={() => {
          if (!inputProps.isReadOnly) {
            setShowInput(true);
          }
        }}
        onBlur={() => {
          setShowInput(false);
        }}
        _hover={{
          borderColor: inputProps.isReadOnly
            ? 'color-neutral-800'
            : inputProps.isInvalid
              ? 'color-error-400'
              : 'color-neutral-700',
        }}
        _focus={{
          borderColor: inputProps.isInvalid ? 'color-error-400' : 'color-primary-500',
          boxShadow: 'none',
        }}
      >
        <Text
          textStyle="text-sm-regular"
          color={inputProps.isInvalid ? 'color-error-400' : 'color-layout-foreground'}
          overflow="hidden"
          textOverflow="ellipsis"
          whiteSpace="nowrap"
          flex={1}
        >
          {inputProps.displayValue ?? (isLoading ? 'Loading...' : displayedValue)}
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
      {...inputProps}
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
