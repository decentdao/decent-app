import { Box, Button, Flex, IconButton, Text } from '@chakra-ui/react';
import { Coins, Plus } from '@phosphor-icons/react';
import { useFormikContext } from 'formik';
import { useTranslation } from 'react-i18next';
import PencilWithLineIcon from '../../../../assets/theme/custom/icons/PencilWithLineIcon';
import { SettingsContentBox } from '../../../../components/SafeSettings/SettingsContentBox';
import NoDataCard from '../../../../components/ui/containers/NoDataCard';
import { BarLoader } from '../../../../components/ui/loaders/BarLoader';
import { ModalType } from '../../../../components/ui/modals/ModalProvider';
import { SafeSettingsEdits } from '../../../../components/ui/modals/SafeSettingsModal';
import { useDecentModal } from '../../../../components/ui/modals/useDecentModal';
import Divider from '../../../../components/ui/utils/Divider';
import { NEUTRAL_2_82_TRANSPARENT } from '../../../../constants/common';
import { useCurrentDAOKey } from '../../../../hooks/DAO/useCurrentDAOKey';
import { useCanUserCreateProposal } from '../../../../hooks/utils/useCanUserSubmitProposal';
import { useDAOStore } from '../../../../providers/App/AppProvider';
import { AzoriusGovernance } from '../../../../types';

// @todo: Near-duplicate of SafePermissionsSettingsPage.tsx. Pending refactor and/or cleanup.
// https://linear.app/decent-labs/issue/ENG-842/fix-permissions-settings-ux-flows
export function SafePermissionsSettingsContent() {
  const { t } = useTranslation(['settings', 'common']);
  const { daoKey } = useCurrentDAOKey();
  const {
    governance,
    governanceContracts: { isLoaded, linearVotingErc20Address, linearVotingErc721Address },
    node: { safe },
  } = useDAOStore({ daoKey });

  const { canUserCreateProposal } = useCanUserCreateProposal();
  const azoriusGovernance = governance as AzoriusGovernance;
  const { votesToken, erc721Tokens } = azoriusGovernance;

  const formikContext = useFormikContext<SafeSettingsEdits>();

  const openAddCreateProposalPermissionModal = useDecentModal(
    ModalType.ADD_CREATE_PROPOSAL_PERMISSION,
    {
      formikContext,
    },
  );

  const openAddPermissionModal = useDecentModal(ModalType.ADD_PERMISSION, {
    openAddCreateProposalPermissionModal,
  });

  if (!safe) {
    return null;
  }

  const proposerThreshold = azoriusGovernance.votingStrategy?.proposerThreshold?.formatted;

  return (
    <>
      <SettingsContentBox
        flexDirection="column"
        display="flex"
        bg={{ base: 'transparent', md: NEUTRAL_2_82_TRANSPARENT }}
      >
        <Text
          ml={6}
          mb={0.5}
          textStyle="body-large"
        >
          {t('permissionsTitle')}
        </Text>

        <Flex
          flexDirection="column"
          border="1px solid"
          borderColor="color-neutral-900"
          borderRadius="0.75rem"
        >
          {!isLoaded ? (
            <Box
              my="0.5rem"
              justifyContent="center"
              display="flex"
            >
              <BarLoader />
            </Box>
          ) : (!votesToken || !linearVotingErc20Address) &&
            (!erc721Tokens || !linearVotingErc721Address) ? (
            <NoDataCard
              emptyText="emptyPermissions"
              emptyTextNotProposer="emptyPermissionsNotProposer"
              translationNameSpace="settings"
              flatten
            />
          ) : (
            <Box
              p={4}
              borderRadius="0.75rem"
              onClick={openAddPermissionModal}
              sx={{
                _hover: {
                  backgroundColor: 'color-neutral-900',
                  button: {
                    opacity: 1,
                  },
                },
              }}
            >
              <Flex justifyContent="space-between">
                <Flex
                  gap={4}
                  alignItems="flex-start"
                >
                  <Box
                    borderRadius="50%"
                    bg="color-neutral-900"
                    color="color-lilac-100"
                    padding={1}
                  >
                    <Coins fontSize="1.5rem" />
                  </Box>
                  <Box>
                    <Text>{t('permissionCreateProposalsTitle')}</Text>
                    <Text
                      textStyle="labels-large"
                      color="neutral-7"
                    >
                      {votesToken
                        ? t('permissionsErc20CreateProposalsDescription', {
                            symbol: votesToken.symbol,
                            proposerThreshold,
                          })
                        : t('permissionsErc721CreateProposalsDescription', {
                            proposerThreshold,
                            symbol: erc721Tokens?.[0]?.symbol,
                            count: erc721Tokens?.length,
                          })}
                    </Text>
                  </Box>
                </Flex>
                {canUserCreateProposal && (
                  <IconButton
                    variant="secondary"
                    size="icon-md"
                    icon={<PencilWithLineIcon />}
                    aria-label={t('edit')}
                    opacity={0}
                    color="neutral-6"
                    border="none"
                  />
                )}
              </Flex>
            </Box>
          )}
          {canUserCreateProposal && (
            <Flex flexDir="column">
              <Divider />
              <Button
                m={4}
                variant="secondary"
                size="sm"
                leftIcon={<Plus />}
                width="max-content"
                onClick={openAddPermissionModal}
                alignSelf="flex-end"
              >
                {t('addPermission')}
              </Button>
            </Flex>
          )}
        </Flex>
      </SettingsContentBox>
    </>
  );
}
