import * as amplitude from '@amplitude/analytics-browser';
import { Flex } from '@chakra-ui/react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import dappsData from '../../../assets/dapps.json';
import DappCard from '../../../components/ProposalDapps/DappCard';
import PageHeader from '../../../components/ui/page/Header/PageHeader';
import { analyticsEvents } from '../../../insights/analyticsEvents';
import { Dapp } from '../../../types';

export function SafeProposalDappsPage() {
  useEffect(() => {
    amplitude.track(analyticsEvents.ProposalDappsPageOpened);
  }, []);

  const { t } = useTranslation();

  const dapps: Dapp[] = dappsData as Dapp[];

  return (
    <div>
      <PageHeader
        title={t('proposalDapps', { ns: 'breadcrumbs' })}
        breadcrumbs={[
          {
            terminus: t('proposalDapps', { ns: 'breadcrumbs' }),
            path: '',
          },
        ]}
      ></PageHeader>
      <Flex
        flexDirection={'row'}
        flexWrap="wrap"
        gap="1rem"
      >
        {dapps.map((dapp, i) => (
          <DappCard
            key={i}
            title={dapp.name}
            appUrl={dapp.url}
            iconUrl={dapp.iconUrl}
            description={dapp.description}
            categories={dapp.tags}
          />
        ))}
      </Flex>
    </div>
  );
}
