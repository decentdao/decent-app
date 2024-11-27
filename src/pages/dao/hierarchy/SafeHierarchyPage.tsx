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
import { useCanUserCreateProposal } from '../../../hooks/utils/useCanUserSubmitProposal';
import { analyticsEvents } from '../../../insights/analyticsEvents';
import { useNetworkConfig } from '../../../providers/NetworkConfig/NetworkConfigProvider';
import { useDaoInfoStore } from '../../../store/daoInfo/useDaoInfoStore';

export function SafeHierarchyPage() {
  useEffect(() => {
    amplitude.track(analyticsEvents.HierarchyPageOpened);
  }, []);

  const {
    safe,
    daoName,
    nodeHierarchy: { parentAddress },
    isHierarchyLoaded,
  } = useDaoInfoStore();

  const { t } = useTranslation('breadcrumbs');

  const HEADER_HEIGHT = useHeaderHeight();
  const navigate = useNavigate();
  const { addressPrefix } = useNetworkConfig();

  const { canUserCreateProposal } = useCanUserCreateProposal();

  const safeAddress = safe?.address;

  if (!safeAddress || !isHierarchyLoaded) {
    return (
      <Center minH={`calc(100vh - ${HEADER_HEIGHT})`}>
        <BarLoader />
      </Center>
    );
  }

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
