import { Box, Flex, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { useCurrentDAOKey } from '../../hooks/DAO/useCurrentDAOKey';
import { useDAOStore } from '../../providers/App/AppProvider';
import { AzoriusGovernance } from '../../types';
import { formatCoin } from '../../utils';
import { DisplayAddress } from '../ui/links/DisplayAddress';
import { BarLoader } from '../ui/loaders/BarLoader';
import Divider from '../ui/utils/Divider';

export function ERC20TokenContainer() {
  const { t } = useTranslation(['settings']);
  const { daoKey } = useCurrentDAOKey();
  const { governance } = useDAOStore({ daoKey });

  const azoriusGovernance = governance as AzoriusGovernance;
  const { votesToken } = azoriusGovernance;

  return (
    <Box
      width="100%"
      data-testid="erc20-token-container"
    >
      <Text
        color="color-white"
        textStyle="text-lg-regular"
        data-testid="token-info-title"
      >
        {t('governanceTokenInfoTitle')}
      </Text>
      {votesToken ? (
        <Flex
          justifyContent="space-between"
          flexWrap={{ base: 'wrap', md: 'nowrap' }}
          mt={4}
          borderWidth="0.06rem"
          borderColor="color-neutral-900"
          borderRadius="0.75rem"
          flexDirection="column"
          data-testid="token-info-content"
        >
          {/* TOKEN NAME */}
          <Flex
            alignItems="center"
            justifyContent="space-between"
            px={6}
            py={2}
            data-testid="token-name-row"
          >
            <Text
              textStyle="text-base-regular"
              data-testid="token-name-label"
            >
              {t('governanceTokenNameTitle')}
            </Text>
            <DisplayAddress
              mb={-2}
              mr={-4}
              address={votesToken.address}
              data-testid="token-name-value"
            >
              {votesToken.name}
            </DisplayAddress>
          </Flex>

          <Divider />

          {/* TOKEN SYMBOL */}
          <Flex
            alignItems="center"
            justifyContent="space-between"
            px={6}
            py={2}
            data-testid="token-symbol-row"
          >
            <Text
              textStyle="text-base-regular"
              data-testid="token-symbol-label"
            >
              {t('governanceTokenSymbolLabel')}
            </Text>
            <Text
              color="color-neutral-300"
              textStyle="text-base-regular"
              data-testid="token-symbol-value"
            >
              ${votesToken.symbol}
            </Text>
          </Flex>

          <Divider />

          {/* TOTAL SUPPLY */}
          <Flex
            alignItems="center"
            justifyContent="space-between"
            px={6}
            py={2}
            data-testid="token-supply-row"
          >
            <Text
              textStyle="text-base-regular"
              data-testid="token-supply-label"
            >
              {t('governanceTokenSupplyLabel')}
            </Text>
            <Text
              color="color-neutral-300"
              textStyle="text-base-regular"
              data-testid="token-supply-value"
            >
              {formatCoin(
                votesToken.totalSupply,
                false,
                votesToken.decimals,
                votesToken.symbol,
                false,
              )}
            </Text>
          </Flex>
        </Flex>
      ) : (
        <Flex
          width="100%"
          justifyContent="center"
          alignItems="center"
          minHeight="100px"
          data-testid="token-loading"
        >
          <BarLoader />
        </Flex>
      )}
    </Box>
  );
}
