import { Box } from '@chakra-ui/react';
import { Plus } from '@phosphor-icons/react';
import { FormikProps } from 'formik';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CreateProposalForm } from '../../types/proposalBuilder';
import { scrollToBottom } from '../../utils/ui';
import CeleryButtonWithIcon from '../ui/utils/CeleryButtonWithIcon';
import Divider from '../ui/utils/Divider';
import ProposalTransactions from './ProposalTransactions';
import { DEFAULT_PROPOSAL_TRANSACTION } from './constants';

interface ProposalTransactionsFormProps extends FormikProps<CreateProposalForm> {
  pendingTransaction: boolean;
  safeNonce?: number;
  isProposalMode: boolean;
}

export default function ProposalTransactionsForm(props: ProposalTransactionsFormProps) {
  const {
    pendingTransaction,
    setFieldValue,
    values: { transactions },
    safeNonce,
  } = props;
  const { t } = useTranslation(['proposalTemplate', 'proposal', 'common']);
  const [expandedIndecies, setExpandedIndecies] = useState<number[]>([0]);

  useEffect(() => {
    if (safeNonce) {
      setFieldValue('nonce', safeNonce);
    }
  }, [safeNonce, setFieldValue]);

  return (
    <Box py="1.5rem">
      <ProposalTransactions
        expandedIndecies={expandedIndecies}
        setExpandedIndecies={setExpandedIndecies}
        {...props}
      />
      <Divider my="1.5rem" />
      <CeleryButtonWithIcon
        onClick={() => {
          setFieldValue('transactions', [...transactions, DEFAULT_PROPOSAL_TRANSACTION]);
          setExpandedIndecies([transactions.length]);
          scrollToBottom(100, 'smooth');
        }}
        isDisabled={pendingTransaction}
        icon={Plus}
        text={t('labelAddTransaction', { ns: 'proposal' })}
      />
    </Box>
  );
}
