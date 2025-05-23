import { Flex, Spinner } from '@chakra-ui/react';
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
          emptyColor="color-neutral-900"
          color="color-neutral-300"
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
