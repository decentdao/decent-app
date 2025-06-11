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
    >
      <Flex
        justifyContent="space-between"
        alignItems="center"
      >
        <Text textStyle="text-xl-regular">{t('addPermissionTitle')}</Text>
        <Show above="md">
          <IconButton
            variant="ghost"
            color="color-lilac-100"
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
          bg="color-neutral-900"
          _hover={{
            backgroundColor: 'white-alpha-04',
          }}
          onClick={() => {
            closeModal();
            openAddCreateProposalPermissionModal();
          }}
        >
          <Box color="color-lilac-100">
            <Scroll size={24} />
          </Box>
          <Flex
            flexDirection="column"
            gap={1}
          >
            <Text textStyle="text-xl-regular">{t('permissionCreateProposalsTitle')}</Text>
            <Text color="color-neutral-300">{t('permissionCreateProposalsDescription')}</Text>
          </Flex>
        </Card>

        <Card
          display="flex"
          flexDirection="column"
          gap={2}
          _hover={{}}
          cursor="not-allowed"
        >
          <Box color="color-neutral-400">
            <CheckSquare size={24} />
          </Box>
          <Flex
            flexDirection="column"
            gap={1}
            color="color-neutral-400"
          >
            <Text textStyle="text-xl-regular">{t('permissionComingSoonTitle')}</Text>
            <Text>{t('permissionComingSoonDescription')}</Text>
          </Flex>
        </Card>
      </Flex>
    </Flex>
  );
}
