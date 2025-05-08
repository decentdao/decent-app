import { useMemo } from 'react';
import useSnapshotProposal from '../../../hooks/DAO/loaders/useSnapshotProposal';
import { AzoriusProposal, ProposalState, SnapshotProposal } from '../../../types';
import { useVoteContext } from '../ProposalVotes/context/VoteContext';
import { CastVote } from './CastVote';
import { Execute } from './Execute';

function ProposalActions({ proposal }: { proposal: AzoriusProposal | SnapshotProposal }) {
  switch (proposal.state) {
    case ProposalState.ACTIVE:
      return <CastVote proposal={proposal} />;
    case ProposalState.EXECUTABLE:
    case ProposalState.TIMELOCKED:
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

  const isActiveProposal = useMemo(() => proposal.state === ProposalState.ACTIVE, [proposal.state]);

  const showActionButton =
    (snapshotProposal && canVote && isActiveProposal) ||
    isActiveProposal ||
    proposal.state === ProposalState.EXECUTABLE ||
    proposal.state === ProposalState.TIMELOCKABLE ||
    proposal.state === ProposalState.TIMELOCKED;

  if (!showActionButton) {
    return null;
  }

  if (!snapshotProposal && isActiveProposal && !canVote) return null;

  return <ProposalActions proposal={proposal} />;
}
