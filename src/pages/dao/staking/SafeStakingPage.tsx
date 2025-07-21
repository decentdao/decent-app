import * as amplitude from '@amplitude/analytics-browser';
import { Box, Text } from '@chakra-ui/react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import PageHeader from '../../../components/ui/page/Header/PageHeader';
import { useCurrentDAOKey } from '../../../hooks/DAO/useCurrentDAOKey';
import { analyticsEvents } from '../../../insights/analyticsEvents';
import { useDAOStore } from '../../../providers/App/AppProvider';

export function SafeStakingPage() {
  useEffect(() => {
    amplitude.track(analyticsEvents.StakingPageOpened);
  }, []);
  const { daoKey } = useCurrentDAOKey();
  const {
    treasury: {},
    node: { subgraphInfo },
  } = useDAOStore({ daoKey });
  const { t } = useTranslation('breadcrumbs');

  return (
    <Box>
      <PageHeader
        title={t('headerTitle', {
          daoName: subgraphInfo?.daoName,
          subject: t('staking'),
        })}
        breadcrumbs={[
          {
            terminus: t('staking'),
            path: '',
          },
        ]}
      />
      <Text>WIP Staking page</Text>
    </Box>
  );
}
