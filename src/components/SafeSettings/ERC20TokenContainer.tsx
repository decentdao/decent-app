import { Box, Flex, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { AzoriusGovernance } from '../../types';
import { formatCoin } from '../../utils';
import { DisplayAddress } from '../ui/links/DisplayAddress';
import { BarLoader } from '../ui/loaders/BarLoader';

export function ERC20TokenContainer() {
  const { t } = useTranslation(['settings']);
  const { governance } = useDecentStore({ daoKey });

  const azoriusGovernance = governance as AzoriusGovernance;
  const { votesToken } = azoriusGovernance;

  return (
    <Box width="100%">
      <Text textStyle="heading-small">{t('governanceTokenTitle')}</Text>
      {votesToken ? (
        <Flex
          justifyContent="space-between"
          flexWrap={{ base: 'wrap', md: 'nowrap' }}
          mt={4}
          p="1.5rem"
          borderWidth="0.06rem"
          borderColor="neutral-3"
          borderRadius="0.75rem"
        >
          {/* TOKEN NAME */}
          <Box w={{ base: 'full', sm: 'auto' }}>
            <Text
              color="neutral-7"
              textStyle="labels-small"
            >
              {t('governanceTokenNameLabel')}
            </Text>
            <Flex mt="0.5rem">
              <DisplayAddress address={votesToken.address}>{votesToken.name}</DisplayAddress>
            </Flex>
          </Box>

          {/* TOKEN SYMBOL */}
          <Box w={{ base: 'full', sm: 'auto' }}>
            <Text
              color="neutral-7"
              textStyle="labels-small"
            >
              {t('governanceTokenSymbolLabel')}
            </Text>
            <Text mt="0.5rem">{votesToken.symbol}</Text>
          </Box>

          {/* TOTAL SUPPLY */}
          <Box w={{ base: 'full', sm: 'auto' }}>
            <Text
              color="neutral-7"
              textStyle="labels-small"
            >
              {t('governanceTokenSupplyLabel')}
            </Text>
            <Text mt="0.5rem">
              {formatCoin(
                votesToken.totalSupply,
                false,
                votesToken.decimals,
                votesToken.symbol,
                false,
              )}
            </Text>
          </Box>
        </Flex>
      ) : (
        <Flex
          width="100%"
          justifyContent="center"
          alignItems="center"
          minHeight="100px"
        >
          <BarLoader />
        </Flex>
      )}
    </Box>
  );
}
