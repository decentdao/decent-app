import * as amplitude from '@amplitude/analytics-browser';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Address } from 'viem';
import DaoCreator from '../../components/DaoCreator';
import { DAOCreateMode } from '../../components/DaoCreator/formComponents/EstablishEssentials';
import { DAO_ROUTES } from '../../constants/routes';
import { useAccountFavorites } from '../../hooks/DAO/loaders/useFavorites';
import useDeployDAO from '../../hooks/DAO/useDeployDAO';
import { analyticsEvents } from '../../insights/analyticsEvents';
import { AzoriusERC20DAO, AzoriusERC721DAO, SafeMultisigDAO } from '../../types';

export function SafeCreatePage() {
  const navigate = useNavigate();
  const { toggleFavorite } = useAccountFavorites();
  const [redirectPending, setRedirectPending] = useState(false);

  useEffect(() => {
    amplitude.track(analyticsEvents.DaoCreatePageOpened);
  }, []);

  const successCallback = useCallback(
    async (addressPrefix: string, safeAddress: Address, daoName: string) => {
      setRedirectPending(true);
      toggleFavorite(safeAddress, daoName);
      navigate(DAO_ROUTES.dao.relative(addressPrefix, safeAddress));
    },
    [toggleFavorite, navigate],
  );

  const [deploy, pending] = useDeployDAO();

  return (
    <DaoCreator
      pending={pending || redirectPending}
      deployDAO={(daoData: SafeMultisigDAO | AzoriusERC20DAO | AzoriusERC721DAO) => {
        deploy(daoData, successCallback);
      }}
      mode={DAOCreateMode.ROOTDAO}
    />
  );
}
