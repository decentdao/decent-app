import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer'
import { DAOKey } from '../types';
import { createNodesSlice, NodesSlice } from './slices/nodes';

export type StoreSlice<T> = { [daoKey: DAOKey]: T };

export type GlobalStore = NodesSlice;

export type GetState = (state: GlobalStore) => GlobalStore;
export type SetState = () => GlobalStore;

export const useGlobalStore = create<GlobalStore>()(
  persist(
    immer(
      (...params) => ({
        ...createNodesSlice(...params),
      }),
    ),
    {
      name: 'global-store',
    },
  ),
);
