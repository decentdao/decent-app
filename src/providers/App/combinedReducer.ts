import { Fractal, FractalActions, StoreAction } from '../../types';
import { FractalGovernanceActions } from './governance/action';
import { governanceReducer, initialGovernanceState } from './governance/reducer';
import { GovernanceContractActions } from './governanceContracts/action';
import {
  governanceContractsReducer,
  initialGovernanceContractsState,
} from './governanceContracts/reducer';
import { FractalGuardActions } from './guard/action';
import { guardReducer, initialGuardState } from './guard/reducer';
import { GuardContractActions } from './guardContracts/action';
import { guardContractReducer, initialGuardContractsState } from './guardContracts/reducer';
import { KeyValuePairsActions } from './keyValuePairs/action';
import { initialKeyValuePairsState, keyValuePairsReducer } from './keyValuePairs/reducer';
import { NodeActions } from './node/action';
import { initialNodeState, nodeReducer } from './node/reducer';
import { RolesActions } from './roles/action';
import { initiaRolesState, rolesReducer } from './roles/reducer';
import { TreasuryActions } from './treasury/action';
import { initialTreasuryState, treasuryReducer } from './treasury/reducer';

export const initialState = {
  node: initialNodeState,
  governance: initialGovernanceState,
  treasury: initialTreasuryState,
  governanceContracts: initialGovernanceContractsState,
  guardContracts: initialGuardContractsState,
  guard: initialGuardState,
  keyValuePairs: initialKeyValuePairsState,
  roles: initiaRolesState,
  readOnly: {
    dao: null,
    user: {
      address: undefined,
      votingWeight: 0n,
    },
  },
};

export const combinedReducer = (state: Fractal, action: FractalActions) => {
  if (action.type === StoreAction.RESET) {
    return initialState;
  }

  return {
    node: nodeReducer(state.node, action as NodeActions),
    governance: governanceReducer(state.governance, action as FractalGovernanceActions),
    treasury: treasuryReducer(state.treasury, action as TreasuryActions),
    governanceContracts: governanceContractsReducer(
      state.governanceContracts,
      action as GovernanceContractActions,
    ),
    guardContracts: guardContractReducer(state.guardContracts, action as GuardContractActions),
    guard: guardReducer(state.guard, action as FractalGuardActions),
    keyValuePairs: keyValuePairsReducer(state.keyValuePairs, action as KeyValuePairsActions),
    roles: rolesReducer(state.roles, action as RolesActions),
    readOnly: state.readOnly,
  };
};
