import { Box, Text, VStack } from '@chakra-ui/react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { formatUnits } from 'viem';
import { TokenSaleInfoCard } from '../../../../components/TokenSales/TokenSaleInfoCard';
import { USDC_DECIMALS } from '../../../../constants/common';
import { useCurrentDAOKey } from '../../../../hooks/DAO/useCurrentDAOKey';
import { useDAOStore } from '../../../../providers/App/AppProvider';
import { TokenSaleFormValues } from '../../../../types/tokenSale';
import { calculateSaleTokenProtocolFeeForContract } from '../../../../utils/tokenSaleCalculations';
import {
  formatSaleAmount,
  formatSaleDate,
  formatTokenPrice,
} from '../../../../utils/tokenSaleFormats';
import { BuyerRequirementsDisplay } from './buyer-requirements/BuyerRequirementsDisplay';

interface TokenSalePreviewPanelProps {
  values: TokenSaleFormValues;
}

export function TokenSalePreviewPanel({ values }: TokenSalePreviewPanelProps) {
  const { t } = useTranslation('tokenSale');
  const daoKeyResult = useCurrentDAOKey();
  const daoKey =
    daoKeyResult.invalidQuery || daoKeyResult.wrongNetwork ? undefined : daoKeyResult.daoKey;
  const { treasury } = useDAOStore({ daoKey });

  // Get selected token details for proper decimals
  const selectedToken = useMemo(() => {
    return treasury.assetsFungible.find(
      token => token.tokenAddress === values.tokenAddress && !token.possibleSpam,
    );
  }, [treasury.assetsFungible, values.tokenAddress]);

  // Calculate derived values similar to details page
  const derivedValues = useMemo(() => {
    // Token price formatting
    const tokenPriceFormatted = values.saleTokenPrice.bigintValue
      ? formatTokenPrice(values.saleTokenPrice.bigintValue)
      : '--';
    // Token decimals and total supply formatting
    const tokenDecimals = selectedToken?.decimals || 18;
    const totalSupplyFormatted = values.maxTokenSupply.bigintValue
      ? parseFloat(formatUnits(values.maxTokenSupply.bigintValue, tokenDecimals)).toLocaleString(
          'en-US',
          {
            maximumFractionDigits: 0,
          },
        )
      : '--';

    // Available in treasury formatting
    const availableInTreasuryFormatted = selectedToken
      ? parseFloat(formatUnits(BigInt(selectedToken.balance), tokenDecimals)).toLocaleString('en-US', {
          maximumFractionDigits: 0,
        })
      : '--';

    // Calculate reserved for sale (net tokens) and reserved for fee
    let reservedForSaleFormatted = '--';
    let reservedForFeeFormatted = '--';
    let fundraisingCapFormatted = '--';

    // Calculate token amounts even if price isn't set yet
    if (values.saleTokenSupply.bigintValue) {
      const PRECISION = BigInt(10 ** 18);
      const saleTokenProtocolFee = calculateSaleTokenProtocolFeeForContract(); // 2.5% in 18-decimal precision

      // Net tokens available to buyers (after protocol fee)
      const netTokensForSale =
        (values.saleTokenSupply.bigintValue * PRECISION) / (PRECISION + saleTokenProtocolFee);

      // Protocol fee amount in tokens
      const protocolFeeTokens = values.saleTokenSupply.bigintValue - netTokensForSale;

      // Format the token amounts
      reservedForSaleFormatted = parseFloat(
        formatUnits(netTokensForSale, tokenDecimals),
      ).toLocaleString('en-US', {
        maximumFractionDigits: 0,
      });

      reservedForFeeFormatted = parseFloat(
        formatUnits(protocolFeeTokens, tokenDecimals),
      ).toLocaleString('en-US', {
        maximumFractionDigits: 0,
      });

      // Only calculate fundraising cap if we also have price
      if (values.saleTokenPrice.bigintValue) {
        const fundraisingCapBigInt =
          (netTokensForSale * values.saleTokenPrice.bigintValue) / PRECISION;
        fundraisingCapFormatted = formatSaleAmount(fundraisingCapBigInt, USDC_DECIMALS);
      }
    }

    // Date formatting
    const startDateFormatted = values.startDate
      ? formatSaleDate(Math.floor(new Date(values.startDate).getTime() / 1000))
      : '--';
    const endDateFormatted = values.endDate
      ? formatSaleDate(Math.floor(new Date(values.endDate).getTime() / 1000))
      : '--';

    // Amount formatting
    const minimumFundraiseFormatted = values.minimumFundraise
      ? `$${parseFloat(values.minimumFundraise).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
      : '--';

    const minPurchaseFormatted = values.minPurchase
      ? `$${parseFloat(values.minPurchase).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
      : '--';

    const maxPurchaseFormatted = values.maxPurchase
      ? `$${parseFloat(values.maxPurchase).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
      : '--';

    // Valuation formatting
    const valuationFormatted = values.valuation
      ? `$${parseFloat(values.valuation).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
      : '--';

    return {
      tokenPriceFormatted,
      totalSupplyFormatted,
      availableInTreasuryFormatted,
      valuationFormatted,
      reservedForSaleFormatted,
      reservedForFeeFormatted,
      fundraisingCapFormatted,
      startDateFormatted,
      endDateFormatted,
      minimumFundraiseFormatted,
      minPurchaseFormatted,
      maxPurchaseFormatted,
    };
  }, [values, selectedToken]);

  return (
    <Box
      w="400px"
      position="sticky"
      top="6rem"
      flexShrink={0}
    >
      <VStack
        spacing={4}
        align="stretch"
      >
        {/* Sale Name */}
        {values.saleName && (
          <Box>
            <Text
              textStyle="text-md-semibold"
              color="color-content-content1-foreground"
            >
              {values.saleName}
            </Text>
          </Box>
        )}

        {/* Sale Configuration */}
        <TokenSaleInfoCard title={t('saleConfigurationTitle')}>
          <TokenSaleInfoCard.Section>
            <TokenSaleInfoCard.Item
              label={t('tokenInfoLabel')}
              value={values.tokenSymbol || '--'}
            />
            <TokenSaleInfoCard.Item
              label={t('totalSupplyInfoLabel')}
              value={derivedValues.totalSupplyFormatted}
            />
            <TokenSaleInfoCard.Item
              label={t('availableForSaleLabel')}
              value={derivedValues.availableInTreasuryFormatted}
            />
            <TokenSaleInfoCard.Item
              label={t('valuationInfoLabel')}
              value={derivedValues.valuationFormatted}
            />
            <TokenSaleInfoCard.Item
              label={t('priceInfoLabel')}
              value={derivedValues.tokenPriceFormatted}
            />
            <TokenSaleInfoCard.Item
              label={t('reservedForSaleLabel')}
              value={derivedValues.reservedForSaleFormatted}
            />
            <TokenSaleInfoCard.Item
              label={t('reservedForFeeLabel')}
              value={derivedValues.reservedForFeeFormatted}
            />
          </TokenSaleInfoCard.Section>

          <TokenSaleInfoCard.Divider />

          <TokenSaleInfoCard.Section>
            <TokenSaleInfoCard.Item
              label={t('startDateInfoLabel')}
              value={derivedValues.startDateFormatted}
            />
            <TokenSaleInfoCard.Item
              label={t('closingDateInfoLabel')}
              value={derivedValues.endDateFormatted}
            />
            <TokenSaleInfoCard.Item
              label={t('minimumRaiseInfoLabel')}
              value={derivedValues.minimumFundraiseFormatted}
            />
            <TokenSaleInfoCard.Item
              label={t('fundraisingCapInfoLabel')}
              value={derivedValues.fundraisingCapFormatted}
            />
          </TokenSaleInfoCard.Section>

          <TokenSaleInfoCard.Divider />

          <TokenSaleInfoCard.Section>
            <TokenSaleInfoCard.Item
              label={t('minPurchaseInfoLabel')}
              value={derivedValues.minPurchaseFormatted}
            />
            <TokenSaleInfoCard.Item
              label={t('maxPurchaseInfoLabel')}
              value={derivedValues.maxPurchaseFormatted}
            />
          </TokenSaleInfoCard.Section>
        </TokenSaleInfoCard>

        {/* Buyer Requirements */}
        <TokenSaleInfoCard title={t('buyerRequirementsTitle')}>
          <TokenSaleInfoCard.Section>
            <TokenSaleInfoCard.Item
              label={t('requiresKycKybLabel')}
              value={values.kycEnabled ? t('yes') : t('no')}
            />
          </TokenSaleInfoCard.Section>
        </TokenSaleInfoCard>

        {/* Requirements List */}
        {(values.buyerRequirements.length > 0 || values.kycEnabled) && (
          <BuyerRequirementsDisplay
            requirements={values.buyerRequirements || []}
            kycEnabled={values.kycEnabled}
            orOutOf={values.orOutOf === 'all' ? undefined : values.orOutOf}
          />
        )}
      </VStack>
    </Box>
  );
}
