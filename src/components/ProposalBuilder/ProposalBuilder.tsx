import { Box, Flex, Grid, GridItem } from '@chakra-ui/react';
import { ArrowLeft } from '@phosphor-icons/react';
import { Formik, FormikProps } from 'formik';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { DAO_ROUTES } from '../../constants/routes';
import { logError } from '../../helpers/errorLogging';
import useSubmitProposal from '../../hooks/DAO/proposal/useSubmitProposal';
import useCreateProposalSchema from '../../hooks/schemas/proposalBuilder/useCreateProposalSchema';
import { useCanUserCreateProposal } from '../../hooks/utils/useCanUserSubmitProposal';
import { useFractal } from '../../providers/App/AppProvider';
import { useNetworkConfigStore } from '../../providers/NetworkConfig/useNetworkConfigStore';
import { useDaoInfoStore } from '../../store/daoInfo/useDaoInfoStore';
import { BigIntValuePair, CreateProposalSteps, ProposalExecuteData } from '../../types';
import {
  CreateProposalForm,
  CreateProposalTransaction,
  CreateSablierProposalForm,
  Stream,
} from '../../types/proposalBuilder';
import { CustomNonceInput } from '../ui/forms/CustomNonceInput';
import { Crumb } from '../ui/page/Header/Breadcrumbs';
import PageHeader from '../ui/page/Header/PageHeader';
import ProposalDetails from './ProposalDetails';
import ProposalMetadata, { ProposalMetadataTypeProps } from './ProposalMetadata';
import StepButtons from './StepButtons';

export function ShowNonceInputOnMultisig({
  nonce,
  nonceOnChange,
}: {
  nonce: number | undefined;
  nonceOnChange: (nonce?: string) => void;
}) {
  const {
    governance: { isAzorius },
  } = useFractal();

  if (isAzorius) {
    return null;
  }

  return (
    <Flex
      alignItems="center"
      justifyContent="space-between"
      marginBottom="2rem"
      rounded="lg"
      p="1.5rem"
      bg="neutral-2"
    >
      <CustomNonceInput
        nonce={nonce}
        onChange={nonceOnChange}
        align="end"
        renderTrimmed={false}
      />
    </Flex>
  );
}

interface ProposalBuilderProps {
  pageHeaderTitle: string;
  pageHeaderBreadcrumbs: Crumb[];
  pageHeaderButtonClickHandler: () => void;
  proposalMetadataTypeProps: ProposalMetadataTypeProps;
  actionsExperience: React.ReactNode | null;
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
  actionsExperience,
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
  const [currentStep, setCurrentStep] = useState<CreateProposalSteps>(CreateProposalSteps.METADATA);
  const { safe } = useDaoInfoStore();
  const safeAddress = safe?.address;

  const { addressPrefix } = useNetworkConfigStore();
  const { submitProposal, pendingCreateTx } = useSubmitProposal();
  const { canUserCreateProposal } = useCanUserCreateProposal();
  const { createProposalValidation } = useCreateProposalSchema();

  const successCallback = () => {
    if (safeAddress) {
      // Redirecting to home page so that user will see newly created Proposal
      navigate(DAO_ROUTES.dao.relative(addressPrefix, safeAddress));
    }
  };

  return (
    <Formik<CreateProposalForm>
      validationSchema={createProposalValidation}
      initialValues={initialValues}
      enableReinitialize
      onSubmit={async values => {
        if (!canUserCreateProposal) {
          toast.error(t('errorNotProposer', { ns: 'common' }));
        }

        try {
          const proposalData = await prepareProposalData(values);
          if (proposalData) {
            submitProposal({
              proposalData,
              nonce: values?.nonce,
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
            proposalMetadata: { title, description },
            transactions,
            nonce,
          },
          errors,
        } = formikProps;

        if (!safeAddress) {
          return;
        }

        const trimmedTitle = title.trim();

        const createProposalButtonDisabled =
          !canUserCreateProposal ||
          !!formikProps.errors.transactions ||
          !!formikProps.errors.nonce ||
          pendingCreateTx;

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
                      bg="neutral-2"
                    >
                      {currentStep === CreateProposalSteps.METADATA ? (
                        <ProposalMetadata
                          typeProps={proposalMetadataTypeProps}
                          {...formikProps}
                        />
                      ) : (
                        <>
                          {mainContent(formikProps, pendingCreateTx, nonce, currentStep)}
                          <ShowNonceInputOnMultisig
                            nonce={nonce}
                            nonceOnChange={newNonce => formikProps.setFieldValue('nonce', newNonce)}
                          />
                        </>
                      )}
                    </Box>
                    {actionsExperience}
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
