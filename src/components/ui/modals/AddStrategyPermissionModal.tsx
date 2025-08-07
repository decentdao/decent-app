import { Box, Flex, IconButton, Show, Text } from '@chakra-ui/react';
import { CheckSquare, Scroll, X } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { useCurrentDAOKey } from '../../../hooks/DAO/useCurrentDAOKey';
import { useDAOStore } from '../../../providers/App/AppProvider';
import { Card } from '../cards/Card';

export function AddStrategyPermissionModal({
  closeModal,
  openAddCreateProposalPermissionModal,
}: {
  closeModal: () => void;
  openAddCreateProposalPermissionModal: () => void;
}) {
  const { t } = useTranslation(['settings', 'common']);
  const { daoKey } = useCurrentDAOKey();
  const {
    node: { safe },
  } = useDAOStore({ daoKey });

  if (!safe) {
    return null;
  }

  return (
    <Flex
      gap={4}
      flexDirection="column"
      px={{ base: 4, md: 0 }}
      data-testid="add-strategy-permission-modal"
    >
      <Flex
        justifyContent="space-between"
        alignItems="center"
        data-testid="add-strategy-permission-header"
      >
        <Text
          textStyle="text-xl-regular"
          data-testid="add-strategy-permission-title"
        >
          {t('addPermissionTitle')}
        </Text>
        <Show above="md">
          <IconButton
            variant="ghost"
            color="color-lilac-100"
            aria-label={t('close', { ns: 'common' })}
            onClick={closeModal}
            icon={<X size={24} />}
            data-testid="add-strategy-permission-close-button"
          />
        </Show>
      </Flex>
      <Flex
        gap={2}
        data-testid="add-strategy-permission-options"
      >
        <Card
          display="flex"
          flexDirection="column"
          gap={2}
          bg="color-neutral-900"
          _hover={{
            backgroundColor: 'white-alpha-04',
          }}
          onClick={() => {
            closeModal();
            openAddCreateProposalPermissionModal();
          }}
          data-testid="add-strategy-permission-create-proposals-card"
        >
          <Box
            color="color-lilac-100"
            data-testid="add-strategy-permission-create-proposals-icon"
          >
            <Scroll size={24} />
          </Box>
          <Flex
            flexDirection="column"
            gap={1}
            data-testid="add-strategy-permission-create-proposals-content"
          >
            <Text
              textStyle="text-xl-regular"
              data-testid="add-strategy-permission-create-proposals-title"
            >
              {t('permissionCreateProposalsTitle')}
            </Text>
            <Text
              color="color-neutral-300"
              data-testid="add-strategy-permission-create-proposals-description"
            >
              {t('permissionCreateProposalsDescription')}
            </Text>
          </Flex>
        </Card>

        <Card
          display="flex"
          flexDirection="column"
          gap={2}
          _hover={{}}
          cursor="not-allowed"
          data-testid="add-strategy-permission-coming-soon-card"
        >
          <Box
            color="color-neutral-400"
            data-testid="add-strategy-permission-coming-soon-icon"
          >
            <CheckSquare size={24} />
          </Box>
          <Flex
            flexDirection="column"
            gap={1}
            color="color-neutral-400"
            data-testid="add-strategy-permission-coming-soon-content"
          >
            <Text
              textStyle="text-xl-regular"
              data-testid="add-strategy-permission-coming-soon-title"
            >
              {t('permissionComingSoonTitle')}
            </Text>
            <Text data-testid="add-strategy-permission-coming-soon-description">
              {t('permissionComingSoonDescription')}
            </Text>
          </Flex>
        </Card>
      </Flex>
    </Flex>
  );
}
