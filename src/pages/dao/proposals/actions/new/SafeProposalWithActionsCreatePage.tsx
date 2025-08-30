import * as amplitude from '@amplitude/analytics-browser';
import { Center } from '@chakra-ui/react';
import { useEffect, useMemo, useState } from 'react';
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
import useCreateProposalTemplate from '../../../../../hooks/DAO/proposal/useCreateProposalTemplate';
import { usePrepareProposal } from '../../../../../hooks/DAO/proposal/usePrepareProposal';
import { useCurrentDAOKey } from '../../../../../hooks/DAO/useCurrentDAOKey';
import { analyticsEvents } from '../../../../../insights/analyticsEvents';
import { useDAOStore } from '../../../../../providers/App/AppProvider';
import { useNetworkConfigStore } from '../../../../../providers/NetworkConfig/useNetworkConfigStore';
import { useProposalActionsStore } from '../../../../../store/actions/useProposalActionsStore';
import {
  CreateProposalForm,
  CreateProposalSteps,
  CreateProposalTransaction,
  ProposalActionType,
} from '../../../../../types';

export function SafeProposalWithActionsCreatePage() {
  useEffect(() => {
    amplitude.track(analyticsEvents.SafeProposalWithActionsCreatePageOpened);
  }, []);
  const { daoKey } = useCurrentDAOKey();
  const {
    governance: { type },
    node: { safe },
  } = useDAOStore({ daoKey });

  const { prepareProposal } = usePrepareProposal();
  const { prepareProposalTemplateProposal } = useCreateProposalTemplate();
  const { getTransactions, actions, proposalMetadata } = useProposalActionsStore();

  const prepareProposalData = async (values: CreateProposalForm) => {
    let createTemplateTransactions = actions
      .filter(a => a.actionType === ProposalActionType.CREATE_TEMPLATE)
      .flatMap(a => a.transactions);
    const otherTransactions = actions
      .filter(a => a.actionType !== ProposalActionType.CREATE_TEMPLATE)
      .flatMap(a => a.transactions);

    if (createTemplateTransactions.length > 0) {
      const txn = await prepareProposalTemplateProposal({
        proposalMetadata: values.proposalMetadata,
        transactions: createTemplateTransactions,
      });
      if (txn) {
        createTemplateTransactions = [txn];
      }
    }
    return prepareProposal({
      ...values,
      transactions: otherTransactions.concat(createTemplateTransactions),
    });
  };

  const [transactions, setTransactions] = useState<CreateProposalTransaction[]>([]);
  useEffect(() => {
    const txs = getTransactions();
    setTransactions(txs);
  }, [getTransactions, actions, safe]);

  const defaultProposalValues = useMemo(
    () =>
      proposalMetadata?.title || proposalMetadata?.description || proposalMetadata?.documentationUrl
        ? {
            ...DEFAULT_PROPOSAL,
            proposalMetadata: {
              nonce: safe?.nextNonce,
              title: proposalMetadata.title,
              description: proposalMetadata.description,
              documentationUrl: proposalMetadata.documentationUrl,
            },
          }
        : {
            ...DEFAULT_PROPOSAL,
            proposalMetadata: {
              ...DEFAULT_PROPOSAL.proposalMetadata,
              nonce: safe?.nextNonce,
            },
          },
    [
      proposalMetadata?.title,
      proposalMetadata?.description,
      proposalMetadata?.documentationUrl,
      safe?.nextNonce,
    ],
  );

  const { addressPrefix } = useNetworkConfigStore();

  const HEADER_HEIGHT = useHeaderHeight();
  const { t } = useTranslation('proposal');
  const navigate = useNavigate();

  const formInitialValues = useMemo(
    () => ({
      ...defaultProposalValues,
      transactions,
    }),
    [defaultProposalValues, transactions],
  );

  // Load potential forked template params
  // const [searchParams] = useSearchParams();
  // const defaultProposalTemplatesHash = useMemo(
  //   () => searchParams?.get('templatesHash'),
  //   [searchParams],
  // );
  // const defaultProposalTemplateIndex = useMemo(
  //   () => searchParams?.get('templateIndex'),
  //   [searchParams],
  // );

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
      initialValues={formInitialValues}
      pageHeaderTitle={t('createProposal', { ns: 'proposal' })}
      pageHeaderBreadcrumbs={pageHeaderBreadcrumbs}
      pageHeaderButtonClickHandler={pageHeaderButtonClickHandler}
      stepButtons={stepButtons}
      transactionsDetails={_transactions => <TransactionsDetails transactions={_transactions} />}
      templateDetails={null}
      streamsDetails={null}
      proposalMetadataTypeProps={DEFAULT_PROPOSAL_METADATA_TYPE_PROPS(t)}
      prepareProposalData={prepareProposalData}
      mainContent={() => null}
      showActionsExperience
    />
  );
}
