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
