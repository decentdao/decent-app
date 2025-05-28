import { Box, Flex, Icon, Show, Text, useBreakpointValue } from '@chakra-ui/react';
import { Bank, CaretRight, CheckSquare, Dot, GearFine, Stack } from '@phosphor-icons/react';
import { useFormikContext } from 'formik';
import { PropsWithChildren, ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useMatch } from 'react-router-dom';
import { DAO_ROUTES } from '../../constants/routes';
import useFeatureFlag from '../../helpers/environmentFeatureFlags';
import { useCurrentDAOKey } from '../../hooks/DAO/useCurrentDAOKey';
import { SafeGeneralSettingsPage } from '../../pages/dao/settings/general/SafeGeneralSettingsPage';
import { SafeGovernanceSettingsPage } from '../../pages/dao/settings/governance/SafeGovernanceSettingsPage';
import { SafeModulesSettingsPage } from '../../pages/dao/settings/modules-and-guard/SafeModulesSettingsPage';
import { SafePermissionsSettingsContent } from '../../pages/dao/settings/permissions/SafePermissionsSettingsContent';
import { useDAOStore } from '../../providers/App/AppProvider';
import { useNetworkConfigStore } from '../../providers/NetworkConfig/useNetworkConfigStore';
import { AzoriusGovernance } from '../../types';
import { BarLoader } from '../ui/loaders/BarLoader';
import { SafeSettingsEdits } from '../ui/modals/SafeSettingsModal';
import Divider from '../ui/utils/Divider';

function SettingsLink({
  path,
  title,
  leftIcon,
  children,
  showDivider = true,
  onClick,
}: PropsWithChildren<{
  path: string;
  title: string;
  leftIcon: ReactNode;
  showDivider?: boolean;
  onClick?: () => void;
}>) {
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
      onClick={onClick}
      borderRadius={{ md: '0.5rem' }}
      transition="all ease-out 300ms"
      _hover={{ bgColor: 'color-neutral-900' }}
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
          color="color-lilac-100"
        >
          {leftIcon}
          <Text color="color-white">{title}</Text>
        </Flex>
        <Show below="md">
          <Flex
            alignItems="center"
            color="color-neutral-400"
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

const settingsNavigationItems = [
  'general',
  'governance',
  'modulesAndGuard',
  'permissions',
] as const;

function SettingsNavigationItem({
  title,
  leftIcon,
  children,
  showDivider = true,
  currentItem = 'general',
  item = 'general',
  onClick,
  hasEdits = false,
}: PropsWithChildren<{
  title: string;
  leftIcon: ReactNode;
  showDivider?: boolean;
  item: (typeof settingsNavigationItems)[number];
  currentItem: (typeof settingsNavigationItems)[number];
  onClick?: () => void;
  hasEdits?: boolean;
}>) {
  return (
    <Box
      onClick={onClick}
      borderRadius={{ md: '0.5rem' }}
      transition="all ease-out 300ms"
      _hover={{ bgColor: 'color-neutral-900' }}
      bg={currentItem === item ? 'white-alpha-04' : 'transparent'}
      p={{ base: 0, md: '0.5rem' }}
      cursor="pointer"
    >
      <Flex
        alignItems="center"
        justifyContent="space-between"
      >
        <Flex
          gap={4}
          alignItems="center"
          color="color-lilac-100"
          justifyContent="space-between"
        >
          {leftIcon}
          <Text color="color-white">{title}</Text>
        </Flex>
        {hasEdits && (
          <Icon
            as={Dot}
            style={{ transform: 'scale(5)' }}
          />
        )}
        <Show below="md">
          <Flex
            alignItems="center"
            color="color-neutral-400"
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

export function SettingsNavigation({
  onSettingsNavigationClick,
}: {
  onSettingsNavigationClick: (content: JSX.Element) => void;
}) {
  const { t } = useTranslation('settings');
  const { addressPrefix } = useNetworkConfigStore();
  const { daoKey } = useCurrentDAOKey();
  const {
    governance,
    node: { safe, modules },
  } = useDAOStore({ daoKey });
  const azoriusGovernance = governance as AzoriusGovernance;

  const isSettingsV1Enabled = useFeatureFlag('flag_settings_v1');
  const isMobile = useBreakpointValue({ base: true, md: false });

  const [currentItem, setCurrentItem] =
    useState<(typeof settingsNavigationItems)[number]>('general');

  const { values } = useFormikContext<SafeSettingsEdits>();

  return (
    <Flex
      backgroundColor={isSettingsV1Enabled ? 'transparent' : 'color-neutral-950'}
      p={{ base: '1rem', md: '0.25rem' }}
      gap="0.25rem"
      flexDirection="column"
      borderRadius="0.75rem"
      borderTopRightRadius={{ base: '0.75rem', md: '0' }}
      borderBottomRightRadius={{ base: '0.75rem', md: '0' }}
      borderRight={{
        base: 'none',
        md: !isSettingsV1Enabled ? '1px solid var(--colors-color-neutral-900)' : 'none',
      }}
      borderColor="color-neutral-900"
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
      ) : isSettingsV1Enabled && !isMobile ? (
        <>
          <SettingsNavigationItem
            title={t('daoSettingsGeneral')}
            leftIcon={<GearFine fontSize="1.5rem" />}
            item="general"
            currentItem={currentItem}
            onClick={() => {
              onSettingsNavigationClick(<SafeGeneralSettingsPage />);
              setCurrentItem('general');
            }}
            hasEdits={values.general !== undefined}
          />
          <SettingsNavigationItem
            title={t('daoSettingsGovernance')}
            leftIcon={<Bank fontSize="1.5rem" />}
            item="governance"
            currentItem={currentItem}
            onClick={() => {
              onSettingsNavigationClick(<SafeGovernanceSettingsPage />);
              setCurrentItem('governance');
            }}
            hasEdits={values.azorius !== undefined || values.multisig !== undefined}
          >
            <Text color="color-neutral-300">
              {t(azoriusGovernance.votingStrategy?.strategyType ?? 'labelMultisig')}
            </Text>
          </SettingsNavigationItem>
          <SettingsNavigationItem
            title={t('modulesAndGuardsTitle')}
            leftIcon={<Stack fontSize="1.5rem" />}
            item="modulesAndGuard"
            currentItem={currentItem}
            onClick={() => {
              onSettingsNavigationClick(<SafeModulesSettingsPage />);
              setCurrentItem('modulesAndGuard');
            }}
          >
            <Text color="color-neutral-300">{(modules ?? []).length + (safe?.guard ? 1 : 0)}</Text>
          </SettingsNavigationItem>
          {governance.isAzorius && (
            <SettingsNavigationItem
              title={t('permissionsTitle')}
              leftIcon={<CheckSquare fontSize="1.5rem" />}
              item="permissions"
              currentItem={currentItem}
              showDivider={false}
              onClick={() => {
                onSettingsNavigationClick(<SafePermissionsSettingsContent />);
                setCurrentItem('permissions');
              }}
              hasEdits={values.permissions !== undefined}
            >
              <Text color="color-neutral-300">{azoriusGovernance.votingStrategy ? 1 : 0}</Text>
            </SettingsNavigationItem>
          )}
        </>
      ) : (
        <>
          <SettingsLink
            path={DAO_ROUTES.settingsGeneral.relative(addressPrefix, safe.address)}
            leftIcon={<GearFine fontSize="1.5rem" />}
            title={t('daoSettingsGeneral')}
            onClick={() => onSettingsNavigationClick(<SafeGeneralSettingsPage />)}
          />
          <SettingsLink
            path={DAO_ROUTES.settingsGovernance.relative(addressPrefix, safe.address)}
            leftIcon={<Bank fontSize="1.5rem" />}
            title={t('daoSettingsGovernance')}
          >
            <Text color="color-neutral-300">
              {t(azoriusGovernance.votingStrategy?.strategyType ?? 'labelMultisig')}
            </Text>
          </SettingsLink>
          <SettingsLink
            path={DAO_ROUTES.settingsModulesAndGuard.relative(addressPrefix, safe.address)}
            leftIcon={<Stack fontSize="1.5rem" />}
            title={t('modulesAndGuardsTitle')}
          >
            <Text color="color-neutral-300">{(modules ?? []).length + (safe?.guard ? 1 : 0)}</Text>
          </SettingsLink>
          {governance.isAzorius && (
            <SettingsLink
              path={DAO_ROUTES.settingsPermissions.relative(addressPrefix, safe.address)}
              leftIcon={<CheckSquare fontSize="1.5rem" />}
              title={t('permissionsTitle')}
              showDivider={false}
            >
              <Text color="color-neutral-300">{azoriusGovernance.votingStrategy ? 1 : 0}</Text>
            </SettingsLink>
          )}
        </>
      )}
    </Flex>
  );
}
