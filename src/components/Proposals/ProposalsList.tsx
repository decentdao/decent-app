import { Box, Flex } from '@chakra-ui/react';
import { CONTENT_MAXW } from '../../constants/common';
import { useCurrentDAOKey } from '../../hooks/DAO/useCurrentDAOKey';
import { useDAOStore } from '../../providers/App/AppProvider';
import { FractalProposal } from '../../types';
import NoDataCard from '../ui/containers/NoDataCard';
import { InfoBoxLoader } from '../ui/loaders/InfoBoxLoader';
import ProposalCard from './ProposalCard/ProposalCard';

interface ProposalsListProps {
  proposals: FractalProposal[];
  currentPage: number;
  totalPages: number;
}

export function ProposalsList({ proposals, currentPage, totalPages }: ProposalsListProps) {
  const { daoKey } = useCurrentDAOKey();
  const {
    governance: { type, loadingProposals, allProposalsLoaded },
  } = useDAOStore({ daoKey });

  const showLoadingMore = currentPage === totalPages && !allProposalsLoaded;

  return (
    <Flex
      flexDirection="column"
      gap="1rem"
      maxW={CONTENT_MAXW}
    >
      {!type || loadingProposals ? (
        <Box mt={7}>
          <InfoBoxLoader />
        </Box>
      ) : proposals.length > 0 ? (
        <>
          {proposals.map(proposal => (
            <ProposalCard
              key={proposal.proposalId}
              proposal={proposal}
            />
          ))}
          {showLoadingMore && <InfoBoxLoader />}
        </>
      ) : (
        <NoDataCard
          emptyText="emptyProposals"
          emptyTextNotProposer="emptyProposalsNotProposer"
          translationNameSpace="proposal"
        />
      )}
    </Flex>
  );
}
