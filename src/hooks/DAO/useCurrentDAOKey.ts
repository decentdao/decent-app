import { useSearchParams } from 'react-router-dom';
import { getAddress } from 'viem';
import { DAOKey } from '../../types';
import { NetworkPrefix } from '../../types/network';

export function useCurrentDAOKey() {
  const [searchParams] = useSearchParams();
  const rawDAOKey = searchParams.get('dao');

  const [addressPrefix, daoAddress] = rawDAOKey?.split(':') ?? [];
  const normalizedDAOAddress = daoAddress ? getAddress(daoAddress) : undefined;

  const daoKey =
    addressPrefix && normalizedDAOAddress
      ? (`${addressPrefix}:${normalizedDAOAddress}` as DAOKey)
      : undefined;

  return {
    daoKey,
    addressPrefix: addressPrefix as NetworkPrefix,
    daoAddress: normalizedDAOAddress,
  };
}
