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
  getDaoNode: (daoKey: DAOKey) => IDAO;
};

type SetState = (fn: (state: GlobalStore) => void) => void;

export const EMPTY_NODE: IDAO = {
  safe: null,
  subgraphInfo: null,
  modules: null,
  gaslessVotingEnabled: false,
  paymasterAddress: null,
};

export const createNodesSlice: StateCreator<GlobalStore, [], [], NodesSlice> = (
  set: SetState,
  get,
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
      const mappedSafe = {
        owners: owners.map(owner => getAddress(owner)),
        modulesAddresses: rawModules.map(module => getAddress(module)),
        guard: getAddress(guard),
        address: getAddress(address),
        nextNonce,
        threshold,
        nonce,
      };

      if (!state.nodes[daoKey]) {
        state.nodes[daoKey] = {
          safe: mappedSafe,
          subgraphInfo: daoInfo,
          modules,
          gaslessVotingEnabled: false,
          paymasterAddress: null,
        };
      } else {
        state.nodes[daoKey].safe = mappedSafe;
        state.nodes[daoKey].subgraphInfo = daoInfo;
        state.nodes[daoKey].modules = modules;
      }
    });
  },
  getDaoNode: (daoKey: DAOKey) => {
    const nodes = get().nodes;
    const node = nodes[daoKey];
    if (!node) {
      return EMPTY_NODE;
    }
    return node;
  },
});
