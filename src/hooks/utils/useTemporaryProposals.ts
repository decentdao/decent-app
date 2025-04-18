import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useStore } from '../../providers/App/AppProvider';
import { useCurrentDAOKey } from '../DAO/useCurrentDAOKey';

export const useTemporaryProposals = () => {
  const { daoKey } = useCurrentDAOKey();
  const {
    governance: { pendingProposals },
  } = useStore({ daoKey });
  const { t } = useTranslation(['proposal']);

  useEffect(() => {
    if (pendingProposals === null || pendingProposals.length === 0) {
      return;
    }

    const toastId = toast.info(t('pendingProposalNotice'), {
      duration: Infinity,
    });

    return () => {
      toast.dismiss(toastId);
    };
  }, [t, pendingProposals]);
};
