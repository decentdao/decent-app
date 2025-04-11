import { Box, Button } from '@chakra-ui/react';
import { Plus } from '@phosphor-icons/react';
import { Formik, FormikProps } from 'formik';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CreateProposalTransaction } from '../../types/proposalBuilder';
import { scrollToBottom } from '../../utils/ui';
import CeleryButtonWithIcon from '../ui/utils/CeleryButtonWithIcon';
import Divider from '../ui/utils/Divider';
import ProposalTransactions from './ProposalTransactions';
import { DEFAULT_PROPOSAL_TRANSACTION } from './constants';

export interface ProposalTransactionsFormProps {
  pendingTransaction: boolean;
  isProposalMode: boolean;
  setFieldValue: FormikProps<CreateProposalTransaction[]>['setFieldValue'];
  values: FormikProps<CreateProposalTransaction[]>['values'];
  errors?: FormikProps<CreateProposalTransaction[]>['errors']; // for validation errors
}

export default function ProposalTransactionsForm(props: ProposalTransactionsFormProps) {
  const { pendingTransaction, setFieldValue, values } = props;
  const { t } = useTranslation(['proposal']);
  const [expandedIndecies, setExpandedIndecies] = useState<number[]>([0]);

  const removeTransaction = (index: number) => {
    const allTxs = [...values];
    allTxs.splice(index, 1);
    setFieldValue('transactions', allTxs);
    setExpandedIndecies(prev => prev.filter(i => i !== index));
  };

  return (
    <Box py="1.5rem">
      <ProposalTransactions
        expandedIndecies={expandedIndecies}
        setExpandedIndecies={setExpandedIndecies}
        removeTransaction={removeTransaction}
        {...props}
      />
      <Divider my="1.5rem" />
      <CeleryButtonWithIcon
        onClick={() => {
          setFieldValue('transactions', [...values, DEFAULT_PROPOSAL_TRANSACTION]);
          setExpandedIndecies([values.length]);
          scrollToBottom(100, 'smooth');
        }}
        isDisabled={pendingTransaction}
        icon={Plus}
        text={t('labelAddTransaction')}
      />
    </Box>
  );
}

export function ProposalTransactionsFormModal({
  pendingTransaction,
  isProposalMode,
}: ProposalTransactionsFormProps) {
  const [expandedIndecies, setExpandedIndecies] = useState<number[]>([0]);
  const { t } = useTranslation(['proposal']);
  return (
    <Formik<CreateProposalTransaction[]>
      initialValues={[
        {
          targetAddress: '',
          functionName: '',
          parameters: [],
          ethValue: {
            value: '0',
          },
        },
      ]}
      onSubmit={() => {
        // @todo should dispatch an action to action store
      }}
    >
      {({ values, errors, setFieldValue, setValues, handleSubmit }) => {
        const removeTransaction = (index: number) => {
          const allTxs = [...values];
          allTxs.splice(index, 1);
          setValues(allTxs);
          setExpandedIndecies(prev => prev.filter(i => i !== index));
        };
        return (
          <form onSubmit={handleSubmit}>
            <Box py="1.5rem">
              <ProposalTransactions
                removeTransaction={removeTransaction}
                expandedIndecies={expandedIndecies}
                setExpandedIndecies={setExpandedIndecies}
                pendingTransaction={pendingTransaction}
                isProposalMode={isProposalMode}
                setFieldValue={setFieldValue}
                values={values}
                errors={errors}
              />
              <Divider my="1.5rem" />
              <CeleryButtonWithIcon
                onClick={() => {
                  console.log('values', values);
                  setValues([...values, DEFAULT_PROPOSAL_TRANSACTION]);
                  setExpandedIndecies([values.length]);
                  scrollToBottom(100, 'smooth');
                }}
                isDisabled={pendingTransaction}
                icon={Plus}
                text={t('labelAddTransaction')}
              />
            </Box>
            <Button w="full">{t('labelAddTransactionsToProposal')}</Button>
          </form>
        );
      }}
    </Formik>
  );
}
