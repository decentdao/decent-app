import { useMemo } from 'react';
import useSnapshotProposal from '../../../hooks/DAO/loaders/snapshot/useSnapshotProposal';
import { AzoriusProposal, FractalProposalState, SnapshotProposal } from '../../../types';
import { useVoteContext } from '../ProposalVotes/context/VoteContext';
import { CastVote } from './CastVote';
import { Execute } from './Execute';

function ProposalActions({ proposal }: { proposal: AzoriusProposal | SnapshotProposal }) {
  switch (proposal.state) {
    case FractalProposalState.ACTIVE:
      return <CastVote proposal={proposal} />;
    case FractalProposalState.EXECUTABLE:
    case FractalProposalState.TIMELOCKED:
      return <Execute proposal={proposal} />;
    default:
      return <></>;
  }
}

export function AzoriusOrSnapshotProposalAction({
  proposal,
}: {
  proposal: AzoriusProposal | SnapshotProposal;
}) {
  const { snapshotProposal } = useSnapshotProposal(proposal);
  const { canVote } = useVoteContext();

  const isActiveProposal = useMemo(
    () => proposal.state === FractalProposalState.ACTIVE,
    [proposal.state],
  );

  const showActionButton =
    (snapshotProposal && canVote && isActiveProposal) ||
    isActiveProposal ||
    proposal.state === FractalProposalState.EXECUTABLE ||
    proposal.state === FractalProposalState.TIMELOCKABLE ||
    proposal.state === FractalProposalState.TIMELOCKED;

  if (!showActionButton) {
    return null;
  }

  if (!snapshotProposal && isActiveProposal && !canVote) return null;

  return <ProposalActions proposal={proposal} />;
}
