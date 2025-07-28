import * as amplitude from '@amplitude/analytics-browser';
import { Box, Divider, Flex } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import BalanceCard from '../../../components/DaoStaking/BalanceCard';
import HistoryCard from '../../../components/DaoStaking/HistoryCard';
import NoStakingDeployed from '../../../components/DaoStaking/NoStakingDeployed';
import RewardsCard from '../../../components/DaoStaking/RewardsCard';
import StakeCard from '../../../components/DaoStaking/StakeCard';
import PageHeader from '../../../components/ui/page/Header/PageHeader';
import { useCurrentDAOKey } from '../../../hooks/DAO/useCurrentDAOKey';
import { analyticsEvents } from '../../../insights/analyticsEvents';
import { useDAOStore } from '../../../providers/App/AppProvider';

export function SafeStakingPage() {
  useEffect(() => {
    amplitude.track(analyticsEvents.StakingPageOpened);
  }, []);

  const [deployed, setDeployed] = useState(false);

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

      {deployed ? (
        <Flex
          padding="24px"
          direction="column"
          alignItems="flex-start"
          gap="16px"
          alignSelf="stretch"
          borderRadius="12px"
          borderTop="1px solid rgba(255, 255, 255, 0.10)"
          background="color-content-content1"
          boxShadow="0px 0px 0px 1px var(--colors-color-alpha-white-950)"
        >
          <Flex
            direction="column"
            alignItems="flex-start"
            gap="8px"
            alignSelf="stretch"
          >
            <Flex
              alignItems="flex-start"
              gap="8px"
              alignSelf="stretch"
            >
              <StakeCard />
              <Flex
                direction="column"
                alignItems="flex-start"
                gap="8px"
                flex="1 0 0"
              >
                <BalanceCard />
                <RewardsCard />
              </Flex>
            </Flex>
          </Flex>
          <Divider color="color-layout-divider" />
          <HistoryCard />
        </Flex>
      ) : (
        <NoStakingDeployed deploy={() => setDeployed(true)} />
      )}
    </Box>
  );
}
