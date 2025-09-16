import {
  Box,
  Button,
  IconButton,
  Progress,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/react';
import { CaretUpDown, DotsThree } from '@phosphor-icons/react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DAO_ROUTES } from '../../constants/routes';
import { useTokenSaleClaimFunds } from '../../hooks/DAO/proposal/useTokenSaleClaimFunds';
import { useCurrentDAOKey } from '../../hooks/DAO/useCurrentDAOKey';
import { useNetworkConfigStore } from '../../providers/NetworkConfig/useNetworkConfigStore';
import { TokenSaleData } from '../../types/tokenSale';
import {
  formatSaleDate,
  formatSaleAmount,
  calculateSaleProgress,
  getSaleStatus,
} from '../../utils/tokenSaleFormats';
import { StatusChip } from '../ui/badges/StatusChip';
import { OptionMenu } from '../ui/menus/OptionMenu';

interface TokenSalesTableProps {
  tokenSales: TokenSaleData[];
}

export function TokenSalesTable({ tokenSales }: TokenSalesTableProps) {
  const navigate = useNavigate();
  const { safeAddress } = useCurrentDAOKey();
  const { addressPrefix } = useNetworkConfigStore();
  const { claimFunds, pending } = useTokenSaleClaimFunds();

  const sortedSales = useMemo(() => {
    // Sort by active status first, then by end date
    return [...tokenSales].sort((a, b) => {
      if (a.isActive && !b.isActive) return -1;
      if (!a.isActive && b.isActive) return 1;
      return Number(b.saleEndTimestamp) - Number(a.saleEndTimestamp);
    });
  }, [tokenSales]);

  function SortableHeader({ children }: { children: React.ReactNode }) {
    return (
      <Button
        variant="ghost"
        size="sm"
        rightIcon={<CaretUpDown size={16} />}
        color="color-content-muted"
        fontWeight="medium"
        fontSize="sm"
        h="36px"
        px={0}
        py={0}
        borderRadius="8px"
        _hover={{ bg: 'transparent' }}
        _active={{ bg: 'transparent' }}
        _focus={{ bg: 'transparent' }}
      >
        {children}
      </Button>
    );
  }

  const getRowActions = (sale: TokenSaleData) => [
    {
      optionKey: 'viewDetails',
      onClick: () => {
        if (safeAddress) {
          navigate(DAO_ROUTES.tokenSaleDetails.relative(addressPrefix, safeAddress, sale.address));
        }
      },
    },
    ...(sale.isActive
      ? [
          {
            optionKey: 'claimFunds',
            onClick: () => {
              claimFunds(sale.address, sale.name);
            },
          },
        ]
      : []),
  ];

  return (
    <Box>
      <Table variant="tokenSales">
        <Thead>
          <Tr>
            <Th>
              <Text
                textStyle="text-sm-medium"
                color="color-content-muted"
              >
                Name
              </Text>
            </Th>
            <Th>
              <SortableHeader>Closing Date</SortableHeader>
            </Th>
            <Th>
              <SortableHeader>Status</SortableHeader>
            </Th>
            <Th>
              <SortableHeader>Raised</SortableHeader>
            </Th>
            <Th>
              <SortableHeader>Target Raise</SortableHeader>
            </Th>
            <Th>
              <SortableHeader>Progress</SortableHeader>
            </Th>
            <Th></Th>
          </Tr>
        </Thead>
        <Tbody>
          {sortedSales.map(sale => {
            const { status, type } = getSaleStatus(
              sale.saleStartTimestamp,
              sale.saleEndTimestamp,
              sale.saleState,
            );
            const progress = calculateSaleProgress(
              sale.totalCommitments,
              sale.maximumTotalCommitment,
            );

            return (
              <Tr key={sale.address}>
                <Td>
                  <Text
                    textStyle="text-sm-medium"
                    color="color-content-content1-foreground"
                    overflow="hidden"
                    textOverflow="ellipsis"
                    whiteSpace="nowrap"
                  >
                    {sale.name}
                  </Text>
                </Td>
                <Td>
                  <Text
                    textStyle="text-sm-regular"
                    color="color-content-content1-foreground"
                  >
                    {formatSaleDate(sale.saleEndTimestamp)}
                  </Text>
                </Td>
                <Td>
                  <StatusChip
                    status={status}
                    type={type}
                  />
                </Td>
                <Td>
                  <Text
                    textStyle="text-sm-regular"
                    color="color-content-content1-foreground"
                  >
                    {formatSaleAmount(sale.totalCommitments)}
                  </Text>
                </Td>
                <Td>
                  <Text
                    textStyle="text-sm-regular"
                    color="color-content-content1-foreground"
                  >
                    {formatSaleAmount(sale.maximumTotalCommitment)}
                  </Text>
                </Td>
                <Td>
                  <Box
                    w="full"
                    maxW="100px"
                  >
                    <Progress
                      value={progress}
                      h="8px"
                      borderRadius="full"
                      bg="color-alpha-white-900"
                      sx={{
                        '& > div': {
                          bg: 'color-lilac-100',
                        },
                      }}
                    />
                  </Box>
                </Td>
                <Td>
                  <OptionMenu
                    trigger={<DotsThree size={16} />}
                    options={getRowActions(sale)}
                    namespace="menu"
                    buttonAs={IconButton}
                    buttonProps={{
                      variant: 'ghost',
                      size: 'sm',
                      bg: 'color-content-content2',
                      borderRadius: '4px',
                      h: '24px',
                      p: '4px',
                      border: '1px solid',
                      borderColor: 'color-layout-border-10',
                      isDisabled: pending,
                      _hover: {
                        bg: 'color-content-content2',
                      },
                    }}
                  />
                </Td>
              </Tr>
            );
          })}
        </Tbody>
      </Table>

      {/* Table Caption */}
      <Box pt={4}>
        <Text
          textStyle="text-xs-regular"
          color="color-content-muted"
          fontSize="12px"
          lineHeight="16px"
        >
          Showing{' '}
          <Text
            as="span"
            fontWeight="semibold"
          >
            1-{tokenSales.length}
          </Text>{' '}
          of{' '}
          <Text
            as="span"
            fontWeight="semibold"
          >
            {tokenSales.length}
          </Text>{' '}
          sales
        </Text>
      </Box>
    </Box>
  );
}
