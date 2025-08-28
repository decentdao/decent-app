import { Box, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { useCurrentDAOKey } from '../../../../hooks/DAO/useCurrentDAOKey';
import { useDAOStore } from '../../../../providers/App/AppProvider';
import { GovernanceType } from '../../../../types';
import { ERC20TokenContainer } from '../../ERC20TokenContainer';
import { ERC721TokensContainer } from '../../ERC721TokensContainer';
import { SettingsContentBox } from '../../SettingsContentBox';
import { SignersContainer } from '../../Signers/SignersContainer';
import { GovernanceParams } from './GovernanceParams';

export function SafeGovernanceSettingTab() {
  const { t } = useTranslation('settings');
  const { daoKey } = useCurrentDAOKey();
  const {
    governance: { type },
  } = useDAOStore({ daoKey });

  const isERC20Governance = type === GovernanceType.AZORIUS_ERC20;
  const isERC721Governance = type === GovernanceType.AZORIUS_ERC721;
  const isMultisigGovernance = type === GovernanceType.MULTISIG;

  return (
    <>
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
