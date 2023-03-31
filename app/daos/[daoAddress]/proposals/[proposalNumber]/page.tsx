'use client';

import { Box } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MultisigProposalDetails } from '../../../../../src/components/Proposals/MultisigProposalDetails';
import { UsulProposalDetails } from '../../../../../src/components/Proposals/UsulDetails';
import { EmptyBox } from '../../../../../src/components/ui/containers/EmptyBox';
import { InfoBoxLoader } from '../../../../../src/components/ui/loaders/InfoBoxLoader';
import PageHeader from '../../../../../src/components/ui/page/Header/PageHeader';
import { DAO_ROUTES } from '../../../../../src/constants/routes';
import { useFractal } from '../../../../../src/providers/App/AppProvider';
import { FractalProposal, UsulProposal } from '../../../../../src/types';

export default function ProposalDetailsPage({
  params: { proposalNumber },
}: {
  params: { proposalNumber: string };
}) {
  const {
    node: { daoAddress },
    governance: { proposals },
  } = useFractal();

  const [proposal, setProposal] = useState<FractalProposal | null>();
  const { t } = useTranslation(['proposal', 'navigation', 'breadcrumbs', 'dashboard']);

  const usulProposal = proposal as UsulProposal;

  const transactionDescription = t('proposalDescription', {
    ns: 'dashboard',
    count: proposal?.targets.length,
  });

  useEffect(() => {
    if (!proposals || !proposals.length || !proposalNumber) {
      setProposal(undefined);
      return;
    }

    const foundProposal = proposals.find(p => {
      return p.proposalNumber === proposalNumber;
    });
    if (!foundProposal) {
      setProposal(null);
      return;
    }
    setProposal(foundProposal);
  }, [proposals, proposalNumber]);

  return (
    <Box>
      <PageHeader
        breadcrumbs={[
          {
            title: t('proposals', { ns: 'breadcrumbs' }),
            path: DAO_ROUTES.proposals.relative(daoAddress),
          },
          {
            title: t('proposal', {
              ns: 'breadcrumbs',
              proposalNumber,
              proposalTitle: proposal?.metaData?.title || transactionDescription,
            }),
            path: '',
          },
        ]}
      />
      {proposal === undefined ? (
        <Box mt={7}>
          <InfoBoxLoader />
        </Box>
      ) : proposal === null ? (
        <EmptyBox
          emptyText={t('noProposal')}
          m="2rem 0 0 0"
        />
      ) : usulProposal.govTokenAddress ? (
        <UsulProposalDetails proposal={usulProposal} />
      ) : (
        <MultisigProposalDetails proposal={proposal} />
      )}
    </Box>
  );
}
