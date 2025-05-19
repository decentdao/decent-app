import * as amplitude from '@amplitude/analytics-browser';
import { Center } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ProposalBuilder } from '../../../../../components/ProposalBuilder/ProposalBuilder';
import { TransactionsDetails } from '../../../../../components/ProposalBuilder/ProposalDetails';
import { DEFAULT_PROPOSAL_METADATA_TYPE_PROPS } from '../../../../../components/ProposalBuilder/ProposalMetadata';
import { CreateProposalButton } from '../../../../../components/ProposalBuilder/StepButtons';
import { DEFAULT_PROPOSAL } from '../../../../../components/ProposalBuilder/constants';
import { BarLoader } from '../../../../../components/ui/loaders/BarLoader';
import { useHeaderHeight } from '../../../../../constants/common';
import { DAO_ROUTES } from '../../../../../constants/routes';
import { usePrepareProposal } from '../../../../../hooks/DAO/proposal/usePrepareProposal';
import { useCurrentDAOKey } from '../../../../../hooks/DAO/useCurrentDAOKey';
import { analyticsEvents } from '../../../../../insights/analyticsEvents';
import { useStore } from '../../../../../providers/App/AppProvider';
import { useNetworkConfigStore } from '../../../../../providers/NetworkConfig/useNetworkConfigStore';
import { useProposalActionsStore } from '../../../../../store/actions/useProposalActionsStore';
import { CreateProposalSteps, CreateProposalTransaction } from '../../../../../types';

export function SafeProposalWithActionsCreatePage() {
  useEffect(() => {
    amplitude.track(analyticsEvents.SafeProposalWithActionsCreatePageOpened);
  }, []);
  const { daoKey } = useCurrentDAOKey();
  const {
    governance: { type },
    node: { safe },
  } = useStore({ daoKey });

  const { prepareProposal } = usePrepareProposal();
  const { getTransactions, actions, proposalMetadata } = useProposalActionsStore();

  const [transactions, setTransactions] = useState<CreateProposalTransaction[]>([]);
  useEffect(() => setTransactions(getTransactions()), [getTransactions, actions]);

  const defaultProposalValues = proposalMetadata
    ? {
        ...DEFAULT_PROPOSAL,
        proposalMetadata,
      }
    : DEFAULT_PROPOSAL;

  const { addressPrefix } = useNetworkConfigStore();

  const HEADER_HEIGHT = useHeaderHeight();
  const { t } = useTranslation('proposal');
  const navigate = useNavigate();

  if (!type || !safe?.address || !safe) {
    return (
      <Center minH={`calc(100vh - ${HEADER_HEIGHT})`}>
        <BarLoader />
      </Center>
    );
  }

  const pageHeaderBreadcrumbs = [
    {
      terminus: t('proposals', { ns: 'breadcrumbs' }),
      path: DAO_ROUTES.dao.relative(addressPrefix, safe.address),
    },
    {
      terminus: t('proposalNew', { ns: 'breadcrumbs' }),
      path: '',
    },
  ];

  const pageHeaderButtonClickHandler = () => {
    navigate(DAO_ROUTES.dao.relative(addressPrefix, safe.address));
  };

  const stepButtons = ({
    createProposalBlocked,
  }: {
    formErrors: boolean;
    createProposalBlocked: boolean;
    onStepChange: (step: CreateProposalSteps) => void;
  }) => <CreateProposalButton isDisabled={createProposalBlocked} />;

  return (
    <ProposalBuilder
      initialValues={{
        ...defaultProposalValues,
        transactions,
        nonce: safe.nextNonce,
      }}
      pageHeaderTitle={t('createProposal', { ns: 'proposal' })}
      pageHeaderBreadcrumbs={pageHeaderBreadcrumbs}
      pageHeaderButtonClickHandler={pageHeaderButtonClickHandler}
      stepButtons={stepButtons}
      transactionsDetails={_transactions => <TransactionsDetails transactions={_transactions} />}
      templateDetails={null}
      streamsDetails={null}
      proposalMetadataTypeProps={DEFAULT_PROPOSAL_METADATA_TYPE_PROPS(t)}
      prepareProposalData={prepareProposal}
      mainContent={() => null}
      showActionsExperience
    />
  );
}
