import { Box, Flex, Grid, GridItem } from '@chakra-ui/react';
import { ArrowLeft } from '@phosphor-icons/react';
import { Formik, FormikProps } from 'formik';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { DAO_ROUTES } from '../../constants/routes';
import useFeatureFlag from '../../helpers/environmentFeatureFlags';
import { logError } from '../../helpers/errorLogging';
import useSubmitProposal from '../../hooks/DAO/proposal/useSubmitProposal';
import { useCurrentDAOKey } from '../../hooks/DAO/useCurrentDAOKey';
import useCreateProposalSchema from '../../hooks/schemas/proposalBuilder/useCreateProposalSchema';
import { useUnsavedChangesBlocker } from '../../hooks/useUnsavedChangesBlocker';
import { useCanUserCreateProposal } from '../../hooks/utils/useCanUserSubmitProposal';
import {
  ActionsExperience,
  ActionsExperienceV1,
} from '../../pages/dao/proposals/actions/new/ActionsExperience';
import { useNetworkConfigStore } from '../../providers/NetworkConfig/useNetworkConfigStore';
import { useProposalActionsStore } from '../../store/actions/useProposalActionsStore';
import { BigIntValuePair, CreateProposalSteps, ProposalExecuteData } from '../../types';
import {
  CreateProposalForm,
  CreateProposalTransaction,
  CreateSablierProposalForm,
  Stream,
} from '../../types/proposalBuilder';
import { Crumb } from '../ui/page/Header/Breadcrumbs';
import PageHeader from '../ui/page/Header/PageHeader';
import ProposalDetails from './ProposalDetails';
import ProposalMetadata, { ProposalMetadataTypeProps } from './ProposalMetadata';
import StepButtons from './StepButtons';

interface ProposalBuilderProps {
  pageHeaderTitle: string;
  pageHeaderBreadcrumbs: Crumb[];
  pageHeaderButtonClickHandler: () => void;
  proposalMetadataTypeProps: ProposalMetadataTypeProps;
  showActionsExperience?: boolean;
  stepButtons: ({
    formErrors,
    createProposalBlocked,
    onStepChange,
  }: {
    formErrors: boolean;
    createProposalBlocked: boolean;
    onStepChange: (step: CreateProposalSteps) => void;
  }) => React.ReactNode;
  transactionsDetails:
    | ((transactions: CreateProposalTransaction<BigIntValuePair>[]) => React.ReactNode)
    | null;
  templateDetails: ((title: string) => React.ReactNode) | null;
  streamsDetails: ((streams: Stream[]) => React.ReactNode) | null;
  prepareProposalData: (values: CreateProposalForm) => Promise<ProposalExecuteData | undefined>;
  initialValues: CreateProposalForm;
  mainContent: (
    formikProps: FormikProps<CreateProposalForm>,
    pendingCreateTx: boolean,
    nonce: number | undefined,
    currentStep: CreateProposalSteps,
  ) => React.ReactNode;
}

export function ProposalBuilder({
  pageHeaderTitle,
  pageHeaderBreadcrumbs,
  pageHeaderButtonClickHandler,
  proposalMetadataTypeProps,
  showActionsExperience,
  stepButtons,
  transactionsDetails,
  templateDetails,
  streamsDetails,
  initialValues,
  prepareProposalData,
  mainContent,
}: ProposalBuilderProps) {
  const navigate = useNavigate();
  const { t } = useTranslation(['proposalTemplate', 'proposal']);
  const proposalV1FeatureEnabled = useFeatureFlag('flag_proposal_v1');
  const [currentStep, setCurrentStep] = useState<CreateProposalSteps>(CreateProposalSteps.METADATA);
  const { safeAddress } = useCurrentDAOKey();

  const { resetActions } = useProposalActionsStore();
  const { addressPrefix } = useNetworkConfigStore();
  const { submitProposal, pendingCreateTx } = useSubmitProposal();
  const { canUserCreateProposal } = useCanUserCreateProposal();
  const { createProposalValidation } = useCreateProposalSchema();

  const pushNavigation = useRef(false);

  useUnsavedChangesBlocker({
    when:
      !pushNavigation.current &&
      (initialValues.transactions.length > 0 ||
        !!initialValues.proposalMetadata.title ||
        !!initialValues.proposalMetadata.description),
    onDiscardChanges: () => {
      resetActions();
      pushNavigation.current = false;

      // Small delay to ensure that the proposal is created and actions are reset
      setTimeout(() => navigate(DAO_ROUTES.dao.relative(addressPrefix, safeAddress!)), 0);
    },
  });
  const successCallback = () => {
    if (safeAddress) {
      resetActions();
      // Redirecting to home page so that user will see newly created Proposal
      pushNavigation.current = true;
      // Small delay to ensure that the proposal is created and actions are reset
      setTimeout(() => navigate(DAO_ROUTES.dao.relative(addressPrefix, safeAddress)), 0);
    }
  };

  return (
    <Formik<CreateProposalForm>
      validationSchema={createProposalValidation}
      enableReinitialize
      initialValues={initialValues}
      onSubmit={async values => {
        if (!canUserCreateProposal) {
          toast.error(t('errorNotProposer', { ns: 'common' }));
        }

        try {
          const proposalData = await prepareProposalData(values);
          if (proposalData) {
            submitProposal({
              proposalData,
              nonce: values?.proposalMetadata?.nonce,
              pendingToastMessage: t('proposalCreatePendingToastMessage', { ns: 'proposal' }),
              successToastMessage: t('proposalCreateSuccessToastMessage', { ns: 'proposal' }),
              failedToastMessage: t('proposalCreateFailureToastMessage', { ns: 'proposal' }),
              successCallback,
            });
          }
        } catch (e) {
          logError(e);
          toast.error(t('encodingFailedMessage', { ns: 'proposal' }));
        }
      }}
    >
      {(formikProps: FormikProps<CreateProposalForm>) => {
        const {
          handleSubmit,
          values: {
            proposalMetadata: { title, description, nonce },
            transactions,
          },
          errors,
        } = formikProps;

        if (!safeAddress) {
          return;
        }

        const trimmedTitle = title.trim();
        let createProposalButtonDisabled = false;

        // check sablier streams length if details are available
        if (streamsDetails !== null) {
          if ((formikProps.values as CreateSablierProposalForm).streams?.length === 0) {
            createProposalButtonDisabled = true;
          }
        } else {
          // otherwise check transactions length
          if (transactions.length === 0) {
            createProposalButtonDisabled = true;
          }
        }
        // check form errors, title, description and pending create tx
        if (
          Object.keys(formikProps.errors).length > 0 ||
          !trimmedTitle ||
          !description ||
          pendingCreateTx
        ) {
          createProposalButtonDisabled = true;
        }

        const renderButtons = (step: CreateProposalSteps) => {
          const buttons = stepButtons({
            formErrors: !!errors.proposalMetadata,
            createProposalBlocked: createProposalButtonDisabled,
            onStepChange: setCurrentStep,
          });

          return step === CreateProposalSteps.METADATA ? buttons : null;
        };

        return (
          <form onSubmit={handleSubmit}>
            <Box>
              <PageHeader
                title={pageHeaderTitle}
                breadcrumbs={pageHeaderBreadcrumbs}
                ButtonIcon={ArrowLeft}
                buttonProps={{
                  isDisabled: pendingCreateTx,
                  variant: 'secondary',
                  onClick: pageHeaderButtonClickHandler,
                }}
              />
              <Grid
                gap={4}
                marginTop="3rem"
                templateColumns={{ base: '1fr', lg: '2fr 1fr' }}
                templateAreas={{
                  base: '"content" "details"',
                  lg: '"content details"',
                }}
              >
                <GridItem area="content">
                  <Flex
                    flexDirection="column"
                    align="left"
                  >
                    <Box
                      marginBottom="2rem"
                      rounded="lg"
                      bg="color-neutral-950"
                    >
                      {currentStep === CreateProposalSteps.METADATA ? (
                        <>
                          <ProposalMetadata
                            typeProps={proposalMetadataTypeProps}
                            {...formikProps}
                          />
                        </>
                      ) : (
                        <>{mainContent(formikProps, pendingCreateTx, nonce, currentStep)}</>
                      )}
                    </Box>
                    {showActionsExperience ? (
                      proposalV1FeatureEnabled ? (
                        <ActionsExperienceV1 />
                      ) : (
                        <ActionsExperience />
                      )
                    ) : null}
                    <StepButtons
                      renderButtons={renderButtons}
                      currentStep={currentStep}
                      onStepChange={setCurrentStep}
                      createProposalBlocked={createProposalButtonDisabled}
                    />
                  </Flex>
                </GridItem>
                <GridItem
                  area="details"
                  w="100%"
                >
                  <ProposalDetails
                    title={trimmedTitle}
                    description={description}
                    transactionsDetails={
                      transactionsDetails ? transactionsDetails(transactions) : null
                    }
                    templateDetails={templateDetails ? templateDetails(trimmedTitle) : null}
                    streamsDetails={
                      streamsDetails
                        ? streamsDetails((formikProps.values as CreateSablierProposalForm).streams)
                        : null
                    }
                  />
                </GridItem>
              </Grid>
            </Box>
          </form>
        );
      }}
    </Formik>
  );
}
