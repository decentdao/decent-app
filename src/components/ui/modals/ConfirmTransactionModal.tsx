import { Box, Button, Text } from '@chakra-ui/react';
import { Formik, FormikErrors, FormikProps } from 'formik';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { DAO_ROUTES } from '../../../constants/routes';
import useCreateProposalSchema from '../../../hooks/schemas/proposalBuilder/useCreateProposalSchema';
import { useNetworkConfigStore } from '../../../providers/NetworkConfig/useNetworkConfigStore';
import { useProposalActionsStore } from '../../../store/actions/useProposalActionsStore';
import { useDaoInfoStore } from '../../../store/daoInfo/useDaoInfoStore';
import {
  BigIntValuePair,
  CreateProposalActionData,
  CreateProposalForm,
  CreateProposalTransaction,
  ProposalActionType,
} from '../../../types';
import ProposalTransactionsForm from '../../ProposalBuilder/ProposalTransactionsForm';
import Divider from '../utils/Divider';

/**
 * Use ProposalTransactionsForm to render transactions, add them to actionsStore
 *   if confirmed by user and then navigate to proposalWithActionNew page.
 */
export function ConfirmTransactionModal({
  appName,
  transactionArray,
  close,
}: {
  appName: string;
  transactionArray: CreateProposalTransaction[];
  close: () => void;
}) {
  const { t } = useTranslation(['modals', 'common']);
  const { safe } = useDaoInfoStore();
  const { addressPrefix } = useNetworkConfigStore();
  const { addAction } = useProposalActionsStore();
  const navigate = useNavigate();

  const { createProposalValidation } = useCreateProposalSchema();

  const dappLabel = t('dappIntegration', { appName, ns: 'common' });

  return (
    <Formik<CreateProposalForm>
      validationSchema={createProposalValidation}
      initialValues={{
        nonce: 1,
        proposalMetadata: {
          title: 'THIS IS JUST',
          description: 'FOR FORM VALIDATION',
        },
        transactions: transactionArray,
      }}
      enableReinitialize
      onSubmit={async values => {
        if (!safe?.address) {
          return;
        }

        const action: CreateProposalActionData = {
          actionType: ProposalActionType.DAPP_INTEGRATION,
          transactions: values.transactions,
        };

        addAction({
          ...action,
          content: <Text>{dappLabel}</Text>,
        });
        navigate(DAO_ROUTES.proposalWithActionsNew.relative(addressPrefix, safe.address));
        close();
      }}
    >
      {(formikProps: FormikProps<CreateProposalForm>) => {
        const createProposalButtonDisabled = Object.keys(formikProps.errors).length > 0;
        const { setFieldValue, errors, values } = formikProps;
        return (
          <form onSubmit={formikProps.handleSubmit}>
            <Box>
              <Box>
                <ProposalTransactionsForm
                  pendingTransaction={false}
                  isProposalMode={true}
                  values={values.transactions}
                  setFieldValue={setFieldValue}
                  errors={
                    errors?.transactions as FormikErrors<
                      CreateProposalTransaction<BigIntValuePair>
                    >[]
                  }
                />
                <Divider marginBottom="1rem" />
                <Text marginBottom="1rem">{t('confirmAction')}</Text>
                <Button
                  width="100%"
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
