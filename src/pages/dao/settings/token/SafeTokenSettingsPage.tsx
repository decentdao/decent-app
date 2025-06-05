import { Button, Flex, Show, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { zeroAddress } from 'viem';
import { SettingsContentBox } from '../../../../components/SafeSettings/SettingsContentBox';
import NestedPageHeader from '../../../../components/ui/page/Header/NestedPageHeader';
import { DAO_ROUTES } from '../../../../constants/routes';
import { useCurrentDAOKey } from '../../../../hooks/DAO/useCurrentDAOKey';
import { useDAOStore } from '../../../../providers/App/AppProvider';
import { useNetworkConfigStore } from '../../../../providers/NetworkConfig/useNetworkConfigStore';

export function SafeTokenSettingsPage() {
  const { t } = useTranslation('settings');
  const { addressPrefix } = useNetworkConfigStore();
  const { daoKey } = useCurrentDAOKey();
  const {
    node: { safe },
  } = useDAOStore({ daoKey });

  return (
    <>
      <Show below="md">
        <NestedPageHeader
          title={t('tokenTitle')}
          backButton={{
            text: t('settings'),
            href: DAO_ROUTES.settings.relative(addressPrefix, safe?.address || zeroAddress),
          }}
        />
      </Show>
      <SettingsContentBox>
        <Flex
          flexDirection="column"
          gap="1.5rem"
          padding={'1.5rem 3rem'}
          alignItems="flex-start"
          alignSelf="stretch"
        >
          <Flex
            flexDirection="column"
            gap="0.5rem"
          >
            <Text textStyle="text-lg-regular">{t('tokenPageTitle')}</Text>

            <Text textStyle="text-sm-regular">{t('tokenPageNotDeployedDescription')}</Text>
          </Flex>

          <Button>Deploy Token</Button>
        </Flex>
      </SettingsContentBox>
    </>
  );
}
