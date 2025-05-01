import { useCallback } from 'react';
import { logError } from '../../../../helpers/errorLogging';
import { useDAOStore } from '../../../../providers/App/AppProvider';
import { FractalGovernanceAction } from '../../../../providers/App/governance/action';
import { useSafeAPI } from '../../../../providers/App/hooks/useSafeAPI';
import { useSafeTransactions } from '../../../utils/useSafeTransactions';
import { useCurrentDAOKey } from '../../useCurrentDAOKey';

export const useSafeMultisigProposals = () => {
  const { daoKey } = useCurrentDAOKey();
  const {
    action,
    node: { safe },
  } = useDAOStore({ daoKey });
  const safeAPI = useSafeAPI();
  const safeAddress = safe?.address;

  const { parseTransactions } = useSafeTransactions();

  const loadSafeMultisigProposals = useCallback(async () => {
    if (!safeAddress || !safeAPI) {
      return;
    }
    try {
      const multisigTransactions = await safeAPI.getMultisigTransactions(safeAddress);
      const activities = await parseTransactions(multisigTransactions);

      action.dispatch({
        type: FractalGovernanceAction.SET_PROPOSALS,
        payload: activities,
      });

      action.dispatch({
        type: FractalGovernanceAction.SET_LOADING_FIRST_PROPOSAL,
        payload: false,
      });
      action.dispatch({
        type: FractalGovernanceAction.SET_ALL_PROPOSALS_LOADED,
        payload: true,
      });
    } catch (e) {
      logError(e);
    }
  }, [safeAddress, safeAPI, parseTransactions, action]);

  return { loadSafeMultisigProposals };
};
