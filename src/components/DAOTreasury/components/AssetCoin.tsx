import { Box, Divider, Flex, HStack, Image, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { useFractal } from '../../../providers/App/AppProvider';
import { useDaoInfoStore } from '../../../store/daoInfo/useDaoInfoStore';
import { TokenBalance } from '../../../types';
import { formatCoin, formatPercentage, formatUSD } from '../../../utils';
import { DecentTooltip } from '../../ui/DecentTooltip';
import EtherscanLink from '../../ui/links/EtherscanLink';

export function CoinHeader() {
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
          textStyle="labels-small"
          color="neutral-7"
        >
          {t('columnCoins')}
        </Text>
        <Text
          w="35%"
          textStyle="labels-small"
          color="neutral-7"
        >
          {t('columnValue')}
        </Text>
        <Text
          w="25%"
          textStyle="labels-small"
          color="neutral-7"
        >
          {t('columnAllocation')}
        </Text>
      </HStack>
    </Box>
  );
}

export function CoinRow({ asset }: { asset: TokenBalance }) {
  const {
    treasury: { totalUsdValue },
  } = useFractal();

  const { safe } = useDaoInfoStore();

  const etherscanLinkValue = asset.nativeToken ? (safe?.address ?? null) : asset.tokenAddress;

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
          src={asset.logo || asset.thumbnail}
          fallbackSrc="/images/coin-icon-default.svg"
          alt={asset.symbol}
          w="1rem"
          h="1rem"
        />
        <EtherscanLink
          color="white-0"
          _hover={{ bg: 'transparent' }}
          padding={0}
          borderWidth={0}
          value={etherscanLinkValue}
          type={asset.nativeToken ? 'address' : 'token'}
          wordBreak="break-word"
        >
          {asset.symbol}
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
          <DecentTooltip
            label={formatCoin(asset.balance, false, asset.decimals, asset.symbol)}
            placement="top-start"
          >
            {formatCoin(asset.balance, true, asset.decimals, asset.symbol, false)}
          </DecentTooltip>
        </Text>
        {asset.usdPrice && asset.usdValue && (
          <Text
            textStyle="labels-small"
            color="neutral-7"
            width="100%"
          >
            <DecentTooltip
              label={`1 ${asset.symbol} = ${formatUSD(asset.usdPrice)}`}
              placement="top-start"
            >
              {formatUSD(asset.usdValue)}
            </DecentTooltip>
          </Text>
        )}
      </Flex>

      <Flex
        w="25%"
        alignItems="flex-start"
      >
        {asset.usdValue && (
          <Text>{totalUsdValue > 0 && formatPercentage(asset.usdValue, totalUsdValue)}</Text>
        )}
      </Flex>
    </Flex>
  );
}
