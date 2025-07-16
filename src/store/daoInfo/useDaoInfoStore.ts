import { getAddress } from 'viem';
import { create } from 'zustand';
import { DAOOwnedEntities, DAOSubgraph, DecentModule, IDAO, SafeWithNextNonce } from '../../types';

export const initialDaoInfoStore: IDAO & DAOOwnedEntities = {
  safe: null,
  subgraphInfo: null,
  modules: null,
  gaslessVotingEnabled: false,
  paymasterAddress: null,
  stakingAddress: null,
  revShareWallets: [],
};

export interface DaoInfoStore extends IDAO {
  setSafeInfo: (safe: SafeWithNextNonce) => void;
  setDaoInfo: (daoInfo: DAOSubgraph) => void;
  setDecentModules: (modules: DecentModule[]) => void;
  resetDaoInfoStore: () => void;
}

export const useDaoInfoStore = create<DaoInfoStore>()(set => ({
  ...initialDaoInfoStore,
  setSafeInfo: (safe: SafeWithNextNonce) => {
    const { address, owners, nonce, nextNonce, threshold, modules, guard } = safe;
    set({
      safe: {
        owners: owners.map(owner => getAddress(owner)),
        modulesAddresses: modules.map(module => getAddress(module)),
        guard: getAddress(guard),
        address: getAddress(address),
        nextNonce,
        threshold,
        nonce,
      },
    });
  },

  // called by subgraph data flow
  setDaoInfo: (subgraphInfo: DAOSubgraph) => {
    set({ subgraphInfo });
  },

  setDecentModules: (modules: DecentModule[]) => {
    set({ modules });
  },

  resetDaoInfoStore: () => set(initialDaoInfoStore),
}));
