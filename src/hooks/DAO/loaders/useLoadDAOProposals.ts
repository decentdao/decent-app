import { useCallback } from 'react';
import useFeatureFlag from '../../../helpers/environmentFeatureFlags';
import { useDAOStore } from '../../../providers/App/AppProvider';
import { FractalGovernanceAction } from '../../../providers/App/governance/action';
import { GovernanceType } from '../../../types';
import { useUpdateTimer } from '../../utils/useUpdateTimer';
import { useCurrentDAOKey } from '../useCurrentDAOKey';
import { useAzoriusProposals } from './governance/useAzoriusProposals';
import { useSafeMultisigProposals } from './governance/useSafeMultisigProposals';

export const useLoadDAOProposals = () => {
  const { daoKey } = useCurrentDAOKey();
  const {
    governance: { type },
    action,
    node: { safe },
  } = useDAOStore({ daoKey });
  const storeFeatureEnabled = useFeatureFlag('flag_store_v2');

  const { setMethodOnInterval, clearIntervals } = useUpdateTimer(safe?.address);
  const loadAzoriusProposals = useAzoriusProposals();
  const { loadSafeMultisigProposals } = useSafeMultisigProposals();

  const loadDAOProposals = useCallback(async () => {
    if (storeFeatureEnabled) return;
    clearIntervals();
    if (type === GovernanceType.AZORIUS_ERC20 || type === GovernanceType.AZORIUS_ERC721) {
      await loadAzoriusProposals(proposal => {
        action.dispatch({
          type: FractalGovernanceAction.SET_AZORIUS_PROPOSAL,
          payload: proposal,
        });
      });
    } else if (type === GovernanceType.MULTISIG) {
      return setMethodOnInterval(loadSafeMultisigProposals);
    }
  }, [
    clearIntervals,
    type,
    loadAzoriusProposals,
    action,
    setMethodOnInterval,
    loadSafeMultisigProposals,
    storeFeatureEnabled,
  ]);

  return loadDAOProposals;
};
