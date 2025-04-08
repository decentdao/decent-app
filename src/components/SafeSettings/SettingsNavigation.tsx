import { Box, Flex, Show, Text, useBreakpointValue } from '@chakra-ui/react';
import { Bank, CaretRight, CheckSquare, GearFine, Stack } from '@phosphor-icons/react';
import { PropsWithChildren, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useMatch } from 'react-router-dom';
import { DAO_ROUTES } from '../../constants/routes';
import { useNetworkConfigStore } from '../../providers/NetworkConfig/useNetworkConfigStore';
import { useDaoInfoStore } from '../../store/daoInfo/useDaoInfoStore';
import { AzoriusGovernance } from '../../types';
import { BarLoader } from '../ui/loaders/BarLoader';
import Divider from '../ui/utils/Divider';

function SettingsLink({
  path,
  title,
  leftIcon,
  children,
  showDivider = true,
}: PropsWithChildren<{ path: string; title: string; leftIcon: ReactNode; showDivider?: boolean }>) {
  const pathWithoutSearch = path.substring(0, path.indexOf('?'));
  const isCurrentPath = useMatch(pathWithoutSearch);
  const location = useLocation();
  const paths = location.pathname.split('/');
  const isMobile = useBreakpointValue({ base: true, md: false });
  const isIndexSettingsPage = paths.length === 2;

  return (
    <Box
      as={Link}
      to={path}
      borderRadius={{ md: '0.5rem' }}
      transition="all ease-out 300ms"
      _hover={{ bgColor: 'neutral-3' }}
      bg={
        isCurrentPath ||
        (!isMobile &&
          isIndexSettingsPage &&
          pathWithoutSearch === `/${DAO_ROUTES.settings.path}/${DAO_ROUTES.settingsGeneral.path}`)
          ? 'white-alpha-04'
          : 'transparent'
      }
      p={{ base: 0, md: '0.5rem' }}
    >
      <Flex
        alignItems="center"
        justifyContent="space-between"
      >
        <Flex
          gap={4}
          alignItems="center"
          color="lilac-0"
        >
          {leftIcon}
          <Text color="white-0">{title}</Text>
        </Flex>
        <Show below="md">
          <Flex
            alignItems="center"
            color="neutral-6"
            gap={2}
          >
            {children}
            <CaretRight />
          </Flex>
        </Show>
      </Flex>
      {showDivider && (
        <Show below="md">
          <Divider
            variant="darker"
            width="calc(100% + 2rem)"
            mx="-1rem"
            my="1rem"
          />
        </Show>
      )}
    </Box>
  );
}

export default function SettingsNavigation() {
  const { t } = useTranslation('settings');
  const { addressPrefix } = useNetworkConfigStore();
  const { governance } = useDecentStore({ daoKey });
  const { safe, modules } = useDaoInfoStore();
  const azoriusGovernance = governance as AzoriusGovernance;

  return (
    <Flex
      backgroundColor="neutral-2"
      p={{ base: '1rem', md: '0.25rem' }}
      gap="0.25rem"
      flexDirection="column"
      borderRadius="0.75rem"
      borderTopRightRadius={{ base: '0.75rem', md: '0' }}
      borderBottomRightRadius={{ base: '0.75rem', md: '0' }}
      borderRight={{ base: 'none', md: '1px solid var(--colors-neutral-3)' }}
      borderColor="neutral-3"
      boxShadow="1px 0px 0px 0px #100414"
      minWidth="220px"
      width={{ base: '100%', md: 'auto' }}
    >
      {!safe ? (
        <Flex
          h="8.5rem"
          width="100%"
          alignItems="center"
          justifyContent="center"
        >
          <BarLoader />
        </Flex>
      ) : (
        <>
          <SettingsLink
            path={DAO_ROUTES.settingsGeneral.relative(addressPrefix, safe.address)}
            leftIcon={<GearFine fontSize="1.5rem" />}
            title={t('daoSettingsGeneral')}
          />
          <SettingsLink
            path={DAO_ROUTES.settingsGovernance.relative(addressPrefix, safe.address)}
            leftIcon={<Bank fontSize="1.5rem" />}
            title={t('daoSettingsGovernance')}
          >
            <Text color="neutral-7">
              {t(azoriusGovernance.votingStrategy?.strategyType ?? 'labelMultisig')}
            </Text>
          </SettingsLink>
          <SettingsLink
            path={DAO_ROUTES.settingsModulesAndGuard.relative(addressPrefix, safe.address)}
            leftIcon={<Stack fontSize="1.5rem" />}
            title={t('daoModulesAndGuard')}
          >
            <Text color="neutral-7">{(modules ?? []).length + (safe?.guard ? 1 : 0)}</Text>
          </SettingsLink>
          <SettingsLink
            path={DAO_ROUTES.settingsPermissions.relative(addressPrefix, safe.address)}
            leftIcon={<CheckSquare fontSize="1.5rem" />}
            title={t('permissionsTitle')}
            showDivider={false}
          >
            <Text color="neutral-7">{azoriusGovernance.votingStrategy ? 1 : 0}</Text>
          </SettingsLink>
        </>
      )}
    </Flex>
  );
}
