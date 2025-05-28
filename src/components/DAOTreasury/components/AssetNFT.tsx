import { Box, Divider, Flex, HStack, Image, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { createAccountSubstring } from '../../../hooks/utils/useGetAccountName';
import { NFTBalance } from '../../../types';
import EtherscanLink from '../../ui/links/EtherscanLink';

export function NFTHeader() {
  const { t } = useTranslation('treasury');
  return (
    <Box
      marginBottom="1rem"
      minW="400px"
    >
      <Divider
        variant="white"
        marginTop="0.75rem"
        marginBottom="1.5rem"
      />
      <Text
        textStyle="text-xs-medium"
        color="color-neutral-300"
        px={{ base: '1rem', lg: '1.5rem' }}
      >
        {t('columnNFTs')}
      </Text>
    </Box>
  );
}

export function NFTRow({ asset, isLast }: { asset: NFTBalance; isLast: boolean }) {
  const image = asset.metadata
    ? asset.metadata.imageUrl || asset.metadata.image || asset.metadata.backgroundImage
    : asset.media?.mediaCollection
      ? asset.media?.mediaCollection.medium.url
      : asset.media?.originalMediaUrl;
  const name = asset.name || asset.metadata?.name;
  const id = asset.tokenId.toString();

  const normalizedImageSrc = image?.startsWith('ipfs://')
    ? `https://ipfs.io/ipfs/${image.split('://')[1]}`
    : image;

  return (
    <HStack
      marginBottom={isLast ? '0rem' : '1.5rem'}
      px={{ base: '1rem', lg: '1.5rem' }}
      justifyContent="space-between"
      minW="400px"
    >
      <Flex width="15%">
        <EtherscanLink
          type="token"
          value={asset.tokenAddress}
          secondaryValue={id}
          data-testid="link-nft-image"
          padding={0}
          _hover={{ bg: 'transparent' }}
        >
          <Image
            src={normalizedImageSrc}
            fallbackSrc="/images/nft-image-default.svg"
            alt={name}
            w="3rem"
            h="3rem"
          />
        </EtherscanLink>
      </Flex>
      <Flex width="45%">
        <EtherscanLink
          type="address"
          value={asset.tokenAddress}
          _hover={{ bg: 'transparent' }}
          color="color-white"
          wordBreak="break-word"
        >
          {name}
        </EtherscanLink>
      </Flex>
      <Flex width="40%">
        <EtherscanLink
          type="token"
          value={asset.tokenAddress}
          secondaryValue={id}
          color="color-white"
          _hover={{ bg: 'transparent' }}
        >
          <Text as="span">{`#${createAccountSubstring(id)}`}</Text>
        </EtherscanLink>
      </Flex>
    </HStack>
  );
}
