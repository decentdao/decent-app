import { create } from 'zustand';
import { createJSONStorage, devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { localStorageReplacer, localStorageReviver } from '../hooks/utils/cache/useLocalStorage';
import { DAOKey } from '../types';
import { createGovernancesSlice, GovernancesSlice } from './slices/governances';
import { createGuardSlice, GuardSlice } from './slices/guards';
import { createNodesSlice, NodesSlice } from './slices/nodes';
import { createTreasuriesSlice, TreasuriesSlice } from './slices/treasuries';

export type StoreSlice<T> = { [daoKey: DAOKey]: T };

export type GlobalStore = NodesSlice & TreasuriesSlice & GovernancesSlice & GuardSlice;
export type StoreMiddleware = [['zustand/immer', never], ['zustand/devtools', never]];

const localStorageSerializer = {
  replacer: localStorageReplacer,
  reviver: localStorageReviver,
};

const devToolsMiddlewareConfig = {
  enabled: true,
  serialize: localStorageSerializer,
};

const persistMiddlewareConfig = {
  name: 'global-store',
  storage: createJSONStorage(() => localStorage, localStorageSerializer),
};

export const useGlobalStore = create<GlobalStore>()(
  persist(
    devtools(
      immer((...params) => ({
        ...createNodesSlice(...params),
        ...createTreasuriesSlice(...params),
        ...createGovernancesSlice(...params),
        ...createGuardSlice(...params),
      })),
      devToolsMiddlewareConfig,
    ),
    persistMiddlewareConfig,
  ),
);

export const useDAOStore = ({ daoKey }: { daoKey: DAOKey | undefined }) => {
  const { getDaoNode, getTreasury, getGovernance, getGuard } = useGlobalStore();
  if (!daoKey) {
    throw new Error('DAO key is required to access global store');
  }
  const node = getDaoNode(daoKey);
  const treasury = getTreasury(daoKey);
  const governance = getGovernance(daoKey);
  const guard = getGuard(daoKey);
  return {
    node,
    treasury,
    governance,
    governanceContracts: {
      isLoaded: governance.isLoaded,
      strategies: governance.strategies,
      linearVotingErc20Address: governance.linearVotingErc20Address,
      linearVotingErc20WithHatsWhitelistingAddress:
        governance.linearVotingErc20WithHatsWhitelistingAddress,
      linearVotingErc721Address: governance.linearVotingErc721Address,
      linearVotingErc721WithHatsWhitelistingAddress:
        governance.linearVotingErc721WithHatsWhitelistingAddress,
      moduleAzoriusAddress: governance.moduleAzoriusAddress,
      votesTokenAddress: governance.votesTokenAddress,
      lockReleaseAddress: governance.lockReleaseAddress,
    },
    guard,
    guardContracts: {
      freezeGuardContractAddress: guard.freezeGuardContractAddress,
      freezeVotingContractAddress: guard.freezeVotingContractAddress,
      freezeGuardType: guard.freezeGuardType,
      freezeVotingType: guard.freezeVotingType,
    },
  };
};