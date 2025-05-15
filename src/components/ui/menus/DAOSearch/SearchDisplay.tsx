import { Flex, Spinner, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { Address } from 'viem';
import { SafeDisplayRow } from '../../../../pages/home/SafeDisplayRow';
import { getNetworkConfig } from '../../../../providers/NetworkConfig/useNetworkConfigStore';
import { ErrorBoundary } from '../../utils/ErrorBoundary';
import { MySafesErrorFallback } from '../../utils/MySafesErrorFallback';

interface ISearchDisplay {
  loading: boolean;
  address: Address | undefined;
  onClickView: Function;
  chainId: number;
}

export function SearchDisplay({ loading, address, onClickView, chainId }: ISearchDisplay) {
  const { t } = useTranslation(['common', 'dashboard']);

  if (loading) {
    return (
      <Flex
        justifyContent="center"
        alignItems="center"
        py="1rem"
      >
        <Spinner
          thickness="4px"
          speed="0.75s"
          emptyColor="neutral-3"
          color="neutral-7"
          size="lg"
        />
      </Flex>
    );
  }

  if (address) {
    return (
      <Flex
        flexDir="column"
        px="0.5rem"
      >
        <ErrorBoundary fallback={MySafesErrorFallback}>
          <Text
            textStyle="labels-large"
            color="neutral-7"
            py="1rem"
            px="0.5rem"
          >
            {t('labelDAOFound')}
          </Text>
          <SafeDisplayRow
            name={undefined}
            address={address}
            network={getNetworkConfig(chainId).addressPrefix}
            onClick={() => {
              onClickView();
            }}
            showAddress
          />
        </ErrorBoundary>
      </Flex>
    );
  }

  return null;
}
