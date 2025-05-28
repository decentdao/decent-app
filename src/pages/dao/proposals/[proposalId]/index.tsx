import * as amplitude from '@amplitude/analytics-browser';
import { Box } from '@chakra-ui/react';
import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { AzoriusProposalDetails } from '../../../../components/Proposals/AzoriusDetails';
import { MultisigProposalDetails } from '../../../../components/Proposals/MultisigProposalDetails';
import SnapshotProposalDetails from '../../../../components/Proposals/SnapshotProposalDetails';
import NoDataCard from '../../../../components/ui/containers/NoDataCard';
import { InfoBoxLoader } from '../../../../components/ui/loaders/InfoBoxLoader';
import PageHeader from '../../../../components/ui/page/Header/PageHeader';
import { DAO_ROUTES } from '../../../../constants/routes';
import useSnapshotProposal from '../../../../hooks/DAO/loaders/snapshot/useSnapshotProposal';
import { useGetMetadata } from '../../../../hooks/DAO/proposal/useGetMetadata';
import { useCurrentDAOKey } from '../../../../hooks/DAO/useCurrentDAOKey';
import { analyticsEvents } from '../../../../insights/analyticsEvents';
import { useDAOStore } from '../../../../providers/App/AppProvider';
import { useNetworkConfigStore } from '../../../../providers/NetworkConfig/useNetworkConfigStore';
import { AzoriusProposal, SnapshotProposal } from '../../../../types';

export function SafeProposalDetailsPage() {
  useEffect(() => {
    amplitude.track(analyticsEvents.ProposalDetailsPageOpened);
  }, []);

  const { t } = useTranslation(['proposal', 'navigation', 'breadcrumbs', 'dashboard']);
  const { daoKey } = useCurrentDAOKey();
  const {
    governance: { proposals, loadingProposals, allProposalsLoaded, isAzorius },
    node: { safe },
  } = useDAOStore({ daoKey });
  const { addressPrefix } = useNetworkConfigStore();
  const { proposalId } = useParams();

  // Either the proposals have not even started loading yet, or not all proposals have been loaded, so this could be one of them
  const couldStillBeLoadingTheProposal = loadingProposals || !allProposalsLoaded;

  const contextProposal = useMemo(() => {
    if (!proposals || !proposals.length || !proposalId) {
      return couldStillBeLoadingTheProposal ? undefined : null;
    }

    const foundProposal = proposals.find(p => {
      return (
        (p as SnapshotProposal).snapshotProposalId === proposalId || p.proposalId === proposalId
      );
    });

    // If the proposal is not found in the current list of loaded proposals in state, it could still be loading
    if (!foundProposal) {
      return couldStillBeLoadingTheProposal ? undefined : null;
    }

    return foundProposal;
  }, [couldStillBeLoadingTheProposal, proposalId, proposals]);

  const metaData = useGetMetadata(contextProposal);

  const { snapshotProposal } = useSnapshotProposal(contextProposal);

  if (!safe?.address) {
    return null;
  }

  return (
    <div>
      <PageHeader
        title={t('proposalOverview')}
        breadcrumbs={[
          {
            terminus: t('proposals', { ns: 'breadcrumbs' }),
            path: DAO_ROUTES.dao.relative(addressPrefix, safe.address),
          },
          {
            terminus: t('proposal', {
              ns: 'breadcrumbs',
              proposalId,
              proposalTitle: metaData.title || contextProposal?.title,
            }),
            path: '',
          },
        ]}
      />
      {contextProposal === undefined ? (
        <Box>
          <InfoBoxLoader />
        </Box>
      ) : contextProposal === null ? (
        <NoDataCard
          translationNameSpace="proposal"
          emptyText="noProposal"
        />
      ) : snapshotProposal !== null ? (
        <SnapshotProposalDetails proposal={snapshotProposal} />
      ) : isAzorius ? (
        <AzoriusProposalDetails proposal={contextProposal as AzoriusProposal} />
      ) : (
        <MultisigProposalDetails proposal={contextProposal} />
      )}
    </div>
  );
}
