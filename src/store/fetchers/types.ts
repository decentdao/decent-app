import { Address } from 'viem';
import { DAOKey } from '../../types';

export type FetcherParams = {
  daoKey: DAOKey;
  safeAddress?: Address;
  invalidQuery: boolean;
  wrongNetwork: boolean;
  storeFeatureEnabled: boolean;
  chainId: number;
};
