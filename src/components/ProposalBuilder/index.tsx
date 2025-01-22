import { Box, Flex, Grid, GridItem, Text } from '@chakra-ui/react';
import { ArrowLeft } from '@phosphor-icons/react';
import { Formik, FormikProps } from 'formik';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { DAO_ROUTES } from '../../constants/routes';
import { logError } from '../../helpers/errorLogging';
import useSubmitProposal from '../../hooks/DAO/proposal/useSubmitProposal';
import useCreateProposalSchema from '../../hooks/schemas/proposalBuilder/useCreateProposalSchema';
import { useCanUserCreateProposal } from '../../hooks/utils/useCanUserSubmitProposal';
import { useFractal } from '../../providers/App/AppProvider';
import { useNetworkConfigStore } from '../../providers/NetworkConfig/useNetworkConfigStore';
import { useProposalActionsStore } from '../../store/actions/useProposalActionsStore';
import { useDaoInfoStore } from '../../store/daoInfo/useDaoInfoStore';
import { CreateProposalSteps, ProposalExecuteData } from '../../types';
import {
  CreateProposalForm,
  CreateSablierProposalForm,
  ProposalActionType,
  ProposalBuilderMode,
} from '../../types/proposalBuilder';
import { CustomNonceInput } from '../ui/forms/CustomNonceInput';
import { AddActions } from '../ui/modals/AddActions';
import { SendAssetsData } from '../ui/modals/SendAssetsModal';
import { Crumb } from '../ui/page/Header/Breadcrumbs';
import PageHeader from '../ui/page/Header/PageHeader';
import { ProposalActionCard } from './ProposalActionCard';
import ProposalDetails, {
  StreamsDetails,
  TemplateDetails,
  TransactionsDetails,
} from './ProposalDetails';
import ProposalMetadata, { ProposalMetadataTypeProps } from './ProposalMetadata';
import StepButtons, { CreateProposalButton, NextButton, PreviousButton } from './StepButtons';

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
  mode: ProposalBuilderMode;
  pageHeaderTitle: string;
  pageHeaderBreadcrumbs: Crumb[];
  pageHeaderButtonClickHandler: () => void;
  proposalMetadataTypeProps: ProposalMetadataTypeProps;
  prevStepUrl: string;
  nextStepUrl: string;
  prepareProposalData: (values: CreateProposalForm) => Promise<ProposalExecuteData | undefined>;
  initialValues: CreateProposalForm;
  contentRoute: (
    formikProps: FormikProps<CreateProposalForm>,
    pendingCreateTx: boolean,
    nonce: number | undefined,
  ) => JSX.Element;
}

export function ProposalBuilder({
  mode,
  pageHeaderTitle,
  pageHeaderBreadcrumbs,
  pageHeaderButtonClickHandler,
  proposalMetadataTypeProps,
  prevStepUrl,
  nextStepUrl,
  initialValues,
  prepareProposalData,
  contentRoute,
}: ProposalBuilderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation(['proposalTemplate', 'proposal']);

  const paths = location.pathname.split('/');
  const step = (paths[paths.length - 1] || paths[paths.length - 2]) as
    | CreateProposalSteps
    | undefined;
  const { safe } = useDaoInfoStore();
  const safeAddress = safe?.address;

  const { addressPrefix } = useNetworkConfigStore();
  const { submitProposal, pendingCreateTx } = useSubmitProposal();
  const { canUserCreateProposal } = useCanUserCreateProposal();
  const { createProposalValidation } = useCreateProposalSchema();
  const { addAction, actions } = useProposalActionsStore();

  const handleAddSendAssetsAction = (data: SendAssetsData) => {
    addAction({
      actionType: ProposalActionType.TRANSFER,
      content: <></>,
      transactions: [
        {
          targetAddress: data.asset.tokenAddress,
          ethValue: {
            bigintValue: 0n,
            value: '0',
          },
          functionName: 'transfer',
          parameters: [
            { signature: 'address', value: data.destinationAddress },
            { signature: 'uint256', value: data.transferAmount.toString() },
          ],
        },
      ],
    });
  };

  const successCallback = () => {
    if (safeAddress) {
      // Redirecting to home page so that user will see newly created Proposal
      navigate(DAO_ROUTES.dao.relative(addressPrefix, safeAddress));
    }
  };

  useEffect(() => {
    if (safeAddress && (!step || !Object.values(CreateProposalSteps).includes(step))) {
      navigate(DAO_ROUTES.proposalNew.relative(addressPrefix, safeAddress), { replace: true });
    }
  }, [safeAddress, step, navigate, addressPrefix]);

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
                      <Routes>
                        <Route
                          path={CreateProposalSteps.METADATA}
                          element={
                            <ProposalMetadata
                              typeProps={proposalMetadataTypeProps}
                              {...formikProps}
                            />
                          }
                        />
                        {contentRoute(formikProps, pendingCreateTx, nonce)}
                        <Route
                          path="*"
                          element={
                            <Navigate
                              to={`${CreateProposalSteps.METADATA}${location.search}`}
                              replace
                            />
                          }
                        />
                      </Routes>
                    </Box>
                    {mode === ProposalBuilderMode.PROPOSAL_WITH_ACTIONS && (
                      <Flex
                        flexDirection="column"
                        gap="1.5rem"
                      >
                        <Flex
                          flexDirection="column"
                          gap="0.5rem"
                        >
                          <Flex
                            mt={6}
                            mb={2}
                            alignItems="center"
                          >
                            <Text ml={2}>{t('actions', { ns: 'actions' })}</Text>
                          </Flex>
                          {actions.map((action, index) => {
                            return (
                              <ProposalActionCard
                                key={index}
                                action={action}
                                index={index}
                                canBeDeleted={actions.length > 1}
                              />
                            );
                          })}
                        </Flex>
                        <Flex>
                          <AddActions addSendAssetsAction={handleAddSendAssetsAction} />
                        </Flex>
                      </Flex>
                    )}
                    <StepButtons
                      metadataStepButtons={(() => {
                        if (mode === ProposalBuilderMode.PROPOSAL_WITH_ACTIONS) {
                          return <CreateProposalButton isDisabled={createProposalButtonDisabled} />;
                        } else {
                          return (
                            <NextButton
                              nextStepUrl={nextStepUrl}
                              isDisabled={!!formikProps.errors.proposalMetadata}
                            />
                          );
                        }
                      })()}
                      transactionsStepButtons={
                        <>
                          <PreviousButton prevStepUrl={prevStepUrl} />
                          <CreateProposalButton isDisabled={createProposalButtonDisabled} />
                        </>
                      }
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
                    transactionsDetails={(() => {
                      if (mode !== ProposalBuilderMode.SABLIER) {
                        return <TransactionsDetails transactions={transactions} />;
                      }
                      return null;
                    })()}
                    templateDetails={(() => {
                      if (mode === ProposalBuilderMode.TEMPLATE) {
                        return <TemplateDetails title={trimmedTitle} />;
                      }
                      return null;
                    })()}
                    streamsDetails={(() => {
                      if (mode === ProposalBuilderMode.SABLIER) {
                        return (
                          <StreamsDetails
                            streams={(formikProps.values as CreateSablierProposalForm).streams}
                          />
                        );
                      }
                      return null;
                    })()}
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
