import { Box, Show, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { zeroAddress } from 'viem';
import { ERC20TokenContainer } from '../../../../components/SafeSettings/ERC20TokenContainer';
import { ERC721TokensContainer } from '../../../../components/SafeSettings/ERC721TokensContainer';
import { SettingsContentBox } from '../../../../components/SafeSettings/SettingsContentBox';
import { SignersContainer } from '../../../../components/SafeSettings/Signers/SignersContainer';
import NestedPageHeader from '../../../../components/ui/page/Header/NestedPageHeader';
import { DAO_ROUTES } from '../../../../constants/routes';
import { useCurrentDAOKey } from '../../../../hooks/DAO/useCurrentDAOKey';
import { useDAOStore } from '../../../../providers/App/AppProvider';
import { useNetworkConfigStore } from '../../../../providers/NetworkConfig/useNetworkConfigStore';
import { GovernanceType } from '../../../../types';
import { GovernanceParams } from './GovernanceParams';

export function SafeGovernanceSettingsPage() {
  const { t } = useTranslation('settings');
  const { addressPrefix } = useNetworkConfigStore();
  const { daoKey } = useCurrentDAOKey();
  const {
    governance: { type },
    node: { safe },
  } = useDAOStore({ daoKey });

  const isERC20Governance = type === GovernanceType.AZORIUS_ERC20;
  const isERC721Governance = type === GovernanceType.AZORIUS_ERC721;
  const isMultisigGovernance = type === GovernanceType.MULTISIG;

  return (
    <>
      <Show below="md">
        <NestedPageHeader
          title={t('daoSettingsGovernance')}
          backButton={{
            text: t('settings'),
            href: DAO_ROUTES.settings.relative(addressPrefix, safe?.address || zeroAddress),
          }}
        />
      </Show>
      <SettingsContentBox
        display="flex"
        flexDirection="column"
        gap={12}
        px={0}
      >
        {isERC20Governance ? (
          <ERC20TokenContainer />
        ) : isERC721Governance ? (
          <ERC721TokensContainer />
        ) : isMultisigGovernance ? (
          <SignersContainer />
        ) : null}
        {(isERC20Governance || isERC721Governance) && (
          <Box width="100%">
            <Text
              textStyle="text-xl-regular"
              mb={4}
              color="color-white"
            >
              {t('daoSettingsGovernanceParameters')}
            </Text>
            <Box
              borderWidth="0.06rem"
              borderColor="color-neutral-900"
              borderRadius="0.75rem"
            >
              <GovernanceParams />
            </Box>
          </Box>
        )}
      </SettingsContentBox>
    </>
  );
}
