import { Box, Divider, Flex, HStack, Image, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { useFractal } from '../../../providers/App/AppProvider';
import { useDaoInfoStore } from '../../../store/daoInfo/useDaoInfoStore';
import { DefiBalance } from '../../../types';
import { formatCoin, formatPercentage, formatUSD } from '../../../utils';
import { DecentTooltip } from '../../ui/DecentTooltip';
import EtherscanLink from '../../ui/links/EtherscanLink';

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
          textStyle="labels-small"
          color="neutral-7"
        >
          {t('columnProtocols')}
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

export function DeFiRow({ asset }: { asset: DefiBalance }) {
  const {
    treasury: { totalUsdValue },
  } = useFractal();

  const { safe } = useDaoInfoStore();

  // Really only used for etherscan link below. Will not work for non-ETH chains
  const isNativePosition =
    asset.position?.address?.toLowerCase() ===
    '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'.toLowerCase();

  const tooltipLabel = asset.position?.tokens
    .map(token =>
      formatCoin(BigInt(Math.floor(Number(token.balance))), false, token.decimals, token.symbol),
    )
    .join(' / ');

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
        <DecentTooltip
          label={tooltipLabel}
          placement="top-start"
        >
          <Image
            src={asset.protocolLogo}
            fallbackSrc="/images/coin-icon-default.svg"
            alt={asset.protocolName}
            title={asset.protocolName}
            w="1rem"
            h="1rem"
          />
        </DecentTooltip>
        <EtherscanLink
          color="white-0"
          _hover={{ bg: 'transparent' }}
          padding={0}
          borderWidth={0}
          value={isNativePosition ? (safe?.address ?? null) : asset.position?.address || null}
          type={isNativePosition ? 'address' : 'token'}
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
        {asset.position?.balanceUsd && (
          <DecentTooltip
            label={tooltipLabel}
            placement="top-start"
          >
            <Text width="100%">{formatUSD(asset.position.balanceUsd)}</Text>
          </DecentTooltip>
        )}
      </Flex>

      <Flex
        w="25%"
        alignItems="flex-start"
      >
        {asset.position?.balanceUsd && (
          <Text>
            {totalUsdValue > 0 && formatPercentage(asset.position.balanceUsd, totalUsdValue)}
          </Text>
        )}
      </Flex>
    </Flex>
  );
}
