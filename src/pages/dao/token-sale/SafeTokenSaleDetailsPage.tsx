import { Box, Flex, Text, VStack } from '@chakra-ui/react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { formatUnits } from 'viem';
import { TokenSaleBanner } from '../../../components/TokenSales/TokenSaleBanner';
import { TokenSaleCountdown } from '../../../components/TokenSales/TokenSaleCountdown';
import { TokenSaleInfoCard } from '../../../components/TokenSales/TokenSaleInfoCard';
import { TokenSaleProgressCard } from '../../../components/TokenSales/TokenSaleProgressCard';
import { InfoBoxLoader } from '../../../components/ui/loaders/InfoBoxLoader';
import PageHeader from '../../../components/ui/page/Header/PageHeader';
import { CONTENT_MAXW, USDC_DECIMALS } from '../../../constants/common';
import { DAO_ROUTES } from '../../../constants/routes';
import { useTokenSaleClaimFunds } from '../../../hooks/DAO/proposal/useTokenSaleClaimFunds';
import { useCurrentDAOKey } from '../../../hooks/DAO/useCurrentDAOKey';
import { useDAOStore } from '../../../providers/App/AppProvider';
import { useNetworkConfigStore } from '../../../providers/NetworkConfig/useNetworkConfigStore';
import { TokenSaleState } from '../../../types/tokenSale';
import {
  formatTokenPrice,
  calculateTokenSupplyForSale,
  formatSaleAmount,
  formatSaleDate,
} from '../../../utils/tokenSaleFormats';
import { BuyerRequirementsDisplay } from './components/buyer-requirements/BuyerRequirementsDisplay';

export function SafeTokenSaleDetailsPage() {
  const { t } = useTranslation('tokenSale');
  const { saleId } = useParams<{ saleId: string }>();
  const { daoKey } = useCurrentDAOKey();
  const { addressPrefix } = useNetworkConfigStore();
  const {
    tokenSales,
    node: { safe },
  } = useDAOStore({ daoKey });
  const { claimFunds, pending } = useTokenSaleClaimFunds();

  const tokenSale = useMemo(() => {
    if (!saleId || !tokenSales) return null;
    return tokenSales.find(sale => sale.address.toLowerCase() === saleId.toLowerCase()) || null;
  }, [saleId, tokenSales]);

  if (!tokenSale) {
    return <InfoBoxLoader />;
  }

  const formatCurrency = (value: bigint, decimals: number = USDC_DECIMALS) => {
    return formatSaleAmount(value, decimals);
  };

  const formatTokenAmount = (value: bigint, decimals: number) => {
    const formatted = parseFloat(formatUnits(value, decimals));
    return formatted.toLocaleString('en-US', { maximumFractionDigits: 0 });
  };

  // Use proper formatting functions for contract data
  const tokenPriceFormatted = formatTokenPrice(tokenSale.saleTokenPrice);
  const tokenSupplyForSale = calculateTokenSupplyForSale(
    tokenSale.maximumTotalCommitment,
    tokenSale.saleTokenPrice,
    tokenSale.tokenDecimals,
  );
  const totalSupplyFormatted = formatTokenAmount(tokenSupplyForSale, tokenSale.tokenDecimals);
  const valuationFormatted = formatSaleAmount(tokenSale.maximumTotalCommitment, USDC_DECIMALS);

  if (!safe?.address) {
    return <InfoBoxLoader />;
  }

  return (
    <Box
      maxW={CONTENT_MAXW}
      mx="auto"
    >
      <PageHeader
        breadcrumbs={[
          {
            terminus: t('tokenSalesBreadcrumb'),
            path: DAO_ROUTES.tokenSale.relative(addressPrefix, safe?.address),
          },
          {
            terminus: tokenSale.name,
            path: '',
          },
        ]}
      />

      <VStack
        spacing={6}
        align="stretch"
        mt={6}
      >
        {/* Progress Section */}
        <VStack
          spacing={4}
          align="stretch"
        >
          <Flex
            justify="space-between"
            align="center"
          >
            <Text
              textStyle="text-2xl-semibold"
              color="color-content-content1-foreground"
            >
              {tokenSale.name}
            </Text>
            <TokenSaleCountdown endTimestamp={tokenSale.saleEndTimestamp} />
          </Flex>

          <TokenSaleProgressCard
            raised={tokenSale.totalCommitments}
            goal={tokenSale.maximumTotalCommitment}
            minimum={tokenSale.minimumTotalCommitment}
            commitmentTokenDecimals={6} // Assuming USDC
          />

          {/* Fundraising Goal Not Met Banner */}
          {tokenSale.saleState === TokenSaleState.FAILED &&
            tokenSale.totalCommitments < tokenSale.maximumTotalCommitment / 2n && (
              <TokenSaleBanner
                title={t('fundraisingGoalNotMetTitle')}
                description={t('fundraisingGoalNotMetDescription', {
                  amount: formatCurrency(tokenSale.totalCommitments),
                })}
                buttonText={t('reclaimTokensButton')}
                onButtonClick={() => {
                  claimFunds(tokenSale.address, tokenSale.name);
                }}
                variant="fundraisingBanner"
                buttonDisabled={pending}
              />
            )}

          {/* Successful Sale Banner */}
          {tokenSale.saleState === TokenSaleState.SUCCEEDED &&
            tokenSale.totalCommitments >= tokenSale.minimumTotalCommitment && (
              <TokenSaleBanner
                title={t('successfulSaleTitle')}
                description={t('successfulSaleDescription', {
                  amount: formatCurrency(tokenSale.totalCommitments),
                })}
                buttonText={t('claimFundsButton')}
                onButtonClick={() => {
                  claimFunds(tokenSale.address, tokenSale.name);
                }}
                variant="successBanner"
                buttonDisabled={pending}
              />
            )}
        </VStack>

        {/* Sale Configuration */}
        <TokenSaleInfoCard title={t('saleConfigurationTitle')}>
          <TokenSaleInfoCard.Section>
            <TokenSaleInfoCard.Item
              label={t('tokenInfoLabel')}
              value={tokenSale.tokenSymbol}
            />
            <TokenSaleInfoCard.Item
              label={t('totalSupplyInfoLabel')}
              value={totalSupplyFormatted}
            />
            <TokenSaleInfoCard.Item
              label={t('priceInfoLabel')}
              value={tokenPriceFormatted}
            />
          </TokenSaleInfoCard.Section>

          <TokenSaleInfoCard.Divider />

          <TokenSaleInfoCard.Section>
            <TokenSaleInfoCard.Item
              label={t('closingDateInfoLabel')}
              value={formatSaleDate(tokenSale.saleEndTimestamp)}
            />
            <TokenSaleInfoCard.Item
              label={t('minimumRaiseInfoLabel')}
              value={formatCurrency(tokenSale.minimumTotalCommitment)}
            />
            <TokenSaleInfoCard.Item
              label={t('fundraisingCapInfoLabel')}
              value={formatCurrency(tokenSale.maximumTotalCommitment)}
            />
            <TokenSaleInfoCard.Item
              label={t('valuationInfoLabel')}
              value={valuationFormatted}
            />
          </TokenSaleInfoCard.Section>

          <TokenSaleInfoCard.Divider />

          <TokenSaleInfoCard.Section>
            <TokenSaleInfoCard.Item
              label={t('minPurchaseInfoLabel')}
              value={formatCurrency(tokenSale.minimumCommitment)}
            />
            <TokenSaleInfoCard.Item
              label={t('maxPurchaseInfoLabel')}
              value={formatCurrency(tokenSale.maximumCommitment)}
            />
          </TokenSaleInfoCard.Section>
        </TokenSaleInfoCard>
        {/* Buyer Requirements */}
        <TokenSaleInfoCard title={t('buyerRequirementsTitle')}>
          <TokenSaleInfoCard.Section>
            <TokenSaleInfoCard.Item
              label={t('requiresKycKybLabel')}
              value={tokenSale.kyc ? t('yes') : t('no')}
            />
          </TokenSaleInfoCard.Section>
        </TokenSaleInfoCard>

        {/* Requirements List */}
        <BuyerRequirementsDisplay
          requirements={tokenSale.buyerRequirements || []}
          orOutOf={tokenSale.orOutOf}
        />
      </VStack>
    </Box>
  );
}
