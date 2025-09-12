import { Box, Button, Grid, GridItem, Text, VStack } from '@chakra-ui/react';
import { TrendUp, Play, CurrencyDollar } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../../components/ui/page/Header/PageHeader';
import { CONTENT_MAXW } from '../../../constants/common';
import { DAO_ROUTES } from '../../../constants/routes';
import { useCurrentDAOKey } from '../../../hooks/DAO/useCurrentDAOKey';
import { useDAOStore } from '../../../providers/App/AppProvider';
import { useNetworkConfigStore } from '../../../providers/NetworkConfig/useNetworkConfigStore';

// Mock data for the dashboard stats
const mockStats = {
  totalSales: 0,
  activeSales: 0,
  totalRaised: '$0',
};

export function SafeTokenSalePage() {
  const { daoKey } = useCurrentDAOKey();
  const {
    node: { safe },
  } = useDAOStore({ daoKey });
  const navigate = useNavigate();
  const { addressPrefix } = useNetworkConfigStore();

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
      />

      <VStack
        spacing={8}
        align="stretch"
      >
        {/* Stats Grid */}
        <Grid
          templateColumns="repeat(3, 1fr)"
          gap={6}
        >
          <GridItem>
            <StatCard
              icon={<TrendUp size={20} />}
              label="Total Sales"
              value={mockStats.totalSales.toString()}
            />
          </GridItem>
          <GridItem>
            <StatCard
              icon={<Play size={20} />}
              label="Active Sales"
              value={mockStats.activeSales.toString()}
            />
          </GridItem>
          <GridItem>
            <StatCard
              icon={<CurrencyDollar size={20} />}
              label="Total Raised"
              value={mockStats.totalRaised}
            />
          </GridItem>
        </Grid>

        {/* Empty State */}
        <EmptyState />
      </VStack>
    </Box>
  );
}
