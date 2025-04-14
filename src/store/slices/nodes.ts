import { getAddress } from 'viem';
import { StateCreator } from 'zustand';
import {
  DAOKey,
  DAOSubgraph,
  DecentModule,
  GaslessVotingDaoData,
  IDAO,
  SafeWithNextNonce,
} from '../../types';
import { GlobalStore, StoreSlice } from '../store';

export type NodesSlice = {
  nodes: StoreSlice<IDAO>;
  setSafeInfo: (daoKey: DAOKey, safe: SafeWithNextNonce) => void;
  setDaoInfo: (daoKey: DAOKey, daoInfo: DAOSubgraph) => void;
  setDecentModules: (daoKey: DAOKey, modules: DecentModule[]) => void;
  setGaslessVotingDaoData: (daoKey: DAOKey, data: GaslessVotingDaoData) => void;
};

type SetState = (fn: (state: GlobalStore) => void) => void;

export const createNodesSlice: StateCreator<GlobalStore, [], [], NodesSlice> = (
  _get,
  set: SetState,
) => ({
  nodes: {},
  setSafeInfo: (daoKey, { owners, modules, guard, address, nextNonce, threshold, nonce }) => {
    set(state => {
      if (!state.nodes[daoKey]) {
        state.nodes[daoKey] = {} as IDAO;
      }
      state.nodes[daoKey].safe = {
        owners: owners.map(owner => getAddress(owner)),
        modulesAddresses: modules.map(module => getAddress(module)),
        guard: getAddress(guard),
        address: getAddress(address),
        nextNonce,
        threshold,
        nonce,
      };
    });
  },

  setDaoInfo: (daoKey, daoInfo) => {
    set(state => {
      if (!state.nodes[daoKey]) {
        state.nodes[daoKey] = {} as IDAO;
      }
      state.nodes[daoKey].subgraphInfo = daoInfo;
    });
  },

  setDecentModules: (daoKey, modules) => {
    set(state => {
      if (!state.nodes[daoKey]) {
        state.nodes[daoKey] = {} as IDAO;
      }
      state.nodes[daoKey].modules = modules;
    });
  },

  setGaslessVotingDaoData: (daoKey, data) => {
    set(state => {
      if (!state.nodes[daoKey]) {
        state.nodes[daoKey] = {} as IDAO;
      }
      state.nodes[daoKey].gaslessVotingEnabled = data.gaslessVotingEnabled;
      if (data.paymasterAddress) {
        state.nodes[daoKey].paymasterAddress = data.paymasterAddress;
      }
    });
  },
});
