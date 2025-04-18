import * as amplitude from '@amplitude/analytics-browser';
import { Box, Flex } from '@chakra-ui/react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import DappCard from '../../../components/ProposalDapps/DappCard';
import NoDataCard from '../../../components/ui/containers/NoDataCard';
import { InfoBoxLoader } from '../../../components/ui/loaders/InfoBoxLoader';
import PageHeader from '../../../components/ui/page/Header/PageHeader';
import { useSupportedDapps } from '../../../hooks/DAO/loaders/useSupportedDapps';
import { analyticsEvents } from '../../../insights/analyticsEvents';
import { useNetworkConfigStore } from '../../../providers/NetworkConfig/useNetworkConfigStore';
import { useDaoInfoStore } from '../../../store/daoInfo/useDaoInfoStore';

export function SafeProposalDappsPage() {
  useEffect(() => {
    amplitude.track(analyticsEvents.ProposalDappsPageOpened);
  }, []);

  const { t } = useTranslation('breadcrumbs');
  const { chain } = useNetworkConfigStore();
  const { safe } = useDaoInfoStore();
  const { dapps } = useSupportedDapps(chain.id);

  const safeAddress = safe?.address;
  const loading = !dapps || !safeAddress;

  return (
    <div>
      <PageHeader
        title={t('proposalDapps')}
        breadcrumbs={[
          {
            terminus: t('proposalDapps'),
            path: '',
          },
        ]}
      ></PageHeader>
      <Flex
        flexDirection={!loading && dapps.length > 0 ? 'row' : 'column'}
        flexWrap="wrap"
        gap="1rem"
      >
        {loading ? (
          <Box>
            <InfoBoxLoader />
          </Box>
        ) : dapps.length > 0 ? (
          dapps.map((dapp, i) => (
            <DappCard
              key={i}
              title={dapp.name}
              appUrl={dapp.url}
              iconUrl={dapp.iconUrl}
              description={dapp.description}
              categories={dapp.tags}
              safeAddress={safeAddress}
            />
          ))
        ) : (
          <NoDataCard
            translationNameSpace="proposalDapps"
            emptyText="emptyProposalDapps"
          />
        )}
      </Flex>
    </div>
  );
}
