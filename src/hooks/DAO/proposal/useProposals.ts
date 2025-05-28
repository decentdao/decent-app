import { useCallback, useMemo } from 'react';
import { useDAOStore } from '../../../providers/App/AppProvider';
import { FractalProposalState, MultisigProposal, SortBy } from '../../../types';
import { useCurrentDAOKey } from '../useCurrentDAOKey';

export function useProposalsSortedAndFiltered({
  sortBy,
  filters,
}: {
  sortBy: SortBy;
  filters: FractalProposalState[];
}) {
  const { daoKey } = useCurrentDAOKey();
  const {
    governance: { proposals },
  } = useDAOStore({ daoKey });

  const getProposalsTotal = useCallback(
    (state: FractalProposalState) => {
      if (proposals && proposals.length) {
        return proposals.filter(proposal => proposal.state === state).length;
      }
    },
    [proposals],
  );

  const sortedAndFilteredProposals = useMemo(() => {
    return [...(proposals || [])]
      .filter(
        proposal =>
          filters.includes(proposal.state!) &&
          // filters out "rejection" multisig proposals
          !(proposal as MultisigProposal)?.isMultisigRejectionTx,
      )
      .sort((a, b) => {
        const dataA = new Date(a.eventDate).getTime();
        const dataB = new Date(b.eventDate).getTime();
        if (sortBy === SortBy.Oldest) {
          return dataA - dataB;
        }
        return dataB - dataA;
      });
  }, [sortBy, filters, proposals]);

  return {
    proposals: sortedAndFilteredProposals,
    getProposalsTotal,
  };
}
