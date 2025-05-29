import { Button, Flex, Text, Image } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { DAO_ROUTES } from '../../../constants/routes';
import { useCurrentDAOKey } from '../../../hooks/DAO/useCurrentDAOKey';
import { useNetworkConfigStore } from '../../../providers/NetworkConfig/useNetworkConfigStore';

export function ConfirmModifyGovernanceModal({
  onClose,
  closeAllModals,
}: {
  onClose: () => void;
  closeAllModals: () => void;
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

      <Text textStyle="text-2xl-regular">{t('confirmModifyGovernanceTitle')}</Text>
      <Text
        marginBottom="1rem"
        textStyle="label-large"
        color="color-neutral-300"
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
            onClick={closeAllModals}
          >
            {t('modalContinue')}
          </Button>
        </Link>
      </Flex>
    </Flex>
  );
}
