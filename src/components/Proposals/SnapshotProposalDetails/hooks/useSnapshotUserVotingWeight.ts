import { useEffect, useState } from 'react';
import useSnapshotProposal from '../../../../hooks/DAO/loaders/useSnapshotProposal';
import { Proposal } from '../../../../types';

export default function useSnapshotUserVotingWeight({
  proposal,
}: {
  proposal: Proposal | null | undefined;
}) {
  const [votingWeight, setVotingWeight] = useState(0);
  const { loadVotingWeight } = useSnapshotProposal(proposal);

  useEffect(() => {
    async function getVotingWeight() {
      const votingWeightData = await loadVotingWeight();
      setVotingWeight(votingWeightData.votingWeight);
    }
    getVotingWeight();
  }, [loadVotingWeight]);

  return { votingWeight };
}
