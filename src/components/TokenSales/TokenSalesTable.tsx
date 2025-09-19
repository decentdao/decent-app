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
import { CaretDown, CaretUp, CaretUpDown, DotsThree } from '@phosphor-icons/react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
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

type SortField = 'name' | 'endDate' | 'status' | 'raised' | 'target' | 'progress';
type SortDirection = 'asc' | 'desc';

function useTokenSalesTableSorting(tokenSales: TokenSaleData[]) {
  const [sortField, setSortField] = useState<SortField>('endDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const sortedSales = useMemo(() => {
    const sorted = [...tokenSales].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'endDate':
          comparison = Number(a.saleEndTimestamp) - Number(b.saleEndTimestamp);
          break;
        case 'status':
          comparison = a.saleState - b.saleState;
          break;
        case 'raised':
          comparison = Number(a.totalCommitments) - Number(b.totalCommitments);
          break;
        case 'target':
          comparison = Number(a.maximumTotalCommitment) - Number(b.maximumTotalCommitment);
          break;
        case 'progress': {
          const progressA = calculateSaleProgress(a.totalCommitments, a.maximumTotalCommitment);
          const progressB = calculateSaleProgress(b.totalCommitments, b.maximumTotalCommitment);
          comparison = progressA - progressB;
          break;
        }
        default:
          return 0;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [tokenSales, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  return {
    sortedSales,
    sortField,
    sortDirection,
    handleSort,
  };
}

interface TokenSalesTableProps {
  tokenSales: TokenSaleData[];
}

export function TokenSalesTable({ tokenSales }: TokenSalesTableProps) {
  const { t } = useTranslation('tokenSale');
  const navigate = useNavigate();
  const { safeAddress } = useCurrentDAOKey();
  const { addressPrefix } = useNetworkConfigStore();
  const { claimFunds, pending } = useTokenSaleClaimFunds();
  const { sortedSales, sortField, sortDirection, handleSort } =
    useTokenSalesTableSorting(tokenSales);

  function SortableHeader({
    children,
    field,
    onClick,
  }: {
    children: React.ReactNode;
    field: SortField;
    onClick: (field: SortField) => void;
  }) {
    const isActive = sortField === field;
    const getSortIcon = () => {
      if (!isActive) return <CaretUpDown size={16} />;
      return sortDirection === 'asc' ? <CaretUp size={16} /> : <CaretDown size={16} />;
    };

    return (
      <Button
        variant="ghost"
        size="sm"
        rightIcon={getSortIcon()}
        color={isActive ? 'color-content-content1-foreground' : 'color-content-muted'}
        textStyle="text-sm-medium"
        h="36px"
        px={0}
        py={0}
        borderRadius="8px"
        _hover={{ bg: 'transparent' }}
        _active={{ bg: 'transparent' }}
        _focus={{ bg: 'transparent' }}
        onClick={() => onClick(field)}
      >
        {children}
      </Button>
    );
  }

  // todo should also account for if there are any unclaimed funds
  const canClaimFunds = (sale: TokenSaleData) =>
    sale.saleState === 2 && sale.totalCommitments >= sale.maximumTotalCommitment / 2n;

  const getRowActions = (sale: TokenSaleData) => [
    {
      optionKey: 'viewDetails',
      onClick: () => {
        if (safeAddress) {
          navigate(DAO_ROUTES.tokenSaleDetails.relative(addressPrefix, safeAddress, sale.address));
        }
      },
    },
    ...(canClaimFunds(sale)
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
              <SortableHeader
                field="name"
                onClick={handleSort}
              >
                {t('nameColumnLabel')}
              </SortableHeader>
            </Th>
            <Th>
              <SortableHeader
                field="endDate"
                onClick={handleSort}
              >
                {t('closingDateColumnLabel')}
              </SortableHeader>
            </Th>
            <Th>
              <SortableHeader
                field="status"
                onClick={handleSort}
              >
                {t('statusColumnLabel')}
              </SortableHeader>
            </Th>
            <Th>
              <SortableHeader
                field="raised"
                onClick={handleSort}
              >
                {t('raisedColumnLabel')}
              </SortableHeader>
            </Th>
            <Th>
              <SortableHeader
                field="target"
                onClick={handleSort}
              >
                {t('targetRaiseColumnLabel')}
              </SortableHeader>
            </Th>
            <Th>
              <SortableHeader
                field="progress"
                onClick={handleSort}
              >
                {t('progressColumnLabel')}
              </SortableHeader>
            </Th>
            <Th></Th>
          </Tr>
        </Thead>
        <Tbody>
          {sortedSales.map(sale => {
            const { status, type } = getSaleStatus(sale.saleState);
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
          {t('showingSalesText', { start: 1, end: tokenSales.length, total: tokenSales.length })}
        </Text>
      </Box>
    </Box>
  );
}
