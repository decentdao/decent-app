import { isAddress } from 'viem';
import { validPrefixes } from '../../providers/NetworkConfig/networks';
import { useNetworkConfigStore } from '../../providers/NetworkConfig/useNetworkConfigStore';
import useCurrentDAOKey from '../useCurrentDAOKey';

export const useParseSafeAddress = () => {
  const { addressPrefix: queryAddressPrefix, daoAddress: queryDaoAddress } = useCurrentDAOKey();

  const { addressPrefix } = useNetworkConfigStore();

  if (
    queryAddressPrefix === undefined ||
    queryDaoAddress === undefined ||
    !validPrefixes.has(queryAddressPrefix) ||
    !isAddress(queryDaoAddress)
  ) {
    return {
      invalidQuery: true,
      wrongNetwork: false,
      addressPrefix: undefined,
      safeAddress: undefined,
    };
  }

  if (queryAddressPrefix !== addressPrefix) {
    return {
      invalidQuery: false,
      wrongNetwork: true,
      addressPrefix: queryAddressPrefix,
      safeAddress: undefined,
    };
  }

  return {
    invalidQuery: false,
    wrongNetwork: false,
    addressPrefix: queryAddressPrefix,
    safeAddress: queryDaoAddress,
  };
};
