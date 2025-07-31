import { Box, Flex, Icon, Show, Text, useBreakpointValue } from '@chakra-ui/react';
import {
  Bank,
  CaretRight,
  CheckSquare,
  Dot,
  GearFine,
  Stack,
  RocketLaunch,
  Percent,
  PiggyBank,
} from '@phosphor-icons/react';
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
import { SafeRevenueSharingSettingsPage } from '../../pages/dao/settings/revenue-sharing/SafeRevenueSharingSettingsContent';
import { SafeStakingSettingsPage } from '../../pages/dao/settings/staking/SafeStakingSettingsPage';
import { SafeTokenSettingsPage } from '../../pages/dao/settings/token/SafeTokenSettingsPage';
import { useDAOStore } from '../../providers/App/AppProvider';
import { useNetworkConfigStore } from '../../providers/NetworkConfig/useNetworkConfigStore';
import { AzoriusGovernance, GovernanceType } from '../../types';
import { isNonEmpty } from '../../utils/valueCheck';
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
  'token',
  'revenueSharing',
  'staking',
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

  const isTokenDeploymentEnabled = useFeatureFlag('flag_token_deployment');
  const isRevShareEnabled = useFeatureFlag('flag_revenue_sharing');
  const isMobile = useBreakpointValue({ base: true, md: false });

  const [currentItem, setCurrentItem] =
    useState<(typeof settingsNavigationItems)[number]>('general');

  const { values } = useFormikContext<SafeSettingsEdits>();

  const generalHasEdits = values.general !== undefined;

  const paymasterDepositHasEdits =
    values.paymasterGasTank?.deposit?.amount !== undefined &&
    !values.paymasterGasTank.deposit?.isDirectDeposit;
  const paymasterWithdrawHasEdits =
    values.paymasterGasTank?.withdraw?.amount !== undefined &&
    values.paymasterGasTank.withdraw.recipientAddress !== undefined;

  const paymasterHasEdits = paymasterDepositHasEdits || paymasterWithdrawHasEdits;

  let daoErc20Token;
  if (governance.type === GovernanceType.AZORIUS_ERC20) {
    daoErc20Token = governance.votesToken;
  } else if (governance.type === GovernanceType.MULTISIG) {
    daoErc20Token = governance.erc20Token;
  }

  return (
    <Flex
      backgroundColor="transparent"
      p={{ base: '1rem', md: '0.25rem' }}
      gap="0.25rem"
      flexDirection="column"
      borderRadius="0.75rem"
      borderTopRightRadius={{ base: '0.75rem', md: '0' }}
      borderBottomRightRadius={{ base: '0.75rem', md: '0' }}
      borderRight={{
        base: 'none',
        md: 'none',
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
      ) : !isMobile ? (
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
            hasEdits={generalHasEdits || paymasterHasEdits}
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
          {!governance.isAzorius && isTokenDeploymentEnabled && (
            <SettingsNavigationItem
              title={t('tokenTitle')}
              leftIcon={<RocketLaunch fontSize="1.5rem" />}
              item="token"
              currentItem={currentItem}
              onClick={() => {
                onSettingsNavigationClick(<SafeTokenSettingsPage />);
                setCurrentItem('token');
              }}
              hasEdits={isNonEmpty(values.token)}
            />
          )}
          {isRevShareEnabled && (
            <SettingsNavigationItem
              title={t('daoSettingsRevenueSharing')}
              leftIcon={<Percent fontSize="1.5rem" />}
              item="revenueSharing"
              currentItem={currentItem}
              showDivider={false}
              onClick={() => {
                onSettingsNavigationClick(<SafeRevenueSharingSettingsPage />);
                setCurrentItem('revenueSharing');
              }}
            />
          )}
          {isRevShareEnabled && daoErc20Token !== undefined && (
            <SettingsNavigationItem
              title={t('daoSettingsStaking')}
              leftIcon={<PiggyBank fontSize="1.5rem" />}
              item="staking"
              currentItem={currentItem}
              showDivider={false}
              onClick={() => {
                onSettingsNavigationClick(<SafeStakingSettingsPage />);
                setCurrentItem('staking');
              }}
              hasEdits={isNonEmpty(values.staking)}
            />
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
          {!governance.isAzorius && isTokenDeploymentEnabled && (
            <SettingsLink
              path={DAO_ROUTES.settingsToken.relative(addressPrefix, safe.address)}
              leftIcon={<RocketLaunch fontSize="1.5rem" />}
              title={t('tokenTitle')}
              onClick={() => onSettingsNavigationClick(<SafeTokenSettingsPage />)}
            />
          )}
        </>
      )}
    </Flex>
  );
}
