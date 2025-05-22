import { Button, Flex, Text, Image } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { DAO_ROUTES } from '../../../constants/routes';
import { useCurrentDAOKey } from '../../../hooks/DAO/useCurrentDAOKey';
import { useNetworkConfigStore } from '../../../providers/NetworkConfig/useNetworkConfigStore';

export function ConfirmModifyGovernanceModal({
  onClose,
  closeAll,
}: {
  onClose: () => void;
  closeAll: () => void;
}) {
  const { t } = useTranslation('modals');
  const { safeAddress } = useCurrentDAOKey();
  const { addressPrefix } = useNetworkConfigStore();

  if (!safeAddress) {
    return null;
  }

  return (
    <Flex
      flexDirection="column"
      gap={4}
      pt={2}
      alignItems="center"
    >
      <Image src="/images/warning-yellow.svg" />

      <Text textStyle="heading-medium">{t('confirmModifyGovernanceTitle')}</Text>
      <Text
        marginBottom="1rem"
        textStyle="label-large"
        color="neutral-7"
      >
        {t('confirmModifyGovernanceDesc')}
      </Text>

      <Flex
        flexDirection="row"
        gap={4}
        alignItems="center"
      >
        <Button
          size="md"
          px={8}
          py={3}
          width="100%"
          variant="secondary"
          onClick={onClose}
        >
          {t('modalCancel')}
        </Button>
        <Link to={DAO_ROUTES.modifyGovernance.relative(addressPrefix, safeAddress)}>
          <Button
            size="md"
            px={8}
            py={3}
            width="100%"
            onClick={closeAll}
          >
            {t('modalContinue')}
          </Button>
        </Link>
      </Flex>
    </Flex>
  );
}
