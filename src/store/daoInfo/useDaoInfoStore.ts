import { Address, getAddress } from 'viem';
import { create } from 'zustand';
import { DAOSubgraph, DecentModule, IDAO, SafeWithNextNonce } from '../../types';

export const initialDaoInfoStore: IDAO = {
  safe: null,
  subgraphInfo: null,
  modules: null,
  gaslessVotingEnabled: false,
  paymasterAddress: undefined,
};

interface UpdateDAOInfoParams {
  daoName?: string;
  gasTankAddress?: Address;
}

interface GaslessVotingDaoData {
  gaslessVotingEnabled: boolean;
  paymasterAddress: Address | null;
}

export interface DaoInfoStore extends IDAO {
  setSafeInfo: (safe: SafeWithNextNonce) => void;
  setDaoInfo: (daoInfo: DAOSubgraph) => void;
  setDecentModules: (modules: DecentModule[]) => void;
  updateDAOInfo: (params: UpdateDAOInfoParams) => void;
  resetDaoInfoStore: () => void;
  setGaslessVotingDaoData: (gaslessVotingDaoData: GaslessVotingDaoData) => void;
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
  updateDAOInfo: ({ daoName, gasTankAddress }: UpdateDAOInfoParams) => {
    set(state => {
      if (!state.subgraphInfo) {
        throw new Error('Subgraph info is not set');
      }

      const updates: Partial<IDAO> = {
        subgraphInfo: {
          ...state.subgraphInfo,
          ...(daoName !== undefined && { daoName }),
          ...(gasTankAddress !== undefined && { gasTankAddress }),
        },
      };

      return updates;
    });
  },
  resetDaoInfoStore: () => set(initialDaoInfoStore),
  setGaslessVotingDaoData: (gaslessVotingDaoData: GaslessVotingDaoData) => {
    set(state => ({
      ...state,
      ...gaslessVotingDaoData,
    }));
  },
}));
