import * as amplitude from '@amplitude/analytics-browser';
import { Center, Flex, Text } from '@chakra-ui/react';
import { FormikErrors } from 'formik';
import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ProposalActionCard } from '../../../../../components/ProposalBuilder/ProposalActionCard';
import { ProposalBuilder } from '../../../../../components/ProposalBuilder/ProposalBuilder';
import { TransactionsDetails } from '../../../../../components/ProposalBuilder/ProposalDetails';
import { DEFAULT_PROPOSAL_METADATA_TYPE_PROPS } from '../../../../../components/ProposalBuilder/ProposalMetadata';
import ProposalTransactionsForm from '../../../../../components/ProposalBuilder/ProposalTransactionsForm';
import { GoToTransactionsStepButton } from '../../../../../components/ProposalBuilder/StepButtons';
import { DEFAULT_PROPOSAL } from '../../../../../components/ProposalBuilder/constants';
import { BarLoader } from '../../../../../components/ui/loaders/BarLoader';
import { AddActions } from '../../../../../components/ui/modals/AddActions';
import { useHeaderHeight } from '../../../../../constants/common';
import { DAO_ROUTES } from '../../../../../constants/routes';
import { usePrepareProposal } from '../../../../../hooks/DAO/proposal/usePrepareProposal';
import { useCurrentDAOKey } from '../../../../../hooks/DAO/useCurrentDAOKey';
import { analyticsEvents } from '../../../../../insights/analyticsEvents';
import { useStore } from '../../../../../providers/App/AppProvider';
import { useNetworkConfigStore } from '../../../../../providers/NetworkConfig/useNetworkConfigStore';
import { useProposalActionsStore } from '../../../../../store/actions/useProposalActionsStore';
import { useDaoInfoStore } from '../../../../../store/daoInfo/useDaoInfoStore';
import {
  BigIntValuePair,
  CreateProposalSteps,
  CreateProposalTransaction,
} from '../../../../../types';
import {
  prepareSendAssetsActionData,
  SendAssetsData,
} from '../../../../../utils/dao/prepareSendAssetsActionData';

function ActionsExperience() {
  const { t } = useTranslation('actions');
  const { actions, addAction } = useProposalActionsStore();

  const handleAddSendAssetsAction = (sendAssetsData: SendAssetsData) => {
    const { action } = prepareSendAssetsActionData(sendAssetsData);
    addAction({ ...action, content: <></> });
  };

  return (
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
  );
}

export function SafeProposalWithActionsCreatePage() {
  useEffect(() => {
    amplitude.track(analyticsEvents.SafeProposalWithActionsCreatePageOpened);
  }, []);
  const { daoKey } = useCurrentDAOKey();
  const {
    governance: { type },
  } = useStore({ daoKey });
  const { safe } = useDaoInfoStore();

  const { prepareProposal } = usePrepareProposal();
  const { getTransactions, actions } = useProposalActionsStore();
  // getTransactions function depends on actions internally
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const transactions = useMemo(() => getTransactions(), [getTransactions, actions]);
  const { addressPrefix } = useNetworkConfigStore();

  const HEADER_HEIGHT = useHeaderHeight();
  const { t } = useTranslation('proposal');
  const navigate = useNavigate();
  const { resetActions } = useProposalActionsStore();

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
      path: DAO_ROUTES.proposals.relative(addressPrefix, safe.address),
    },
    {
      terminus: t('proposalNew', { ns: 'breadcrumbs' }),
      path: '',
    },
  ];

  const pageHeaderButtonClickHandler = () => {
    resetActions();
    navigate(DAO_ROUTES.proposals.relative(addressPrefix, safe.address));
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
      initialValues={{
        ...DEFAULT_PROPOSAL,
        transactions,
        nonce: safe.nextNonce,
      }}
      pageHeaderTitle={t('createProposal', { ns: 'proposal' })}
      pageHeaderBreadcrumbs={pageHeaderBreadcrumbs}
      pageHeaderButtonClickHandler={pageHeaderButtonClickHandler}
      actionsExperience={<ActionsExperience />}
      stepButtons={stepButtons}
      transactionsDetails={_transactions => <TransactionsDetails transactions={_transactions} />}
      templateDetails={null}
      streamsDetails={null}
      proposalMetadataTypeProps={DEFAULT_PROPOSAL_METADATA_TYPE_PROPS(t)}
      prepareProposalData={prepareProposal}
      mainContent={(formikProps, pendingCreateTx, nonce, currentStep) => {
        if (currentStep !== CreateProposalSteps.TRANSACTIONS) return null;
        const { setFieldValue, errors, values } = formikProps;
        return (
          <ProposalTransactionsForm
            pendingTransaction={pendingCreateTx}
            isProposalMode={true}
            values={values.transactions}
            setFieldValue={setFieldValue}
            errors={
              errors?.transactions as FormikErrors<CreateProposalTransaction<BigIntValuePair>>[]
            }
          />
        );
      }}
    />
  );
}
