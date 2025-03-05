import * as amplitude from '@amplitude/analytics-browser';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ProposalBuilder } from '../../../../components/ProposalBuilder/ProposalBuilder';
import {
  TemplateDetails,
  TransactionsDetails,
} from '../../../../components/ProposalBuilder/ProposalDetails';
import { TEMPLATE_PROPOSAL_METADATA_TYPE_PROPS } from '../../../../components/ProposalBuilder/ProposalMetadata';
import ProposalTransactionsForm from '../../../../components/ProposalBuilder/ProposalTransactionsForm';
import { GoToTransactionsStepButton } from '../../../../components/ProposalBuilder/StepButtons';
import { DEFAULT_PROPOSAL } from '../../../../components/ProposalBuilder/constants';
import { DAO_ROUTES } from '../../../../constants/routes';
import { logError } from '../../../../helpers/errorLogging';
import useCreateProposalTemplate from '../../../../hooks/DAO/proposal/useCreateProposalTemplate';
import { analyticsEvents } from '../../../../insights/analyticsEvents';
import useIPFSClient from '../../../../providers/App/hooks/useIPFSClient';
import { useNetworkConfigStore } from '../../../../providers/NetworkConfig/useNetworkConfigStore';
import { useDaoInfoStore } from '../../../../store/daoInfo/useDaoInfoStore';
import { CreateProposalSteps, ProposalTemplate } from '../../../../types/proposalBuilder';

export function SafeCreateProposalTemplatePage() {
  useEffect(() => {
    amplitude.track(analyticsEvents.CreateProposalTemplatePageOpened);
  }, []);

  const ipfsClient = useIPFSClient();
  const [initialProposalTemplate, setInitialProposalTemplate] = useState(DEFAULT_PROPOSAL);
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
  const { safe } = useDaoInfoStore();
  const { addressPrefix } = useNetworkConfigStore();

  useEffect(() => {
    const loadInitialTemplate = async () => {
      if (defaultProposalTemplatesHash && defaultProposalTemplateIndex) {
        try {
          const proposalTemplates = await ipfsClient.cat(defaultProposalTemplatesHash);
          const initialTemplate: ProposalTemplate = proposalTemplates[defaultProposalTemplateIndex];
          if (initialTemplate) {
            const newInitialValue = {
              nonce: undefined,
              proposalMetadata: {
                title: initialTemplate.title,
                description: initialTemplate.description || '',
              },
              transactions: initialTemplate.transactions.map(tx => ({
                ...tx,
                ethValue: {
                  value: tx.ethValue.value,
                  bigintValue: tx.ethValue.value !== '' ? BigInt(tx.ethValue.value) : undefined,
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
  }, [defaultProposalTemplatesHash, defaultProposalTemplateIndex, ipfsClient]);

  const { t } = useTranslation('proposalTemplate');
  const navigate = useNavigate();

  const pageHeaderBreadcrumbs = [
    {
      terminus: t('proposalTemplates', { ns: 'breadcrumbs' }),
      path: DAO_ROUTES.proposalTemplates.relative(addressPrefix, safe?.address ?? ''),
    },
    {
      terminus: t('proposalTemplateNew', { ns: 'breadcrumbs' }),
      path: '',
    },
  ];

  const pageHeaderButtonClickHandler = () => {
    navigate(DAO_ROUTES.proposalTemplates.relative(addressPrefix, safe?.address ?? ''));
  };

  const stepButtons = ({
    formErrors,
    onStepChange,
  }: {
    formErrors: boolean;
    createProposalBlocked: boolean;
    onStepChange: (step: CreateProposalSteps) => void;
  }) => (
    <GoToTransactionsStepButton
      isDisabled={formErrors}
      onStepChange={onStepChange}
    />
  );

  return (
    <ProposalBuilder
      pageHeaderTitle={t('createProposalTemplate', { ns: 'proposalTemplate' })}
      pageHeaderBreadcrumbs={pageHeaderBreadcrumbs}
      pageHeaderButtonClickHandler={pageHeaderButtonClickHandler}
      proposalMetadataTypeProps={TEMPLATE_PROPOSAL_METADATA_TYPE_PROPS(t)}
      actionsExperience={null}
      stepButtons={stepButtons}
      transactionsDetails={transactions => <TransactionsDetails transactions={transactions} />}
      templateDetails={title => <TemplateDetails title={title} />}
      streamsDetails={null}
      initialValues={initialProposalTemplate}
      prepareProposalData={prepareProposalTemplateProposal}
      mainContent={(formikProps, pendingCreateTx, nonce, currentStep) => {
        if (currentStep !== CreateProposalSteps.TRANSACTIONS) return null;
        return (
          <ProposalTransactionsForm
            pendingTransaction={pendingCreateTx}
            safeNonce={safe?.nextNonce}
            isProposalMode={true}
            {...formikProps}
          />
        );
      }}
    />
  );
}
