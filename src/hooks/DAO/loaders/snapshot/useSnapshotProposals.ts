import { useCallback, useEffect, useMemo, useRef } from 'react';
import { createSnapshotSubgraphClient } from '../../../../graphql';
import { ProposalsQuery, ProposalsResponse } from '../../../../graphql/SnapshotQueries';
import { useFractal } from '../../../../providers/App/AppProvider';
import { FractalGovernanceAction } from '../../../../providers/App/governance/action';
import { useDaoInfoStore } from '../../../../store/daoInfo/useDaoInfoStore';
import { FractalProposalState, SnapshotProposal } from '../../../../types';

export const useSnapshotProposals = () => {
  const { action } = useFractal();
  const { subgraphInfo } = useDaoInfoStore();
  const currentSnapshotENS = useRef<string | undefined>();
  const snaphshotGraphQlClient = useMemo(() => createSnapshotSubgraphClient(), []);

  const loadSnapshotProposals = useCallback(async () => {
    if (snaphshotGraphQlClient && !!subgraphInfo) {
      const result = await snaphshotGraphQlClient
        .query<ProposalsResponse>(ProposalsQuery, { spaceIn: [subgraphInfo.daoSnapshotENS] })
        .toPromise();

      if (!result.data?.proposals) {
        return;
      }

      const proposals: SnapshotProposal[] = result.data.proposals.map(proposal => ({
        eventDate: new Date(proposal.start * 1000),
        state:
          proposal.state === 'active'
            ? FractalProposalState.ACTIVE
            : proposal.state === 'closed'
              ? FractalProposalState.CLOSED
              : FractalProposalState.PENDING,
        proposalId: proposal.id,
        snapshotProposalId: proposal.id,
        targets: [],
        title: proposal.title,
        description: proposal.body,
        startTime: proposal.start,
        endTime: proposal.end,
        author: proposal.author,
        transactionHash: '', // Required by SnapshotProposal type
      }));

      action.dispatch({
        type: FractalGovernanceAction.SET_SNAPSHOT_PROPOSALS,
        payload: proposals,
      });
    }
  }, [snaphshotGraphQlClient, subgraphInfo, action]);

  useEffect(() => {
    if (
      !subgraphInfo?.daoSnapshotENS ||
      subgraphInfo?.daoSnapshotENS === currentSnapshotENS.current
    )
      return;
    currentSnapshotENS.current = subgraphInfo.daoSnapshotENS;
    loadSnapshotProposals();
  }, [subgraphInfo?.daoSnapshotENS, loadSnapshotProposals]);
};
