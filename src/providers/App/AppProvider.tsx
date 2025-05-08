import { useGlobalStore } from '../../store/store';
import { DAOKey } from '../../types';

export const useDAOStore = ({ daoKey }: { daoKey: DAOKey | undefined }) => {
  const { getDaoNode, getTreasury, getGovernance, getGuard } = useGlobalStore();
  if (!daoKey) {
    throw new Error('DAO key is required to access global store');
  }
  const node = getDaoNode(daoKey);
  const treasury = getTreasury(daoKey);
  const governance = getGovernance(daoKey);
  const guard = getGuard(daoKey);
  return {
    node,
    treasury,
    governance,
    governanceContracts: {
      isLoaded: governance.isLoaded,
      strategies: governance.strategies,
      linearVotingErc20Address: governance.linearVotingErc20Address,
      linearVotingErc20WithHatsWhitelistingAddress:
        governance.linearVotingErc20WithHatsWhitelistingAddress,
      linearVotingErc721Address: governance.linearVotingErc721Address,
      linearVotingErc721WithHatsWhitelistingAddress:
        governance.linearVotingErc721WithHatsWhitelistingAddress,
      moduleAzoriusAddress: governance.moduleAzoriusAddress,
      votesTokenAddress: governance.votesTokenAddress,
      lockReleaseAddress: governance.lockReleaseAddress,
    },
    guard,
    guardContracts: {
      freezeGuardContractAddress: guard.freezeGuardContractAddress,
      freezeVotingContractAddress: guard.freezeVotingContractAddress,
      freezeGuardType: guard.freezeGuardType,
      freezeVotingType: guard.freezeVotingType,
    },
  };
};
