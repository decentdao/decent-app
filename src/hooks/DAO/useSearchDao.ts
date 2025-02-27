import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Address } from 'viem';
import {
  supportedEnsNetworks,
  supportedNetworks,
  useNetworkConfigStore,
} from '../../providers/NetworkConfig/useNetworkConfigStore';
import { getIsSafe } from '../safe/useIsSafe';
import { useResolveENSName } from '../utils/useResolveENSName';

type ResolvedAddressWithChainId = {
  address: Address;
  chainId: number;
};
export const useSearchDao = () => {
  const { t } = useTranslation('dashboard');
  const { resolveENSName, isLoading: isAddressLoading } = useResolveENSName();
  const [searchString, setSearchString] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>();

  const [isSafeLookupLoading, setIsSafeLookupLoading] = useState<boolean>(false);
  const [resolvedAddressesWithPrefix, setSafeResolvedAddressesWithPrefix] = useState<
    ResolvedAddressWithChainId[]
  >([]);

  const { getConfigByChainId } = useNetworkConfigStore();

  const findSafes = useCallback(
    async (resolvedAddressesWithChainId: { address: Address; chainId: number }[]) => {
      /*
      This function only checks if the address is a Safe on any of the EVM networks. 
      The same Safe could of on multiple networks
      */
      for await (const resolved of resolvedAddressesWithChainId) {
        const networkConfig = getConfigByChainId(resolved.chainId);
        const isSafe = await getIsSafe(resolved.address, networkConfig);
        if (isSafe) {
          setSafeResolvedAddressesWithPrefix(prevState => [...prevState, resolved]);
        }
      }
    },
    [getConfigByChainId],
  );

  const resolveInput = useCallback(
    async (input: string) => {
      setIsSafeLookupLoading(true);
      try {
        const resolvedAddressPromises = supportedEnsNetworks.map(async chainId => {
          const { resolvedAddress, isValid } = await resolveENSName(input, chainId);
          return isValid ? resolvedAddress : null;
        });

        const resolvedAddresses = (await Promise.all(resolvedAddressPromises)).filter(
          address => address !== null,
        );

        if (resolvedAddresses.length === 0) {
          setErrorMessage('Invalid search');
          return;
        }

        const resolvedAddressesSet = new Set(resolvedAddresses);
        const mappedAddressesWithChainIds: ResolvedAddressWithChainId[] = [];

        for (const network of supportedNetworks) {
          for (const address of resolvedAddressesSet) {
            mappedAddressesWithChainIds.push({ address, chainId: network.chain.id });
          }
        }

        await findSafes(mappedAddressesWithChainIds);
      } catch (error) {
        setErrorMessage(t('errorInvalidSearch'));
      } finally {
        setIsSafeLookupLoading(false);
      }
    },
    [findSafes, resolveENSName, t],
  );

  useEffect(() => {
    setErrorMessage(undefined);
    setSafeResolvedAddressesWithPrefix([]);
    if (searchString === '') {
      return;
    }
    resolveInput(searchString).catch(() => setErrorMessage(t('errorInvalidSearch')));
  }, [resolveInput, searchString, t]);

  return {
    resolvedAddressesWithPrefix,
    errorMessage,
    isLoading: isAddressLoading || isSafeLookupLoading,
    setSearchString,
    searchString,
  };
};
