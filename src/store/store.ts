import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { DAOKey } from '../types';
import { createNodesSlice, NodesSlice } from './slices/nodes';
import { createTreasuriesSlice, TreasuriesSlice } from './slices/treasuries';

export type StoreSlice<T> = { [daoKey: DAOKey]: T };

export type GlobalStore = NodesSlice & TreasuriesSlice;

export type GetState = (state: GlobalStore) => GlobalStore;
export type SetState = (fn: (state: GlobalStore) => void) => void;

export const useGlobalStore = create<GlobalStore>()(
  persist(
    immer((...params) => ({
      ...createNodesSlice(...params),
      ...createTreasuriesSlice(...params),
    })),
    {
      name: 'global-store',
    },
  ),
);
