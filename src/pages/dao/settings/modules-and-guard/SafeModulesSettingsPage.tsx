import { Box, Flex, Hide, Show, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { zeroAddress } from 'viem';
import { SettingsContentBox } from '../../../../components/SafeSettings/SettingsContentBox';
import { DisplayAddress } from '../../../../components/ui/links/DisplayAddress';
import { BarLoader } from '../../../../components/ui/loaders/BarLoader';
import NestedPageHeader from '../../../../components/ui/page/Header/NestedPageHeader';
import { DAO_ROUTES } from '../../../../constants/routes';
import { useCurrentDAOKey } from '../../../../hooks/DAO/useCurrentDAOKey';
import { createAccountSubstring } from '../../../../hooks/utils/useGetAccountName';
import { useStore } from '../../../../providers/App/AppProvider';
import { useNetworkConfigStore } from '../../../../providers/NetworkConfig/useNetworkConfigStore';
import { FractalModuleType } from '../../../../types';

export function SafeModulesSettingsPage() {
  const { t } = useTranslation('settings');
  const { addressPrefix } = useNetworkConfigStore();
  const { daoKey } = useCurrentDAOKey();
  const {
    guardContracts: { freezeGuardContractAddress, freezeVotingContractAddress },
    node: { modules, safe },
  } = useStore({ daoKey });

  return (
    <>
      <Show below="md">
        <NestedPageHeader
          title={t('modulesAndGuardsTitle')}
          backButton={{
            text: t('settings'),
            href: DAO_ROUTES.settings.relative(addressPrefix, safe?.address || zeroAddress),
          }}
        />
      </Show>
      <SettingsContentBox>
        <Flex
          px={6}
          py={2}
          flexDirection="column"
          gap="1rem"
        >
          <Text
            ml={6}
            textStyle="body-large"
          >
            {t('modulesTitle')}
          </Text>

          <Box
            border="1px solid"
            borderColor="neutral-3"
            borderRadius="0.75rem"
            p={4}
          >
            {modules !== null ? (
              modules.length > 0 ? (
                modules.map(({ moduleAddress, moduleType }, index) => {
                  const moduleHelper =
                    moduleType === FractalModuleType.AZORIUS
                      ? ' Azorius Module'
                      : moduleType === FractalModuleType.FRACTAL
                        ? ' Fractal Module' // @todo rename this after renaming and redeploying contracts
                        : '';
                  return (
                    <Flex
                      key={moduleAddress}
                      flexDirection="column"
                    >
                      {moduleHelper && <Text textStyle="body-small">{moduleHelper}</Text>}
                      <DisplayAddress
                        ml={-3.5}
                        address={moduleAddress}
                        mb={index !== modules.length - 1 ? 4 : 0}
                      >
                        <Hide above="xl">{createAccountSubstring(moduleAddress)}</Hide>
                        <Show above="xl">{moduleAddress}</Show>
                      </DisplayAddress>
                    </Flex>
                  );
                })
              ) : (
                <Text color="neutral-5">{t('noModulesAttached')}</Text>
              )
            ) : (
              <BarLoader />
            )}
          </Box>
        </Flex>
        <Flex
          px={6}
          py={2}
          flexDirection="column"
          gap="1rem"
          mt="2rem"
        >
          <Text
            ml={6}
            textStyle="body-large"
          >
            {t('guardTitle')}
          </Text>

          <Box
            border="1px solid"
            borderColor="neutral-3"
            borderRadius="0.75rem"
            p={4}
          >
            {safe?.guard && safe?.guard !== zeroAddress ? (
              <Flex flexDirection="column">
                <Text textStyle="body-small">
                  {!!freezeGuardContractAddress || !!freezeVotingContractAddress
                    ? 'Freeze Guard'
                    : 'Guard'}
                </Text>
                <DisplayAddress
                  ml={-3.5}
                  address={safe.guard}
                >
                  <Hide above="xl">{createAccountSubstring(safe.guard)}</Hide>
                  <Show above="xl">{safe.guard}</Show>
                </DisplayAddress>
              </Flex>
            ) : (
              <Text color="neutral-5">{t('noGuardAttached')}</Text>
            )}
          </Box>
        </Flex>
      </SettingsContentBox>
    </>
  );
}
