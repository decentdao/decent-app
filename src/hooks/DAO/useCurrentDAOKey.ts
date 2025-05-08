import { useSearchParams } from 'react-router-dom';
import { getAddress, isAddress } from 'viem';
import { validPrefixes } from '../../providers/NetworkConfig/networks';
import { useNetworkConfigStore } from '../../providers/NetworkConfig/useNetworkConfigStore';
import { DAOKey } from '../../types';
import { NetworkPrefix } from '../../types/network';

export function useCurrentDAOKey() {
  const [searchParams] = useSearchParams();
  const rawDAOKey = searchParams.get('dao');

  const { addressPrefix } = useNetworkConfigStore();

  const [queryAddressPrefix, queryDaoAddress] = rawDAOKey?.split(':') ?? [];
  const normalizedDAOAddress =
    queryDaoAddress && isAddress(queryDaoAddress) ? getAddress(queryDaoAddress) : undefined;
  const normalizedQueryAddressPrefix = queryAddressPrefix as NetworkPrefix;

  const daoKey =
    queryAddressPrefix && normalizedDAOAddress
      ? (`${queryAddressPrefix}:${normalizedDAOAddress}` as DAOKey)
      : undefined;

  if (
    queryAddressPrefix === undefined ||
    normalizedDAOAddress === undefined ||
    !validPrefixes.has(normalizedQueryAddressPrefix)
  ) {
    return {
      invalidQuery: true,
      wrongNetwork: false,
      addressPrefix: undefined,
      safeAddress: undefined,
      daoKey: undefined,
    };
  }

  return {
    invalidQuery: false,
    wrongNetwork: normalizedQueryAddressPrefix !== addressPrefix,
    addressPrefix: normalizedQueryAddressPrefix,
    safeAddress: normalizedDAOAddress,
    daoKey: daoKey,
  };
}
