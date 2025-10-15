import { Box, Button, Flex, Text, VStack } from '@chakra-ui/react';
import { Wrench } from '@phosphor-icons/react';
import { useMemo, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { formatUnits, getContract, erc20Abi } from 'viem';
import { TokenSaleBanner } from '../../../components/TokenSales/TokenSaleBanner';
import { TokenSaleCountdown } from '../../../components/TokenSales/TokenSaleCountdown';
import { TokenSaleInfoCard } from '../../../components/TokenSales/TokenSaleInfoCard';
import { TokenSaleProgressCard } from '../../../components/TokenSales/TokenSaleProgressCard';
import { InfoBoxLoader } from '../../../components/ui/loaders/InfoBoxLoader';
import PageHeader from '../../../components/ui/page/Header/PageHeader';
import { CONTENT_MAXW, USDC_DECIMALS } from '../../../constants/common';
import { DAO_ROUTES } from '../../../constants/routes';
import useFeatureFlag from '../../../helpers/environmentFeatureFlags';
import { useTokenSaleClaimFunds } from '../../../hooks/DAO/proposal/useTokenSaleClaimFunds';
import { useCurrentDAOKey } from '../../../hooks/DAO/useCurrentDAOKey';
import useNetworkPublicClient from '../../../hooks/useNetworkPublicClient';
import { useCanUserCreateProposal } from '../../../hooks/utils/useCanUserSubmitProposal';
import { useDAOStore } from '../../../providers/App/AppProvider';
import { useNetworkConfigStore } from '../../../providers/NetworkConfig/useNetworkConfigStore';
import { calculateFDVFromTokenPrice } from '../../../utils/tokenSaleCalculations';
import {
  formatTokenPrice,
  calculateTokenSupplyForSale,
  formatSaleAmount,
  formatSaleDate,
} from '../../../utils/tokenSaleFormats';
import { getTokenSaleActionState } from '../../../utils/tokenSaleStatus';
import { TokenSaleDevModal } from './components/TokenSaleDevModal';
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
  const publicClient = useNetworkPublicClient();
  const [totalTokenSupply, setTotalTokenSupply] = useState<bigint | null>(null);
  const [isDevModalOpen, setIsDevModalOpen] = useState(false);
  const devFeatureEnabled = useFeatureFlag('flag_dev');
  const { canUserCreateProposal: userHasPermissions } = useCanUserCreateProposal();

  const tokenSale = useMemo(() => {
    if (!saleId || !tokenSales) return null;
    return tokenSales.find(sale => sale.address.toLowerCase() === saleId.toLowerCase()) || null;
  }, [saleId, tokenSales]);

  // Calculate valuation (FDV) from total token supply and price
  const valuationFormatted = useMemo(() => {
    if (!tokenSale || !totalTokenSupply || !tokenSale.saleTokenPrice) {
      return '--';
    }

    // Calculate FDV: totalTokenSupply * tokenPrice
    const fdvBigInt = calculateFDVFromTokenPrice(
      tokenSale.saleTokenPrice,
      totalTokenSupply,
      tokenSale.tokenDecimals,
    );

    return formatSaleAmount(fdvBigInt, USDC_DECIMALS);
  }, [tokenSale, totalTokenSupply]);

  // Fetch total token supply for valuation calculation
  useEffect(() => {
    const fetchTotalSupply = async () => {
      if (!tokenSale?.saleToken || !publicClient) return;

      try {
        const tokenContract = getContract({
          address: tokenSale.saleToken,
          abi: erc20Abi,
          client: publicClient,
        });

        const supply = await tokenContract.read.totalSupply();
        setTotalTokenSupply(supply);
      } catch (error) {
        console.error('Failed to fetch total token supply:', error);
        setTotalTokenSupply(null);
      }
    };

    fetchTotalSupply();
  }, [tokenSale?.saleToken, publicClient]);

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
  );
  const totalSupplyFormatted = formatTokenAmount(tokenSupplyForSale, tokenSale.tokenDecimals);

  // Get sale action state (what actions user can take)
  const { canReclaimTokens, canClaimProceeds } = getTokenSaleActionState(
    tokenSale,
    userHasPermissions,
  );

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
            <Flex
              align="center"
              gap={4}
            >
              <TokenSaleCountdown endTimestamp={tokenSale.saleEndTimestamp} />
              {devFeatureEnabled && (
                <Button
                  leftIcon={<Wrench size={16} />}
                  variant="secondary"
                  onClick={() => setIsDevModalOpen(true)}
                >
                  Dev Menu
                </Button>
              )}
            </Flex>
          </Flex>

          <TokenSaleProgressCard
            raised={tokenSale.totalCommitments}
            goal={tokenSale.maximumTotalCommitment}
            minimum={tokenSale.minimumTotalCommitment}
            commitmentTokenDecimals={USDC_DECIMALS} // @dev assuming commitment token is 6 decimals (USDC)
          />

          {/* Sale failed (minimum not reached OR no sales) */}
          {canReclaimTokens && (
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

          {/* Sale succeeded (minimum reached OR had sales) */}
          {canClaimProceeds && (
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
              label={t('availableForSaleLabel')}
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
              label={t('startDateInfoLabel')}
              value={formatSaleDate(tokenSale.saleStartTimestamp)}
            />
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

      {/* Dev Modal */}
      {devFeatureEnabled && (
        <TokenSaleDevModal
          isOpen={isDevModalOpen}
          onClose={() => setIsDevModalOpen(false)}
          tokenSale={tokenSale}
        />
      )}
    </Box>
  );
}
