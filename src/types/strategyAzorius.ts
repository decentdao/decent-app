import {
  Azorius,
  LinearERC20Voting,
  AzoriusFreezeGuard,
  VotesERC20,
  ERC20Claim,
  LinearERC721Voting,
} from '@fractal-framework/fractal-contracts';

export interface AzoriusContracts {
  fractalAzoriusMasterCopyContract: Azorius;
  linearVotingMasterCopyContract: LinearERC20Voting;
  linearVotingERC721MasterCopyContract: LinearERC721Voting;
  azoriusFreezeGuardMasterCopyContract: AzoriusFreezeGuard;
  votesTokenMasterCopyContract: VotesERC20;
  claimingMasterCopyContract: ERC20Claim;
}
