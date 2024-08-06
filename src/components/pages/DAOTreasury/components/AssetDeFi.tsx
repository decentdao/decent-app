import { Divider, HStack, Flex, Tooltip, Text, Image, Box } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { useFractal } from '../../../../providers/App/AppProvider';
import { DefiBalance } from '../../../../types';
import { MOCK_MORALIS_ETH_ADDRESS } from '../../../../utils/address';
import { formatPercentage, formatUSD, formatCoin } from '../../../../utils/numberFormats';
import EtherscanLink from '../../../ui/links/EtherscanLink';

export function DeFiHeader() {
  const { t } = useTranslation('treasury');
  return (
    <Box
      mb="1rem"
      minW="360px"
    >
      <Divider
        my="1rem"
        variant="darker"
      />
      <HStack px={{ base: '1rem', lg: '1.5rem' }}>
        <Text
          w="40%"
          textStyle="label-small"
          color="neutral-7"
        >
          {t('columnCoins')}
        </Text>
        <Text
          w="35%"
          textStyle="label-small"
          color="neutral-7"
        >
          {t('columnValue')}
        </Text>
        <Text
          w="25%"
          textStyle="label-small"
          color="neutral-7"
        >
          {t('columnAllocation')}
        </Text>
      </HStack>
    </Box>
  );
}

export function DeFiRow({ asset }: { asset: DefiBalance }) {
  const {
    node: { daoAddress },
    treasury: { totalUsdValue },
  } = useFractal();

  const isNativeCoin =
    asset.position?.address?.toLowerCase() === MOCK_MORALIS_ETH_ADDRESS.toLowerCase();
  const positionToken = asset?.position?.tokens[0];
  return (
    <Flex
      my="0.5rem"
      justifyContent="space-between"
      px={{ base: '1rem', lg: '1.5rem' }}
      gap="1rem"
      minW="360px"
    >
      <Flex
        w="40%"
        alignItems="center"
        gap="0.5rem"
      >
        <Image
          src={asset.protocolLogo}
          fallbackSrc="/images/coin-icon-default.svg"
          alt={asset.protocolName}
          w="1rem"
          h="1rem"
        />
        <EtherscanLink
          color="white-0"
          _hover={{ bg: 'transparent' }}
          textStyle="body-base"
          padding={0}
          borderWidth={0}
          value={
            isNativeCoin
              ? daoAddress
              : asset.position?.address || asset?.position?.tokens[0]?.tokenAddress || null
          }
          type={isNativeCoin ? 'address' : 'token'}
          wordBreak="break-word"
        >
          {asset.protocolName}
        </EtherscanLink>
      </Flex>
      <Flex
        w="35%"
        alignItems="flex-start"
        flexWrap="wrap"
      >
        <Text
          maxWidth="23.8rem"
          width="100%"
          isTruncated
        >
          <Tooltip
            label={formatCoin(
              positionToken?.balance || 0n,
              false,
              positionToken?.decimals,
              positionToken?.symbol,
            )}
            placement="top-start"
          >
            {formatCoin(
              positionToken?.balance || 0n,
              true,
              positionToken?.decimals,
              positionToken?.symbol,
              false,
            )}
          </Tooltip>
        </Text>
        {asset?.position?.balanceUsd && positionToken && positionToken.usdPrice && (
          <Text
            textStyle="label-small"
            color="neutral-7"
            width="100%"
          >
            <Tooltip
              label={`1 ${positionToken?.symbol} = ${formatUSD(positionToken.usdPrice)}`}
              placement="top-start"
            >
              {formatUSD(asset?.position?.balanceUsd)}
            </Tooltip>
          </Text>
        )}
      </Flex>

      <Flex
        w="25%"
        alignItems="flex-start"
      >
        {asset?.position?.balanceUsd && (
          <Text>
            {totalUsdValue > 0 && formatPercentage(asset?.position?.balanceUsd, totalUsdValue)}
          </Text>
        )}
      </Flex>
    </Flex>
  );
}
