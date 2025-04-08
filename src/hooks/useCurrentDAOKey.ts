import { useSearchParams } from 'react-router-dom';
import { getAddress } from 'viem';
import { DAOKey, NetworkPrefix } from '../types';

export default function useCurrentDAOKey() {
  const [searchParams] = useSearchParams();
  const rawDAOKey = searchParams.get('dao');

  const [addressPrefix, daoAddress] = rawDAOKey?.split(':') ?? [];
  const normalizedDAOAddress = daoAddress ? getAddress(daoAddress) : undefined;

  return {
    daoKey: rawDAOKey ? (`${addressPrefix}:${normalizedDAOAddress}` as DAOKey) : undefined,
    addressPrefix: addressPrefix as NetworkPrefix,
    daoAddress: normalizedDAOAddress,
  };
}
