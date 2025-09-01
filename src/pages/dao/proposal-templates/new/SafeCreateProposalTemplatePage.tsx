import * as amplitude from '@amplitude/analytics-browser';
import { Center } from '@chakra-ui/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ProposalBuilder } from '../../../../components/ProposalBuilder/ProposalBuilder';
import {
  TemplateDetails,
  TransactionsDetails,
} from '../../../../components/ProposalBuilder/ProposalDetails';
import { TEMPLATE_PROPOSAL_METADATA_TYPE_PROPS } from '../../../../components/ProposalBuilder/ProposalMetadata';
import { CreateProposalButton } from '../../../../components/ProposalBuilder/StepButtons';
import { DEFAULT_PROPOSAL } from '../../../../components/ProposalBuilder/constants';
import { BarLoader } from '../../../../components/ui/loaders/BarLoader';
import { useHeaderHeight } from '../../../../constants/common';
import { DAO_ROUTES } from '../../../../constants/routes';
import { logError } from '../../../../helpers/errorLogging';
import useCreateProposalTemplate from '../../../../hooks/DAO/proposal/useCreateProposalTemplate';
import { usePrepareProposal } from '../../../../hooks/DAO/proposal/usePrepareProposal';
import { useCurrentDAOKey } from '../../../../hooks/DAO/useCurrentDAOKey';
import { analyticsEvents } from '../../../../insights/analyticsEvents';
import { useDAOStore } from '../../../../providers/App/AppProvider';
import useIPFSClient from '../../../../providers/App/hooks/useIPFSClient';
import { useNetworkConfigStore } from '../../../../providers/NetworkConfig/useNetworkConfigStore';
import { useProposalActionsStore } from '../../../../store/actions/useProposalActionsStore';
import {
  CreateProposalForm,
  CreateProposalSteps,
  ProposalActionType,
  ProposalTemplate,
} from '../../../../types/proposalBuilder';

export function SafeCreateProposalTemplatePage() {
  useEffect(() => {
    amplitude.track(analyticsEvents.CreateProposalTemplatePageOpened);
  }, []);

  const ipfsClient = useIPFSClient();
  const { proposalMetadata, actions, getTransactions } = useProposalActionsStore();
  const [initialProposalTemplate, setInitialProposalTemplate] = useState(DEFAULT_PROPOSAL);
  const { prepareProposal } = usePrepareProposal();
  const { prepareProposalTemplateProposal } = useCreateProposalTemplate();
  const [searchParams] = useSearchParams();
  const defaultProposalTemplatesHash = useMemo(
    () => searchParams?.get('templatesHash'),
    [searchParams],
  );
  const defaultProposalTemplateIndex = useMemo(
    () => searchParams?.get('templateIndex'),
    [searchParams],
  );
  const { daoKey } = useCurrentDAOKey();
  const {
    node: { safe },
  } = useDAOStore({ daoKey });
  const { addressPrefix } = useNetworkConfigStore();
  const { t } = useTranslation('proposalTemplate');

  const isForking = defaultProposalTemplatesHash !== null && defaultProposalTemplateIndex !== null;
  useEffect(() => {
    const loadInitialTemplate = async () => {
      if (isForking) {
        try {
          const proposalTemplates = await ipfsClient.cat(defaultProposalTemplatesHash);
          const initialTemplate: ProposalTemplate = proposalTemplates[defaultProposalTemplateIndex];
          if (initialTemplate) {
            const newInitialValue = {
              ...DEFAULT_PROPOSAL,
              proposalMetadata: {
                ...DEFAULT_PROPOSAL.proposalMetadata,
                title: initialTemplate.title,
                description: initialTemplate.description || '',
              },
              transactions: initialTemplate.transactions.map(tx => ({
                ...tx,
                ethValue: {
                  value: tx.ethValue.value,
                  bigintValue:
                    tx.ethValue.bigintValue !== undefined
                      ? BigInt(tx.ethValue.bigintValue)
                      : undefined,
                },
              })),
            };
            setInitialProposalTemplate(newInitialValue);
          }
        } catch (e) {
          logError('Error while fetching initial template values', e);
        }
      }
    };
    loadInitialTemplate();
  }, [defaultProposalTemplatesHash, defaultProposalTemplateIndex, ipfsClient, isForking]);

  const formInitialValues = useMemo(
    () =>
      isForking
        ? initialProposalTemplate
        : {
            ...DEFAULT_PROPOSAL,
            proposalMetadata: proposalMetadata || DEFAULT_PROPOSAL.proposalMetadata,
            transactions: getTransactions(),
          },
    [getTransactions, initialProposalTemplate, isForking, proposalMetadata],
  );

  const prepareProposalData = useCallback(
    async (values: CreateProposalForm) => {
      let createTemplateTransactions = isForking
        ? values.transactions
        : actions
            .filter(a => a.actionType === ProposalActionType.CREATE_TEMPLATE)
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
        proposalMetadata: {
          ...values.proposalMetadata,
          title:
            t('createProposalTemplateTitlePrefix', { ns: 'proposalMetadata' }) +
            values.proposalMetadata.title,
          description:
            t('createProposalTemplateDescriptionPrefix', { ns: 'proposalMetadata' }) +
            '\n\n\n' +
            values.proposalMetadata.description,
        },
        transactions: createTemplateTransactions,
      });
    },
    [actions, isForking, prepareProposal, prepareProposalTemplateProposal, t],
  );

  const HEADER_HEIGHT = useHeaderHeight();
  const navigate = useNavigate();

  if (!safe || !safe?.address) {
    return (
      <Center minH={`calc(100vh - ${HEADER_HEIGHT})`}>
        <BarLoader />
      </Center>
    );
  }

  const pageHeaderBreadcrumbs = [
    {
      terminus: t('proposalTemplates', { ns: 'breadcrumbs' }),
      path: DAO_ROUTES.proposalTemplates.relative(addressPrefix, safe.address),
    },
    {
      terminus: t('proposalTemplateNew', { ns: 'breadcrumbs' }),
      path: '',
    },
  ];

  const pageHeaderButtonClickHandler = () => {
    navigate(DAO_ROUTES.proposalTemplates.relative(addressPrefix, safe.address));
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
      pageHeaderTitle={t('createProposalTemplate', { ns: 'proposalTemplate' })}
      pageHeaderBreadcrumbs={pageHeaderBreadcrumbs}
      pageHeaderButtonClickHandler={pageHeaderButtonClickHandler}
      proposalMetadataTypeProps={TEMPLATE_PROPOSAL_METADATA_TYPE_PROPS(t)}
      stepButtons={stepButtons}
      transactionsDetails={transactions => <TransactionsDetails transactions={transactions} />}
      templateDetails={title => <TemplateDetails title={title} />}
      streamsDetails={null}
      initialValues={formInitialValues}
      key={initialProposalTemplate.proposalMetadata.title}
      prepareProposalData={prepareProposalData}
      mainContent={() => null}
    />
  );
}
