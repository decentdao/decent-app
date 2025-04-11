import { Context, createContext, ReactNode, useContext, useMemo, useReducer } from 'react';
import useFeatureFlag from '../../helpers/environmentFeatureFlags';
import { useDaoInfoStore } from '../../store/daoInfo/useDaoInfoStore';
import { DAOKey, FractalStore, StoreAction } from '../../types';
import { combinedReducer, initialState } from './combinedReducer';
export const FractalContext = createContext<FractalStore | null>(null);

export const useFractal = ({ daoKey }: { daoKey: DAOKey | undefined }): FractalStore => {
  const storeFeatureEnabled = useFeatureFlag('flag_store_v2');
  const context = useContext(FractalContext as Context<FractalStore>);
  if (storeFeatureEnabled) {
    if (!daoKey) {
      throw new Error('DAO key is required to access the Fractal store');
    }
    // Returning complete data from Zustand store will be handled in future tickets under following project:
    // https://linear.app/decent-labs/project/architecture-zustand-dao-addresses-as-keys-809cf9fe41b0
    return context;
  } else {
    return context;
  }
};

export function AppProvider({ children }: { children: ReactNode }) {
  // Replace individual useReducer calls with a single combined reducer
  const [state, dispatch] = useReducer(combinedReducer, initialState);
  // memoize fractal store
  const nodeStore = useDaoInfoStore();

  const fractalStore = useMemo(() => {
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

  return <FractalContext.Provider value={fractalStore}>{children}</FractalContext.Provider>;
}
