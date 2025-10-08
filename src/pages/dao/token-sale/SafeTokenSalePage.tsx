import { Box, Grid, GridItem, VStack } from '@chakra-ui/react';
import { TrendUp, Play, CurrencyDollar } from '@phosphor-icons/react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { formatUnits } from 'viem';
import { TokenSalesTable } from '../../../components/TokenSales/TokenSalesTable';
import { InfoBoxLoader } from '../../../components/ui/loaders/InfoBoxLoader';
import PageHeader from '../../../components/ui/page/Header/PageHeader';
import { CONTENT_MAXW, USDC_DECIMALS } from '../../../constants/common';
import { DAO_ROUTES } from '../../../constants/routes';
import { useCurrentDAOKey } from '../../../hooks/DAO/useCurrentDAOKey';
import { useDAOStore } from '../../../providers/App/AppProvider';
import { useNetworkConfigStore } from '../../../providers/NetworkConfig/useNetworkConfigStore';
import { EmptyState } from './components/EmptyState';
import { StatCard } from './components/StatCard';

export function SafeTokenSalePage() {
  const { t } = useTranslation('tokenSale');
  const { daoKey } = useCurrentDAOKey();
  const {
    node: { safe },
    tokenSales,
  } = useDAOStore({ daoKey });
  const navigate = useNavigate();
  const { addressPrefix } = useNetworkConfigStore();

  // Calculate live stats from token sales data
  const stats = useMemo(() => {
    if (!tokenSales || tokenSales.length === 0) {
      return {
        totalSales: 0,
        activeSales: 0,
        totalRaised: '$0',
      };
    }

    const activeSales = tokenSales.filter(sale => sale.isActive).length;

    // Calculate total raised across all sales
    const totalRaisedWei = tokenSales.reduce((total, sale) => {
      return total + sale.totalCommitments;
    }, 0n);

    // @dev assuming commitment token is 6 decimals (USDC)
    const totalRaisedFormatted =
      totalRaisedWei > 0n
        ? `$${parseFloat(formatUnits(totalRaisedWei, USDC_DECIMALS)).toLocaleString('en-US', { maximumFractionDigits: 0 })}`
        : '$0';
    return {
      totalSales: tokenSales.length,
      activeSales,
      totalRaised: totalRaisedFormatted,
    };
  }, [tokenSales]);

  const handleCreateSale = () => {
    if (!safe?.address) return;
    navigate(DAO_ROUTES.tokenSaleNew.relative(addressPrefix, safe.address));
  };

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
            path: '',
          },
        ]}
        buttonProps={
          stats.totalSales > 0
            ? {
                onClick: handleCreateSale,
                children: t('createTokenSaleButtonLabel'),
                'data-testid': 'create-token-sale-button',
              }
            : undefined
        }
      />

      <VStack
        spacing={8}
        align="stretch"
        mt={6}
      >
        {/* Stats Grid - Always shown */}
        <Grid
          templateColumns="repeat(3, 1fr)"
          gap={6}
        >
          <GridItem>
            <StatCard
              icon={<TrendUp size={20} />}
              label={t('totalSalesLabel')}
              value={stats.totalSales.toString()}
            />
          </GridItem>
          <GridItem>
            <StatCard
              icon={<Play size={20} />}
              label={t('activeSalesLabel')}
              value={stats.activeSales.toString()}
            />
          </GridItem>
          <GridItem>
            <StatCard
              icon={<CurrencyDollar size={20} />}
              label={t('totalRaisedLabel')}
              value={stats.totalRaised}
            />
          </GridItem>
        </Grid>

        {/* Show table when sales exist, empty state when no sales */}
        {stats.totalSales === 0 ? (
          <EmptyState handleCreateSale={handleCreateSale} />
        ) : (
          <TokenSalesTable tokenSales={tokenSales || []} />
        )}
      </VStack>
    </Box>
  );
}
