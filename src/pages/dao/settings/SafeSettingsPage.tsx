import { Flex, useBreakpointValue } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { Outlet, useLocation } from 'react-router-dom';
import SettingsNavigation from '../../../components/SafeSettings/SettingsNavigation';
import PageHeader from '../../../components/ui/page/Header/PageHeader';
import { useCurrentDAOKey } from '../../../hooks/DAO/useCurrentDAOKey';
import { useStore } from '../../../providers/App/AppProvider';

export function SafeSettingsPage() {
  const { t } = useTranslation(['settings']);
  const { daoKey } = useCurrentDAOKey();
  const {
    node: { subgraphInfo },
  } = useStore({ daoKey });
  const location = useLocation();
  const paths = location.pathname.split('/');
  const isMobile = useBreakpointValue({ base: true, md: false });
  const isIndexSettingsPage = paths.length === 2;

  return (
    <>
      {(!isMobile || isIndexSettingsPage) && (
        <PageHeader
          breadcrumbs={[
            {
              terminus: t('settings', { ns: 'breadcrumbs' }),
              path: '',
            },
          ]}
          title={t('settingsPageTitle', { daoName: subgraphInfo?.daoName })}
        />
      )}
      <Flex flexDirection={{ base: 'column', md: 'row' }}>
        {(!isMobile || isIndexSettingsPage) && <SettingsNavigation />}
        {(!isMobile || (isMobile && !isIndexSettingsPage)) && <Outlet />}
      </Flex>
    </>
  );
}
