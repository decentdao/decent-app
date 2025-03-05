import { GridItem } from '@chakra-ui/react';
import { useEffect } from 'react';
import { useAccount } from 'wagmi';
import useSnapshotProposal from '../../../hooks/DAO/loaders/snapshot/useSnapshotProposal';
import { SnapshotProposal } from '../../../types';
import { ProposalDetailsGrid } from '../../ui/containers/ProposalDetailsGrid';
import { useProposalCountdown } from '../../ui/proposal/useProposalCountdown';
import { AzoriusOrSnapshotProposalAction } from '../ProposalActions/AzoriusOrSnapshotProposalAction';
import { ProposalInfo } from '../ProposalInfo';
import { VoteContextProvider } from '../ProposalVotes/context/VoteContext';
import SnapshotProposalSummary from './SnapshotProposalSummary';
import SnapshotProposalVotes from './SnapshotProposalVotes';

interface ISnapshotProposalDetails {
  proposal: SnapshotProposal;
}

export default function SnapshotProposalDetails({ proposal }: ISnapshotProposalDetails) {
  const user = useAccount();
  useProposalCountdown(proposal);

  const { loadSnapshotProposal, extendedSnapshotProposal } = useSnapshotProposal(proposal);

  useEffect(() => {
    loadSnapshotProposal();
  }, [loadSnapshotProposal]);

  return (
    <ProposalDetailsGrid>
      <GridItem colSpan={2}>
        <ProposalInfo proposal={extendedSnapshotProposal || proposal} />
        {extendedSnapshotProposal && <SnapshotProposalVotes proposal={extendedSnapshotProposal} />}
      </GridItem>
      {extendedSnapshotProposal && (
        <GridItem>
          <SnapshotProposalSummary proposal={extendedSnapshotProposal} />
          {user.address && (
            <VoteContextProvider
              proposal={proposal}
              extendedSnapshotProposal={extendedSnapshotProposal}
            >
              <AzoriusOrSnapshotProposalAction proposal={proposal} />
            </VoteContextProvider>
          )}
        </GridItem>
      )}
    </ProposalDetailsGrid>
  );
}
