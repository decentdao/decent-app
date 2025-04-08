import { Context, createContext, ReactNode, useContext, useMemo, useReducer } from 'react';
import { useDaoInfoStore } from '../../store/daoInfo/useDaoInfoStore';
import { DAOKey, DecentStore, StoreAction } from '../../types';
import { combinedReducer, initialState } from './combinedReducer';

export const DecentContext = createContext<DecentStore | null>(null);

interface IUseStoreOptions {
  daoKey: DAOKey | undefined;
}
export const useDecentStore = ({ daoKey }: IUseStoreOptions): DecentStore => {
  const context = useContext(DecentContext as Context<DecentStore>);
  if (!daoKey) {
    // TODO: remove this once all the code is migrated to Zustand
    console.warn('DAO key is required to access the Fractal store');
  }
  return context;
};

export function AppProvider({ children }: { children: ReactNode }) {
  // Replace individual useReducer calls with a single combined reducer
  const [state, dispatch] = useReducer(combinedReducer, initialState);
  // memoize fractal store
  const nodeStore = useDaoInfoStore();

  const decentStore = useMemo(() => {
    return {
      node: nodeStore,
      guard: state.guard,
      governance: state.governance,
      treasury: state.treasury,
      governanceContracts: state.governanceContracts,
      guardContracts: state.guardContracts,
      action: {
        dispatch,
        resetSafeState: async () => {
          nodeStore.resetDaoInfoStore();
          await Promise.resolve(dispatch({ type: StoreAction.RESET }));
        },
      },
    };
  }, [
    nodeStore,
    state.guard,
    state.governance,
    state.treasury,
    state.governanceContracts,
    state.guardContracts,
  ]);

  return <DecentContext.Provider value={decentStore}>{children}</DecentContext.Provider>;
}
