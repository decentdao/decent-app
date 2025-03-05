import { Address, getAddress } from 'viem';
import { create } from 'zustand';
import { DAOSubgraph, DecentModule, IDAO, SafeWithNextNonce } from '../../types';

export const initialDaoInfoStore: IDAO = {
  safe: null,
  subgraphInfo: null,
  modules: null,
};

interface UpdateDAOInfoParams {
  daoName?: string;
  gaslessVotingEnabled?: boolean;
  gasTankAddress?: Address;
}

export interface DaoInfoStore extends IDAO {
  setSafeInfo: (safe: SafeWithNextNonce) => void;
  setDaoInfo: (daoInfo: DAOSubgraph) => void;
  setDecentModules: (modules: DecentModule[]) => void;
  updateDAOInfo: (params: UpdateDAOInfoParams) => void;
  resetDaoInfoStore: () => void;
}

export const useDaoInfoStore = create<DaoInfoStore>()(set => ({
  ...initialDaoInfoStore,
  setSafeInfo: (safe: SafeWithNextNonce) => {
    const { address, owners, nonce, nextNonce, threshold, modules, guard } = safe;
    set({
      safe: {
        owners: owners.map(getAddress),
        modulesAddresses: modules.map(getAddress),
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
  updateDAOInfo: ({ daoName, gaslessVotingEnabled, gasTankAddress }: UpdateDAOInfoParams) => {
    set(state => {
      if (!state.subgraphInfo) {
        throw new Error('Subgraph info is not set');
      }

      const updates: Partial<IDAO> = {
        subgraphInfo: {
          ...state.subgraphInfo,
          ...(daoName !== undefined && { daoName }),
          ...(gaslessVotingEnabled !== undefined && { gaslessVotingEnabled }),
          ...(gasTankAddress !== undefined && { gasTankAddress }),
        },
      };

      return updates;
    });
  },
  resetDaoInfoStore: () => set(initialDaoInfoStore),
}));
