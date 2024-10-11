import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet } from 'react-router-dom';
import { toast } from 'sonner';
import { useSwitchChain } from 'wagmi';
import { logError } from '../helpers/errorLogging';
import useDAOController from '../hooks/DAO/useDAOController';
import { useUpdateSafeData } from '../hooks/utils/useUpdateSafeData';
import { useFractal } from '../providers/App/AppProvider';
import { getChainIdFromPrefix } from '../utils/url';
import LoadingProblem from './LoadingProblem';

const useTemporaryProposals = () => {
  const {
    governance: { pendingProposals },
  } = useFractal();
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

export default function DAOController() {
  const { errorLoading, wrongNetwork, invalidQuery, daoAddress, urlAddressPrefix } =
    useDAOController();
  useUpdateSafeData(daoAddress);

  const { switchChainAsync } = useSwitchChain();

  const {
    node: { daoName },
  } = useFractal();

  useTemporaryProposals();

  useEffect(() => {
    async function switchChainToSafeChain() {
      if (urlAddressPrefix && wrongNetwork) {
        try {
          await switchChainAsync({ chainId: getChainIdFromPrefix(urlAddressPrefix) });
          window.location.reload();
        } catch (e) {
          logError(e);
        }
      }
    }
    switchChainToSafeChain();
  }, [wrongNetwork, switchChainAsync, urlAddressPrefix]);

  useEffect(() => {
    if (daoName) {
      document.title = `${import.meta.env.VITE_APP_NAME} | ${daoName}`;
    }

    return () => {
      document.title = import.meta.env.VITE_APP_NAME;
    };
  }, [daoName]);

  let display;

  // the order of the if blocks of these next three error states matters
  if (invalidQuery) {
    display = <LoadingProblem type="badQueryParam" />;
  } else if (wrongNetwork) {
    display = <LoadingProblem type="wrongNetwork" />;
  } else if (errorLoading) {
    display = <LoadingProblem type="invalidSafe" />;
  } else {
    display = <Outlet />;
  }

  return display;
}
