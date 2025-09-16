import { create } from 'zustand';
import { createJSONStorage, devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { EnvironmentFeatureFlags } from '../helpers/environmentFeatureFlags';
import { FEATURE_FLAGS, FeatureFlags } from '../helpers/featureFlags';
import { localStorageReplacer, localStorageReviver } from '../hooks/utils/cache/useLocalStorage';
import { DAOKey } from '../types';
import { createGovernancesSlice, GovernancesSlice } from './slices/governances';
import { createGuardSlice, GuardSlice } from './slices/guards';
import { createNodesSlice, NodesSlice } from './slices/nodes';
import { createRevShareSlice, RevShareSlice } from './slices/revShare';
import { createRolesSlice, RolesSlice } from './slices/roles';
import { createTreasuriesSlice, TreasuriesSlice } from './slices/treasuries';

export type StoreSlice<T> = { [daoKey: DAOKey]: T };

export type GlobalStore = NodesSlice &
  TreasuriesSlice &
  GovernancesSlice &
  GuardSlice &
  RevShareSlice &
  RolesSlice;
export type StoreMiddleware = [['zustand/immer', never], ['zustand/devtools', never]];

FeatureFlags.instance = new EnvironmentFeatureFlags(FEATURE_FLAGS);
const apiFlag = FeatureFlags.instance?.isFeatureEnabled('flag_api');

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

// do not persist to local storage if we are loading from the api
export const useGlobalStore = apiFlag
  ? create<GlobalStore>()(
      devtools(
        immer((...params) => ({
          ...createNodesSlice(...params),
          ...createTreasuriesSlice(...params),
          ...createGovernancesSlice(...params),
          ...createGuardSlice(...params),
          ...createRevShareSlice(...params),
          ...createRolesSlice(...params),
        })),
        devToolsMiddlewareConfig,
      ),
    )
  : create<GlobalStore>()(
      persist(
        devtools(
          immer((...params) => ({
            ...createNodesSlice(...params),
            ...createTreasuriesSlice(...params),
            ...createGovernancesSlice(...params),
            ...createGuardSlice(...params),
            ...createRevShareSlice(...params),
            ...createRolesSlice(...params),
          })),
          devToolsMiddlewareConfig,
        ),
        persistMiddlewareConfig,
      ),
    );
