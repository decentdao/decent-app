import * as amplitude from '@amplitude/analytics-browser';
import { Box, Center } from '@chakra-ui/react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { DaoHierarchyNode } from '../../../components/DaoHierarchy/DaoHierarchyNode';
import { BarLoader } from '../../../components/ui/loaders/BarLoader';
import PageHeader from '../../../components/ui/page/Header/PageHeader';
import { useHeaderHeight } from '../../../constants/common';
import { DAO_ROUTES } from '../../../constants/routes';
import { useCurrentDAOKey } from '../../../hooks/DAO/useCurrentDAOKey';
import { useCanUserCreateProposal } from '../../../hooks/utils/useCanUserSubmitProposal';
import { analyticsEvents } from '../../../insights/analyticsEvents';
import { useDAOStore } from '../../../providers/App/AppProvider';
import { useNetworkConfigStore } from '../../../providers/NetworkConfig/useNetworkConfigStore';

export function SafeHierarchyPage() {
  useEffect(() => {
    amplitude.track(analyticsEvents.HierarchyPageOpened);
  }, []);

  const { daoKey } = useCurrentDAOKey();
  const {
    node: { safe, subgraphInfo },
  } = useDAOStore({ daoKey });

  const { t } = useTranslation('breadcrumbs');

  const HEADER_HEIGHT = useHeaderHeight();
  const navigate = useNavigate();
  const { addressPrefix } = useNetworkConfigStore();

  const { canUserCreateProposal } = useCanUserCreateProposal();

  const safeAddress = safe?.address;

  if (!safeAddress || !subgraphInfo) {
    return (
      <Center minH={`calc(100vh - ${HEADER_HEIGHT})`}>
        <BarLoader />
      </Center>
    );
  }
  const { daoName, parentAddress } = subgraphInfo;

  return (
    <Box>
      <PageHeader
        title={t('headerTitle', {
          daoName,
          subject: t('nodes'),
        })}
        breadcrumbs={[
          {
            terminus: t('nodes'),
            path: '',
          },
        ]}
        buttonProps={
          canUserCreateProposal
            ? {
                children: t('optionCreateSubDAO', { ns: 'menu' }),
                onClick: () => {
                  if (safeAddress) {
                    navigate(DAO_ROUTES.newSubDao.relative(addressPrefix, safeAddress));
                  }
                },
                size: 'sm',
              }
            : undefined
        }
      />
      <DaoHierarchyNode
        safeAddress={parentAddress || safeAddress}
        depth={0}
      />
    </Box>
  );
}
