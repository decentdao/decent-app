import { Box, Button, Grid, GridItem, Text, VStack } from '@chakra-ui/react';
import { TrendUp, Play, CurrencyDollar } from '@phosphor-icons/react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatUnits } from 'viem';
import { TokenSalesTable } from '../../../components/TokenSales/TokenSalesTable';
import PageHeader from '../../../components/ui/page/Header/PageHeader';
import { CONTENT_MAXW } from '../../../constants/common';
import { DAO_ROUTES } from '../../../constants/routes';
import { useCurrentDAOKey } from '../../../hooks/DAO/useCurrentDAOKey';
import { useDAOStore } from '../../../providers/App/AppProvider';
import { useNetworkConfigStore } from '../../../providers/NetworkConfig/useNetworkConfigStore';

export function SafeTokenSalePage() {
  const { daoKey } = useCurrentDAOKey();
  const {
    node: { safe },
    tokenSales,
  } = useDAOStore({ daoKey });
  console.log('🚀 ~ tokenSales:', tokenSales);
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

    // Format total raised (assuming commitment token is typically USDC with 6 decimals)
    // TODO: This should ideally use the actual commitment token decimals from each sale
    const totalRaisedFormatted =
      totalRaisedWei > 0n
        ? `$${parseFloat(formatUnits(totalRaisedWei, 6)).toLocaleString('en-US', { maximumFractionDigits: 0 })}`
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

  function StatCard({
    icon,
    label,
    value,
  }: {
    icon: React.ReactNode;
    label: string;
    value: string;
  }) {
    return (
      <Box
        bg="transparent"
        borderRadius="12px"
        p={6}
        border="1px solid"
        borderColor="color-layout-border-10"
        position="relative"
      >
        <Box
          position="absolute"
          top={6}
          right={6}
          color="color-content-muted"
        >
          {icon}
        </Box>
        <Text
          textStyle="text-sm-medium"
          color="color-content-content1-foreground"
          mb={2}
        >
          {label}
        </Text>
        <Text
          textStyle="text-2xl-semibold"
          color="color-content-content1-foreground"
        >
          {value}
        </Text>
      </Box>
    );
  }

  function EmptyState() {
    return (
      <Box
        bg="transparent"
        borderRadius="12px"
        p={6}
        textAlign="center"
        border="1px solid"
        borderColor="color-layout-border-10"
        position="relative"
      >
        <Box
          w={24}
          h={24}
          mx="auto"
          mb={4}
        >
          <img
            src="/images/decentsquare.png"
            alt="Token Sale Icon"
            width="96"
            height="96"
            style={{ width: '100%', height: '100%' }}
          />
        </Box>
        <VStack
          spacing={6}
          align="center"
        >
          <VStack
            spacing={1}
            align="center"
          >
            <Text
              textStyle="text-2xl-regular"
              color="color-content-content1-foreground"
            >
              No sales yet
            </Text>
            <Text
              textStyle="text-sm-regular"
              color="color-content-content2-foreground"
              maxW="464px"
            >
              Get started by creating your first token sale. Our guided setup will help you
              configure everything properly.
            </Text>
          </VStack>
          <Button onClick={handleCreateSale}>Create Your First Sale</Button>
        </VStack>
      </Box>
    );
  }

  return (
    <Box
      maxW={CONTENT_MAXW}
      mx="auto"
    >
      <PageHeader
        breadcrumbs={[
          {
            terminus: 'Token Sales',
            path: '',
          },
        ]}
        buttonProps={
          stats.totalSales > 0
            ? {
                onClick: handleCreateSale,
                children: 'Create Token Sale',
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
              label="Total Sales"
              value={stats.totalSales.toString()}
            />
          </GridItem>
          <GridItem>
            <StatCard
              icon={<Play size={20} />}
              label="Active Sales"
              value={stats.activeSales.toString()}
            />
          </GridItem>
          <GridItem>
            <StatCard
              icon={<CurrencyDollar size={20} />}
              label="Total Raised"
              value={stats.totalRaised}
            />
          </GridItem>
        </Grid>

        {/* Show table when sales exist, empty state when no sales */}
        {stats.totalSales === 0 ? (
          <EmptyState />
        ) : (
          <TokenSalesTable tokenSales={tokenSales || []} />
        )}
      </VStack>
    </Box>
  );
}
