import { Box, Flex, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { useSupportedDapps } from '../../../hooks/DAO/loaders/useSupportedDapps';
import { useNetworkConfigStore } from '../../../providers/NetworkConfig/useNetworkConfigStore';
import { useDaoInfoStore } from '../../../store/daoInfo/useDaoInfoStore';
import DappCard from '../../ProposalDapps/DappCard';
import NoDataCard from '../containers/NoDataCard';
import { InfoBoxLoader } from '../loaders/InfoBoxLoader';

export function SafeProposalDappsModal({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation(['proposalDapps']);
  const { chain } = useNetworkConfigStore();
  const { safe } = useDaoInfoStore();
  const { dapps } = useSupportedDapps(chain.id);

  const safeAddress = safe?.address;
  const loading = !dapps || !safeAddress;

  return (
    <div>
      <Text
        marginTop="2rem"
        textStyle="heading-large"
        color="white-0"
      >
        {t('dappsTitle')}
      </Text>
      <Text color="neutral-7">{t('dappsDescription')}</Text>
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
