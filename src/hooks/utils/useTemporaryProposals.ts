import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

export const useTemporaryProposals = () => {
  const {
    governance: { pendingProposals },
  } = useDecentStore({ daoKey });
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
