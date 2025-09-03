import * as amplitude from '@amplitude/analytics-browser';
import { Box, Flex, Grid } from '@chakra-ui/react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import BalanceCard from '../../../components/DaoStaking/BalanceCard';
import NoStakingDeployed from '../../../components/DaoStaking/NoStakingDeployed';
import RewardsCard from '../../../components/DaoStaking/RewardsCard';
import StakeCard from '../../../components/DaoStaking/StakeCard';
import { ModalType } from '../../../components/ui/modals/ModalProvider';
import { useDecentModal } from '../../../components/ui/modals/useDecentModal';
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
    governance: { stakedToken },
  } = useDAOStore({ daoKey });
  const { t } = useTranslation('staking');
  const { open: openSettingsModal } = useDecentModal(ModalType.SAFE_SETTINGS);

  return (
    <Box>
      <PageHeader
        title={t('stakingTitle')}
        breadcrumbs={[
          {
            terminus: t('staking'),
            path: '',
          },
        ]}
      />

      {!!stakedToken ? (
        <Grid
          padding="24px"
          borderRadius="12px"
          borderTop="1px solid rgba(255, 255, 255, 0.10)"
          background="color-content-content1"
          boxShadow="0px 0px 0px 1px var(--colors-color-alpha-white-950)"
          templateColumns="40% 60%"
          gap="16px"
        >
          <StakeCard />
          <Flex
            direction="column"
            gap="16px"
          >
            <RewardsCard />
            <BalanceCard />
          </Flex>
        </Grid>
      ) : (
        <NoStakingDeployed deploy={openSettingsModal} />
      )}
    </Box>
  );
}
