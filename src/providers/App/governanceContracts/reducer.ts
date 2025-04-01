import { FractalGovernanceContracts } from '../../../types';
import { GovernanceContractAction, GovernanceContractActions } from './action';

export const initialGovernanceContractsState: FractalGovernanceContracts = {
  linearVotingErc721Address: undefined,
  linearVotingErc721WithHatsWhitelistingAddress: undefined,
  linearVotingErc20Address: undefined,
  linearVotingErc20WithHatsWhitelistingAddress: undefined,
  moduleAzoriusAddress: undefined,
  votesTokenAddress: undefined,
  lockReleaseAddress: undefined,
  isLoaded: false,
  strategies: [],
};

export const governanceContractsReducer = (
  state: FractalGovernanceContracts,
  action: GovernanceContractActions,
) => {
  switch (action.type) {
    case GovernanceContractAction.SET_GOVERNANCE_CONTRACT_ADDRESSES:
      return { ...action.payload, isLoaded: true };
    default:
      return state;
  }
};
