import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { DAOKey } from '../types';
import { createNodesSlice, NodesSlice } from './slices/nodes';
import { createTreasuriesSlice, TreasuriesSlice } from './slices/treasuries';

export type StoreSlice<T> = { [daoKey: DAOKey]: T };

export type GlobalStore = NodesSlice & TreasuriesSlice;
export type StoreMiddleware = [['zustand/immer', never], ['zustand/devtools', never]];

export const useGlobalStore = create<GlobalStore>()(
  persist(
    devtools(
      immer((...params) => ({
        ...createNodesSlice(...params),
        ...createTreasuriesSlice(...params),
      })),
    ),
    {
      name: 'global-store',
    },
  ),
);
