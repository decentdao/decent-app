import * as amplitude from '@amplitude/analytics-browser';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DaoCreator from '../../../components/DaoCreator';
import { DAOCreateMode } from '../../../components/DaoCreator/formComponents/EstablishEssentials';
import { DAO_ROUTES } from '../../../constants/routes';
import { useCreateSubDAOProposal } from '../../../hooks/DAO/useCreateSubDAOProposal';
import { analyticsEvents } from '../../../insights/analyticsEvents';
import { useDaoInfoStore } from '../../../store/daoInfo/useDaoInfoStore';
import { AzoriusGovernanceDAO, SafeMultisigDAO, SubDAO } from '../../../types';

export function SafeSubDaoCreatePage() {
  useEffect(() => {
    amplitude.track(analyticsEvents.SubDaoCreatePageOpened);
  }, []);

  const navigate = useNavigate();
  const [redirectPending, setRedirectPending] = useState(false);
  const { safe } = useDaoInfoStore();

  const successCallback = async (addressPrefix: string, safeAddress: string) => {
    setRedirectPending(true);
    navigate(DAO_ROUTES.dao.relative(addressPrefix, safeAddress));
  };

  const { proposeDao, pendingCreateTx } = useCreateSubDAOProposal();

  const proposeSubDAO = (
    daoData: SafeMultisigDAO | AzoriusGovernanceDAO | SubDAO,
    customNonce?: number,
  ) => {
    const subDAOData = daoData as SubDAO;
    proposeDao(
      subDAOData,
      subDAOData.customNonce || customNonce || safe?.nextNonce,
      successCallback,
    );
  };

  return (
    <DaoCreator
      isSubDAO
      pending={pendingCreateTx || redirectPending}
      deployDAO={proposeSubDAO}
      mode={DAOCreateMode.SUBDAO}
    />
  );
}
