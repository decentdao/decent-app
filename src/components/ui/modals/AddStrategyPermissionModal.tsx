import { Box, Flex, IconButton, Show, Text } from '@chakra-ui/react';
import { CheckSquare, Scroll, X } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { zeroAddress } from 'viem';
import { DAO_ROUTES } from '../../../constants/routes';
import useFeatureFlag from '../../../helpers/environmentFeatureFlags';
import { useCurrentDAOKey } from '../../../hooks/DAO/useCurrentDAOKey';
import { useDAOStore } from '../../../providers/App/AppProvider';
import { useNetworkConfigStore } from '../../../providers/NetworkConfig/useNetworkConfigStore';
import { Card } from '../cards/Card';

export function AddStrategyPermissionModal({
  closeModal,
  openAddCreateProposalPermissionModal,
}: {
  closeModal: () => void;
  openAddCreateProposalPermissionModal: () => void;
}) {
  const { t } = useTranslation(['settings', 'common']);
  const navigate = useNavigate();
  const { addressPrefix } = useNetworkConfigStore();
  const { daoKey } = useCurrentDAOKey();
  const {
    node: { safe },
  } = useDAOStore({ daoKey });

  const isSettingsV1Enabled = useFeatureFlag('flag_settings_v1');

  if (!safe) {
    return null;
  }

  return (
    <Flex
      gap={4}
      flexDirection="column"
      px={{ base: 4, md: 0 }}
    >
      <Flex
        justifyContent="space-between"
        alignItems="center"
      >
        <Text textStyle="heading-small">{t('addPermissionTitle')}</Text>
        <Show above="md">
          <IconButton
            variant="ghost"
            color="lilac-0"
            aria-label={t('close', { ns: 'common' })}
            onClick={closeModal}
            icon={<X size={24} />}
          />
        </Show>
      </Flex>
      <Flex gap={2}>
        <Card
          display="flex"
          flexDirection="column"
          gap={2}
          bg="neutral-3"
          _hover={{
            backgroundColor: 'white-alpha-04',
          }}
          onClick={() => {
            if (!isSettingsV1Enabled) {
              navigate(
                DAO_ROUTES.settingsPermissionsCreateProposal.relative(
                  addressPrefix,
                  safe.address,
                  zeroAddress,
                ),
              );
            } else {
              closeModal();
              openAddCreateProposalPermissionModal();
            }
          }}
        >
          <Box color="lilac-0">
            <Scroll size={24} />
          </Box>
          <Flex
            flexDirection="column"
            gap={1}
          >
            <Text textStyle="heading-small">{t('permissionCreateProposalsTitle')}</Text>
            <Text color="neutral-7">{t('permissionCreateProposalsDescription')}</Text>
          </Flex>
        </Card>

        <Card
          display="flex"
          flexDirection="column"
          gap={2}
          _hover={{}}
          cursor="not-allowed"
        >
          <Box color="neutral-6">
            <CheckSquare size={24} />
          </Box>
          <Flex
            flexDirection="column"
            gap={1}
            color="neutral-6"
          >
            <Text textStyle="heading-small">{t('permissionComingSoonTitle')}</Text>
            <Text>{t('permissionComingSoonDescription')}</Text>
          </Flex>
        </Card>
      </Flex>
    </Flex>
  );
}
