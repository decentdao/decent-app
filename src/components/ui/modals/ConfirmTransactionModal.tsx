import { Box, Button, Text } from '@chakra-ui/react';
import { Formik, FormikProps } from 'formik';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { DAO_ROUTES } from '../../../constants/routes';
import useCreateProposalSchema from '../../../hooks/schemas/proposalBuilder/useCreateProposalSchema';
import { useNetworkConfigStore } from '../../../providers/NetworkConfig/useNetworkConfigStore';
import { useProposalActionsStore } from '../../../store/actions/useProposalActionsStore';
import { useDaoInfoStore } from '../../../store/daoInfo/useDaoInfoStore';
import {
  CreateProposalActionData,
  CreateProposalForm,
  CreateProposalTransaction,
  ProposalActionType,
} from '../../../types';
import ProposalTransactionsForm from '../../ProposalBuilder/ProposalTransactionsForm';
import { DEFAULT_PROPOSAL } from '../../ProposalBuilder/constants';
import Divider from '../utils/Divider';

/**
 * Use ProposalTransactionsForm to render transactions, add them to actionsStore
 *   if confirmed by user and then navigate to proposalWithActionNew page.
 */
export function ConfirmTransactionModal({
  transactionArray,
  close,
}: {
  transactionArray: CreateProposalTransaction[];
  close: () => void;
}) {
  const { t } = useTranslation('modals');
  const { safe } = useDaoInfoStore();
  const { addressPrefix } = useNetworkConfigStore();
  const { addAction } = useProposalActionsStore();
  const navigate = useNavigate();

  const { createProposalValidation } = useCreateProposalSchema();

  return (
    <Formik<CreateProposalForm>
      validationSchema={createProposalValidation}
      initialValues={{ ...DEFAULT_PROPOSAL, transactions: transactionArray }}
      enableReinitialize
      onSubmit={async values => {
        if (!safe?.address) {
          return;
        }

        const action: CreateProposalActionData = {
          actionType: ProposalActionType.DAPP_INTERACTION,
          transactions: values.transactions,
        };
        addAction({ ...action, content: <></> });
        navigate(DAO_ROUTES.proposalWithActionsNew.relative(addressPrefix, safe.address));
      }}
    >
      {(formikProps: FormikProps<CreateProposalForm>) => {
        const createProposalButtonDisabled = Object.keys(formikProps.errors).length > 0;

        return (
          <form onSubmit={formikProps.handleSubmit}>
            <Box>
              <Box>
                <ProposalTransactionsForm
                  pendingTransaction={false}
                  isProposalMode={true}
                  {...formikProps}
                />
                <Divider marginBottom="1rem" />
                <Text marginBottom="1rem">{t('confirmAction')}</Text>
                <Button
                  width="100%"
                  onClick={close}
                  type="submit"
                  disabled={createProposalButtonDisabled}
                >
                  {t('modalContinue')}
                </Button>
                <Button
                  marginTop="0.5rem"
                  width="100%"
                  variant="tertiary"
                  onClick={close}
                >
                  {t('modalCancel')}
                </Button>
              </Box>
            </Box>
          </form>
        );
      }}
    </Formik>
  );
}
