import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { LockRelease } from '../../assets/typechain-types/dcnt';
import { useTransaction } from '../utils/useTransaction';

const useDelegateVote = () => {
  const [contractCallDelegateVote, contractCallPending] = useTransaction();

  const { t } = useTranslation('transaction');

  const delegateVote = useCallback(
    ({
      delegatee,
      votingTokenContract,
      successCallback,
    }: {
      delegatee: string;
      votingTokenContract: LockRelease;
      successCallback?: () => void;
    }) => {
      contractCallDelegateVote({
        contractFn: () => votingTokenContract.delegate(delegatee),
        pendingMessage: t('pendingDelegateVote'),
        failedMessage: t('failedDelegateVote'),
        successMessage: t('successDelegateVote'),
        successCallback,
      });
    },
    [contractCallDelegateVote, t],
  );

  return { delegateVote, contractCallPending };
};

export default useDelegateVote;
