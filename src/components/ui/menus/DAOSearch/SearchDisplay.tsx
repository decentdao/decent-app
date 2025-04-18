import { Flex, Icon, Spinner, Text } from '@chakra-ui/react';
import { WarningCircle } from '@phosphor-icons/react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Address } from 'viem';
import { useCurrentDAOKey } from '../../../../hooks/DAO/useCurrentDAOKey';
import { SafeDisplayRow } from '../../../../pages/home/SafeDisplayRow';
import { useStore } from '../../../../providers/App/AppProvider';
import { getNetworkConfig } from '../../../../providers/NetworkConfig/useNetworkConfigStore';
import { ErrorBoundary } from '../../utils/ErrorBoundary';
import { MySafesErrorFallback } from '../../utils/MySafesErrorFallback';

interface ISearchDisplay {
  loading: boolean;
  errorMessage: string | undefined;
  address: Address | undefined;
  onClickView: Function;
  chainId: number;
}

export function SearchDisplay({
  loading,
  errorMessage,
  address,
  onClickView,
  chainId,
}: ISearchDisplay) {
  const { t } = useTranslation(['common', 'dashboard']);
  const { daoKey } = useCurrentDAOKey();
  const {
    node: { safe },
  } = useStore({ daoKey });

  const isCurrentSafe = useMemo(
    () => !!safe && !!safe?.address && safe.address === address,
    [safe, address],
  );

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

  if (errorMessage) {
    return (
      <Flex
        alignItems="center"
        gap="2"
        p="0.5rem 1rem"
      >
        <Icon
          as={WarningCircle}
          color="red-1"
          boxSize="1.5rem"
        />
        <Text
          textStyle="heading-small"
          color="red-1"
        >
          {errorMessage}
        </Text>
      </Flex>
    );
  }

  if (address) {
    return (
      <Flex
        cursor={isCurrentSafe ? 'not-allowed' : 'default'}
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
            {t(isCurrentSafe ? 'labelCurrentDAO' : 'labelDAOFound')}
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
