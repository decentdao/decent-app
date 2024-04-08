import { FractalRegistry } from '@fractal-framework/fractal-contracts';
import { useCallback, useEffect, useState } from 'react';
import { Address } from 'viem';
import { useEnsName } from 'wagmi';
import { getEventRPC } from '../../helpers';
import { useFractal } from '../../providers/App/AppProvider';
import { useEthersProvider } from '../../providers/Ethers/hooks/useEthersProvider';
import { useNetworkConfig } from '../../providers/NetworkConfig/NetworkConfigProvider';
import { CacheKeys } from '../utils/cache/cacheDefaults';
import { useLocalStorage } from '../utils/cache/useLocalStorage';
import { createAccountSubstring } from '../utils/useDisplayName';

/**
 * Gets the 'display name' for a Fractal DAO, in the following order of preference:
 *
 * 1. Primary ENS Name (reverse record)
 * 2. Fractal name registry name
 * 3. Truncated Eth address in the form 0xbFC4...7551
 */
export default function useDAOName({
  address,
  registryName,
}: {
  address?: string;
  registryName?: string | null;
}) {
  const { baseContracts } = useFractal();
  const [daoRegistryName, setDAORegistryName] = useState<string>('');
  const { chainId } = useNetworkConfig();

  const { data: ensName } = useEnsName({
    address: address as Address,
    chainId,
  });
  const { setValue, getValue } = useLocalStorage();

  const getDaoName = useCallback(async () => {
    if (!address || !baseContracts) {
      setDAORegistryName('');
      return;
    }

    if (ensName) {
      setDAORegistryName(ensName);
      return;
    }

    const cachedName = getValue(CacheKeys.DAO_NAME_PREFIX + address);
    if (cachedName) {
      setDAORegistryName(cachedName);
      return;
    }
    const { fractalRegistryContract } = baseContracts;
    if (!fractalRegistryContract) {
      setDAORegistryName(createAccountSubstring(address));
      return;
    }
    if (registryName) {
      // Aka supplied from Subgraph
      setDAORegistryName(registryName);
    } else {
      const rpc = getEventRPC<FractalRegistry>(fractalRegistryContract);
      const events = await rpc.queryFilter(rpc.filters.FractalNameUpdated(address));

      const latestEvent = events.pop();
      if (!latestEvent) {
        setDAORegistryName(createAccountSubstring(address));
        return;
      }

      const { daoName } = latestEvent.args;
      setValue(CacheKeys.DAO_NAME_PREFIX + address, daoName, 60);
      setDAORegistryName(daoName);
    }
  }, [address, ensName, baseContracts, getValue, setValue, registryName]);

  useEffect(() => {
    (async () => {
      await getDaoName();
    })();
  }, [getDaoName]);

  return { daoRegistryName };
}

/**
 * Gets the 'display name' for a Fractal DAO, in the following order of preference:
 *
 * 1. Primary ENS Name (reverse record)
 * 2. Fractal name registry name
 * 3. Truncated Eth address in the form 0xbFC4...7551
 *
 * @dev this is used on initial load of the DAO Node, after subGraph data is loaded
 */
export function useLazyDAOName() {
  const { setValue, getValue } = useLocalStorage();
  const provider = useEthersProvider();
  const getDaoName = useCallback(
    async (_address: string, _registryName?: string | null): Promise<string> => {
      const cachedName = getValue(CacheKeys.DAO_NAME_PREFIX + _address);
      if (cachedName) {
        return cachedName;
      }
      if (provider) {
        // check if ens name resolves
        const ensName = await provider.lookupAddress(_address).catch(() => null);
        if (ensName) {
          setValue(CacheKeys.DAO_NAME_PREFIX + _address, ensName, 5);
          return ensName;
        }
      }

      if (_registryName) {
        setValue(CacheKeys.DAO_NAME_PREFIX + _address, _registryName, 5);
        return _registryName;
      }

      return createAccountSubstring(_address);
    },
    [getValue, setValue, provider],
  );

  return { getDaoName };
}
