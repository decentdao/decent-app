import { Box, Flex, Icon, Show, Text } from '@chakra-ui/react';
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
import useFeatureFlag from '../../helpers/environmentFeatureFlags';
import { useCurrentDAOKey } from '../../hooks/DAO/useCurrentDAOKey';
import { useDAOStore } from '../../providers/App/AppProvider';
import { AzoriusGovernance, GovernanceType } from '../../types';
import { isNonEmpty } from '../../utils/valueCheck';
import { BarLoader } from '../ui/loaders/BarLoader';
import { SafeSettingsEdits } from '../ui/modals/SafeSettingsModal';
import Divider from '../ui/utils/Divider';
import { RevenueSharingSettingsContent } from './RevenueShare/RevenueSharingContent';
import { SafeGeneralSettingTab } from './TabContents/general/SafeGeneralSettingTab';
import { SafeGovernanceSettingTab } from './TabContents/governance/SafeGovernanceSettingTab';
import { SafeModulesSettingTab } from './TabContents/modules-and-guard/SafeModulesSettingTab';
import { SafePermissionsSettingTab } from './TabContents/permissions/SafePermissionsSettingTab';
import { SafeStakingSettingTab } from './TabContents/staking/SafeStakingSettingTab';
import { SafeTokenSettingTab } from './TabContents/token/SafeTokenSettingTab';

export const settingsNavigationItems = [
  'general',
  'governance',
  'modulesAndGuard',
  'permissions',
  'token',
  'revenueSharing',
  'staking',
] as const;

export type SettingsNavigationItem = (typeof settingsNavigationItems)[number];

function SettingsNavigationItemComponent({
  title,
  leftIcon,
  children,
  showDivider = true,
  currentItem = 'general',
  item = 'general',
  onClick,
  hasEdits = false,
  testId,
}: PropsWithChildren<{
  title: string;
  leftIcon: ReactNode;
  showDivider?: boolean;
  item: SettingsNavigationItem;
  currentItem: SettingsNavigationItem;
  onClick?: () => void;
  hasEdits?: boolean;
  testId?: string;
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
      data-testid={testId}
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
  initialTab = 'general',
}: {
  onSettingsNavigationClick: (content: JSX.Element) => void;
  initialTab?: SettingsNavigationItem;
}) {
  const { t } = useTranslation('settings');
  const { daoKey } = useCurrentDAOKey();
  const {
    governance,
    node: { safe, modules },
  } = useDAOStore({ daoKey });
  const azoriusGovernance = governance as AzoriusGovernance;

  const isTokenDeploymentEnabled = useFeatureFlag('flag_token_deployment');
  const isRevShareEnabled = useFeatureFlag('flag_revenue_sharing');

  const [currentItem, setCurrentItem] =
    useState<(typeof settingsNavigationItems)[number]>(initialTab);

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
      ) : (
        <>
          <SettingsNavigationItemComponent
            title={t('daoSettingsGeneral')}
            leftIcon={<GearFine fontSize="1.5rem" />}
            item="general"
            currentItem={currentItem}
            testId="settings-nav-general"
            onClick={() => {
              onSettingsNavigationClick(<SafeGeneralSettingTab />);
              setCurrentItem('general');
            }}
            hasEdits={generalHasEdits || paymasterHasEdits}
          />
          <SettingsNavigationItemComponent
            title={t('daoSettingsGovernance')}
            leftIcon={<Bank fontSize="1.5rem" />}
            item="governance"
            currentItem={currentItem}
            testId="settings-nav-governance"
            onClick={() => {
              onSettingsNavigationClick(<SafeGovernanceSettingTab />);
              setCurrentItem('governance');
            }}
            hasEdits={values.azorius !== undefined || values.multisig !== undefined}
          >
            <Text color="color-neutral-300">
              {t(azoriusGovernance.votingStrategy?.strategyType ?? 'labelMultisig')}
            </Text>
          </SettingsNavigationItemComponent>
          <SettingsNavigationItemComponent
            title={t('modulesAndGuardsTitle')}
            leftIcon={<Stack fontSize="1.5rem" />}
            item="modulesAndGuard"
            currentItem={currentItem}
            testId="settings-nav-modules"
            onClick={() => {
              onSettingsNavigationClick(<SafeModulesSettingTab />);
              setCurrentItem('modulesAndGuard');
            }}
          >
            <Text color="color-neutral-300">{(modules ?? []).length + (safe?.guard ? 1 : 0)}</Text>
          </SettingsNavigationItemComponent>
          {governance.isAzorius && (
            <SettingsNavigationItemComponent
              title={t('permissionsTitle')}
              leftIcon={<CheckSquare fontSize="1.5rem" />}
              item="permissions"
              currentItem={currentItem}
              showDivider={false}
              testId="settings-nav-permissions"
              onClick={() => {
                onSettingsNavigationClick(<SafePermissionsSettingTab />);
                setCurrentItem('permissions');
              }}
              hasEdits={values.permissions !== undefined}
            >
              <Text color="color-neutral-300">{azoriusGovernance.votingStrategy ? 1 : 0}</Text>
            </SettingsNavigationItemComponent>
          )}
          {!governance.isAzorius && isTokenDeploymentEnabled && (
            <SettingsNavigationItemComponent
              title={t('tokenTitle')}
              leftIcon={<RocketLaunch fontSize="1.5rem" />}
              item="token"
              currentItem={currentItem}
              testId="settings-nav-token"
              onClick={() => {
                onSettingsNavigationClick(<SafeTokenSettingTab />);
                setCurrentItem('token');
              }}
            />
          )}
          {isRevShareEnabled && (
            <SettingsNavigationItemComponent
              title={t('daoSettingsRevenueSharing')}
              leftIcon={<Percent fontSize="1.5rem" />}
              item="revenueSharing"
              currentItem={currentItem}
              showDivider={false}
              testId="settings-nav-revenue-sharing"
              onClick={() => {
                onSettingsNavigationClick(<RevenueSharingSettingsContent />);
                setCurrentItem('revenueSharing');
              }}
            />
          )}
          {isRevShareEnabled && daoErc20Token !== undefined && (
            <SettingsNavigationItemComponent
              title={t('daoSettingsStaking')}
              leftIcon={<PiggyBank fontSize="1.5rem" />}
              item="staking"
              currentItem={currentItem}
              showDivider={false}
              testId="settings-nav-staking"
              onClick={() => {
                onSettingsNavigationClick(<SafeStakingSettingTab />);
                setCurrentItem('staking');
              }}
              hasEdits={isNonEmpty(values.staking)}
            />
          )}
        </>
      )}
    </Flex>
  );
}
