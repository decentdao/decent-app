import { Box, Flex, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { useCurrentDAOKey } from '../../hooks/DAO/useCurrentDAOKey';
import { useDAOStore } from '../../providers/App/AppProvider';
import { AzoriusGovernance } from '../../types';
import { DisplayAddress } from '../ui/links/DisplayAddress';
import { BarLoader } from '../ui/loaders/BarLoader';
import Divider from '../ui/utils/Divider';

export function ERC721TokensContainer() {
  const { t } = useTranslation(['settings']);
  const { daoKey } = useCurrentDAOKey();
  const { governance } = useDAOStore({ daoKey });

  const azoriusGovernance = governance as AzoriusGovernance;
  const { erc721Tokens } = azoriusGovernance;

  return (
    <Box
      width="100%"
      data-testid="erc721-tokens-container"
    >
      <Text
        color="color-white"
        textStyle="text-lg-regular"
        data-testid="token-info-title"
      >
        {t('governanceTokenInfoTitle')}
      </Text>
      {erc721Tokens ? (
        <Flex
          justifyContent="space-between"
          flexWrap={{ base: 'wrap', md: 'nowrap' }}
          mt={4}
          borderWidth="0.06rem"
          borderColor="color-neutral-900"
          borderRadius="0.75rem"
          flexDirection="column"
          data-testid="erc721-tokens-content"
        >
          {erc721Tokens.map((token, index) => (
            <Box
              key={token.address}
              data-testid={`erc721-token-${index}`}
            >
              {/* TOKEN NAME */}
              <Flex
                alignItems="center"
                justifyContent="space-between"
                px={6}
                py={2}
                data-testid={`erc721-token-name-row-${index}`}
              >
                <Text
                  textStyle="text-base-regular"
                  data-testid={`erc721-token-name-label-${index}`}
                >
                  {t('governanceTokenNameTitle')}
                </Text>
                <DisplayAddress
                  mb={-2}
                  mr={-4}
                  address={token.address}
                  data-testid={`erc721-token-name-value-${index}`}
                >
                  {token.name}
                </DisplayAddress>
              </Flex>

              <Divider />

              {/* TOKEN SYMBOL */}
              <Flex
                alignItems="center"
                justifyContent="space-between"
                px={6}
                py={2}
                data-testid={`erc721-token-symbol-row-${index}`}
              >
                <Text
                  textStyle="text-base-regular"
                  data-testid={`erc721-token-symbol-label-${index}`}
                >
                  {t('governanceTokenSymbolLabel')}
                </Text>
                <Text
                  color="color-neutral-300"
                  textStyle="text-base-regular"
                  data-testid={`erc721-token-symbol-value-${index}`}
                >
                  ${token.symbol}
                </Text>
              </Flex>

              <Divider />

              {/* VOTING WEIGHT */}
              <Flex
                alignItems="center"
                justifyContent="space-between"
                px={6}
                py={2}
                data-testid={`erc721-voting-weight-row-${index}`}
              >
                <Text
                  textStyle="text-base-regular"
                  data-testid={`erc721-voting-weight-label-${index}`}
                >
                  {t('governanceTokenWeightLabel')}
                </Text>
                <Text
                  color="color-neutral-300"
                  textStyle="text-base-regular"
                  data-testid={`erc721-voting-weight-value-${index}`}
                >
                  {token.votingWeight.toString()}
                </Text>
              </Flex>

              <Divider />

              {/* TOTAL WEIGHT */}
              <Flex
                alignItems="center"
                justifyContent="space-between"
                px={6}
                py={2}
                data-testid={`erc721-total-weight-row-${index}`}
              >
                <Text
                  textStyle="text-base-regular"
                  data-testid={`erc721-total-weight-label-${index}`}
                >
                  {t('governanceTokenTotalWeightLabel')}
                </Text>
                <Text
                  color="color-neutral-300"
                  textStyle="text-base-regular"
                  data-testid={`erc721-total-weight-value-${index}`}
                >
                  {token.totalSupply ? (token.totalSupply * token.votingWeight).toString() : 'n/a'}
                </Text>
              </Flex>
              {index < erc721Tokens.length - 1 && <Divider />}
            </Box>
          ))}
        </Flex>
      ) : (
        <Flex
          width="100%"
          justifyContent="center"
          alignItems="center"
          minHeight="100px"
          data-testid="erc721-loading"
        >
          <BarLoader />
        </Flex>
      )}
    </Box>
  );
}
