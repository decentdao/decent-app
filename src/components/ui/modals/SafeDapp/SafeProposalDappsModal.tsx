import * as amplitude from '@amplitude/analytics-browser';
import { Box, CloseButton, Flex, Text } from '@chakra-ui/react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import useFeatureFlag from '../../../../helpers/environmentFeatureFlags';
import { useSupportedDapps } from '../../../../hooks/DAO/loaders/useSupportedDapps';
import { useCurrentDAOKey } from '../../../../hooks/DAO/useCurrentDAOKey';
import { analyticsEvents } from '../../../../insights/analyticsEvents';
import { useNetworkConfigStore } from '../../../../providers/NetworkConfig/useNetworkConfigStore';
import DappCard from '../../../ProposalDapps/DappCard';
import NoDataCard from '../../containers/NoDataCard';
import { InfoBoxLoader } from '../../loaders/InfoBoxLoader';

export function SafeProposalDappsModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    amplitude.track(analyticsEvents.SafeProposalDappsModalOpened);
  }, []);

  const { t } = useTranslation(['proposalDapps']);
  const { chain } = useNetworkConfigStore();
  const { dapps } = useSupportedDapps(chain.id);
  const { safeAddress } = useCurrentDAOKey();
  const devMode = useFeatureFlag('flag_dev');

  const loading = !dapps || !safeAddress;

  return (
    <div>
      <Flex
        justifyContent="space-between"
        gap="6rem"
      >
        <Box>
          <Text
            textStyle="text-2xl-regular"
            color="white-0"
          >
            {t('dappsTitle')}
          </Text>
          <Text
            color="neutral-7"
            textStyle="text-base-regular"
          >
            {t('dappsDescription')}
          </Text>
        </Box>

        <CloseButton onClick={onClose} />
      </Flex>

      <Flex
        marginTop="2rem"
        flexDirection={!loading && dapps.length > 0 ? 'row' : 'column'}
        flexWrap="wrap"
        gap="1rem"
      >
        {devMode && (
          <DappCard
            title="Custom dApp"
            appUrl=""
            iconUrl=""
            description="A custom decentralized application URL provided by the user."
            categories={['Custom']}
            onClose={onClose}
          />
        )}

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
              onClose={onClose}
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
