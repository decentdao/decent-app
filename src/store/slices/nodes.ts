import { getAddress } from 'viem';
import { StateCreator } from 'zustand';
import { DAOKey, DAOSubgraph, DecentModule, IDAO, SafeWithNextNonce } from '../../types';
import { GlobalStore, StoreSlice } from '../store';

export type NodesSlice = {
  nodes: StoreSlice<IDAO>;
  setDaoNode: (
    daoKey: DAOKey,
    {
      safe,
      daoInfo,
      modules,
    }: { safe: SafeWithNextNonce; daoInfo: DAOSubgraph; modules: DecentModule[] },
  ) => void;
};

type SetState = (fn: (state: GlobalStore) => void) => void;

export const createNodesSlice: StateCreator<GlobalStore, [], [], NodesSlice> = (
  _get,
  set: SetState,
) => ({
  nodes: {},
  setDaoNode: (
    daoKey,
    {
      safe: { owners, modules: rawModules, guard, address, nextNonce, threshold, nonce },
      daoInfo,
      modules,
    },
  ) => {
    set(state => {
      if (!state.nodes[daoKey]) {
        state.nodes[daoKey] = {} as IDAO;
      }
      state.nodes[daoKey].safe = {
        owners: owners.map(owner => getAddress(owner)),
        modulesAddresses: rawModules.map(module => getAddress(module)),
        guard: getAddress(guard),
        address: getAddress(address),
        nextNonce,
        threshold,
        nonce,
      };
      state.nodes[daoKey].subgraphInfo = daoInfo;
      state.nodes[daoKey].modules = modules;
    });
  },
});
