import { Box, Button } from '@chakra-ui/react';
import { Plus } from '@phosphor-icons/react';
import { Formik } from 'formik';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import useCreateProposalSchema from '../../../hooks/schemas/proposalBuilder/useCreateProposalSchema';
import { CreateProposalTransaction } from '../../../types/proposalBuilder';
import { scrollToBottom } from '../../../utils/ui';
import ProposalTransactions from '../../ProposalBuilder/ProposalTransactions';
import { DEFAULT_PROPOSAL_TRANSACTION } from '../../ProposalBuilder/constants';
import CeleryButtonWithIcon from '../utils/CeleryButtonWithIcon';
import Divider from '../utils/Divider';

export interface ProposalTransactionsFormProps {
  pendingTransaction: boolean;
  isProposalMode: boolean;
  onSubmit?: (txs: CreateProposalTransaction[]) => void;
  onClose?: () => void;
  submitButtonText?: string;
}

export function TransactionBuilderModal({
  pendingTransaction,
  isProposalMode,
  onSubmit,
  onClose,
  submitButtonText,
}: ProposalTransactionsFormProps) {
  const [expandedIndecies, setExpandedIndecies] = useState<number[]>([0]);
  const { t } = useTranslation(['proposal']);
  const { transactionValidationSchema } = useCreateProposalSchema();
  return (
    <Formik<CreateProposalTransaction[]>
      initialValues={[DEFAULT_PROPOSAL_TRANSACTION]}
      validateOnMount
      validationSchema={transactionValidationSchema}
      onSubmit={values => {
        onSubmit?.(values);
        onClose?.();
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
                  setValues([...values, DEFAULT_PROPOSAL_TRANSACTION]);
                  setExpandedIndecies([values.length]);
                  scrollToBottom(100, 'smooth');
                }}
                isDisabled={pendingTransaction}
                icon={Plus}
                text={t('labelAddTransaction')}
              />
            </Box>
            <Button
              w="full"
              isDisabled={Object.values(errors).length > 0}
              type="submit"
            >
              {submitButtonText || t('labelAddTransactionsToProposal')}
            </Button>
          </form>
        );
      }}
    </Formik>
  );
}
