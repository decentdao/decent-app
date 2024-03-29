import { Box, Flex, Text, Divider, Center } from '@chakra-ui/react';
import { ethers } from 'ethers';
import { useTranslation } from 'react-i18next';
import { SettingsSection } from '..';
import { useFractal } from '../../../../../providers/App/AppProvider';
import { FractalModuleType } from '../../../../../types';
import { DisplayAddress } from '../../../../ui/links/DisplayAddress';
import { BarLoader } from '../../../../ui/loaders/BarLoader';

function NoModuleAttached({ translationKey }: { translationKey: string }) {
  const { t } = useTranslation('settings');

  return (
    <Center my={4}>
      <Text
        color="chocolate.200"
        textStyle="text-lg-mono-bold"
      >
        {t(translationKey)}
      </Text>
    </Center>
  );
}

export function ModulesContainer() {
  const { t } = useTranslation(['settings']);
  const {
    node: { fractalModules, isModulesLoaded, safe },
    guardContracts: { freezeGuardContractAddress, freezeVotingContractAddress },
  } = useFractal();

  return (
    <SettingsSection
      contentTitle={t('modulesTitle')}
      descriptionTitle={t('modulesAndGuardsTitle')}
      descriptionText={t('modulesAndGuardsDescription1')}
      descriptionContent={
        <>
          <Text
            textStyle="text-sm-sans-regular"
            color="chocolate.200"
            mt={2}
          >
            {t('modulesAndGuardsDescription1')}
          </Text>
          <Text
            textStyle="text-sm-sans-regular"
            color="chocolate.200"
            mt={4}
          >
            {t('modulesAndGuardsDescription2')}
          </Text>
        </>
      }
    >
      <Flex
        flexDirection="column"
        gap="1rem"
        mt={4}
      >
        {isModulesLoaded ? (
          fractalModules.length > 0 ? (
            fractalModules.map(({ moduleAddress, moduleType }, i) => (
              <Box
                key={moduleAddress}
                mt={1}
                mb={i === 0 ? 1 : 4}
              >
                <DisplayAddress address={moduleAddress}>
                  {moduleAddress}
                  {moduleType === FractalModuleType.AZORIUS
                    ? ' (Azorius Module)'
                    : moduleType === FractalModuleType.FRACTAL
                      ? ' (Fractal Module)'
                      : ''}
                </DisplayAddress>
              </Box>
            ))
          ) : (
            <NoModuleAttached translationKey="noModulesAttached" />
          )
        ) : (
          <BarLoader />
        )}
        <Text textStyle="text-lg-mono-bold">{t('guardTitle')}</Text>
        <Divider
          color="chocolate.400"
          mt={4}
        />
        {safe?.guard && safe?.guard !== ethers.constants.AddressZero ? (
          <Box>
            <DisplayAddress address={safe.guard}>
              {safe.guard}
              {!!freezeGuardContractAddress || !!freezeVotingContractAddress
                ? ' (Freeze Guard)'
                : ''}
            </DisplayAddress>
          </Box>
        ) : (
          <NoModuleAttached translationKey="noGuardAttached" />
        )}
      </Flex>
    </SettingsSection>
  );
}
