import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { DAOKey } from '../types';
import { createGovernancesSlice, GovernancesSlice } from './slices/governances';
import { createNodesSlice, NodesSlice } from './slices/nodes';

export type StoreSlice<T> = { [daoKey: DAOKey]: T };
export type SetState = (fn: (state: GlobalStore) => void) => void;
export type GlobalStore = NodesSlice & GovernancesSlice;

export const useGlobalStore = create<GlobalStore>()(
  persist(
    immer((...params) => ({
      ...createNodesSlice(...params),
      ...createGovernancesSlice(...params),
    })),
    {
      name: 'global-store',
    },
  ),
);
