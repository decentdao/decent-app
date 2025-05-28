import * as amplitude from '@amplitude/analytics-browser';
import { Box } from '@chakra-ui/react';
import { X } from '@phosphor-icons/react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import DaoCreator from '../../../../components/DaoCreator';
import { DAOCreateMode } from '../../../../components/DaoCreator/formComponents/EstablishEssentials';
import NoDataCard from '../../../../components/ui/containers/NoDataCard';
import PageHeader from '../../../../components/ui/page/Header/PageHeader';
import { DAO_ROUTES } from '../../../../constants/routes';
import { useCurrentDAOKey } from '../../../../hooks/DAO/useCurrentDAOKey';
import useDeployAzorius from '../../../../hooks/DAO/useDeployAzorius';
import { analyticsEvents } from '../../../../insights/analyticsEvents';
import { useDAOStore } from '../../../../providers/App/AppProvider';
import { useNetworkConfigStore } from '../../../../providers/NetworkConfig/useNetworkConfigStore';
import {
  AzoriusERC20DAO,
  AzoriusERC721DAO,
  DAOTrigger,
  GovernanceType,
  SubDAO,
} from '../../../../types';

export function SafeEditGovernancePage() {
  useEffect(() => {
    amplitude.track(analyticsEvents.ModifyGovernancePageOpened);
  }, []);
  const { daoKey } = useCurrentDAOKey();
  const {
    governance: { type },
    node: { safe, subgraphInfo },
  } = useDAOStore({ daoKey });
  const user = useAccount();
  const { addressPrefix } = useNetworkConfigStore();
  const { t } = useTranslation(['daoEdit', 'common', 'breadcrumbs']);
  const navigate = useNavigate();
  const isMultisig = type === GovernanceType.MULTISIG;
  const isSigner = user.address && safe?.owners.includes(user.address);
  const deployAzorius = useDeployAzorius();

  const safeAddress = safe?.address;

  if (!safeAddress) {
    return null;
  }

  const handleDeployAzorius: DAOTrigger = (daoData, customNonce) => {
    const shouldSetName = daoData.daoName !== subgraphInfo?.daoName;

    // We will add a set snapshot tx, if the current safe's snapshot is different from the new one, AND
    //   EITHER:
    //      - the current snapshot is not null, OR
    //      - the current snapshot WAS indeed null (for a safe that does not already have an ENS set), but the new snapshot is not empty
    const shouldSetSnapshot =
      subgraphInfo?.daoSnapshotENS !== daoData.snapshotENS &&
      (subgraphInfo?.daoSnapshotENS !== null || daoData.snapshotENS !== '');

    deployAzorius(daoData as AzoriusERC20DAO | AzoriusERC721DAO | SubDAO, customNonce, {
      shouldSetName,
      shouldSetSnapshot,
    });
  };

  return (
    <Box>
      <PageHeader
        hasDAOLink
        ButtonIcon={X}
        buttonProps={{
          variant: 'secondary',
          onClick: () => navigate(DAO_ROUTES.dao.relative(addressPrefix, safeAddress)),
        }}
        breadcrumbs={[
          {
            terminus: t('editDAO', { ns: 'breadcrumbs' }),
            path: '',
          },
        ]}
      />
      {isMultisig && isSigner ? (
        <DaoCreator
          pending={false}
          mode={DAOCreateMode.EDIT}
          deployDAO={handleDeployAzorius}
        />
      ) : (
        <NoDataCard
          translationNameSpace="daoEdit"
          emptyText="cannotModifyGovernance"
        />
      )}
    </Box>
  );
}
