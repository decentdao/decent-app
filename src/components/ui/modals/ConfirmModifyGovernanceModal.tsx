import { Box, Button, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { DAO_ROUTES } from '../../../constants/routes';
import { useCurrentDAOKey } from '../../../hooks/DAO/useCurrentDAOKey';
import { useNetworkConfigStore } from '../../../providers/NetworkConfig/useNetworkConfigStore';
import Divider from '../utils/Divider';

export function ConfirmModifyGovernanceModal({ close }: { close: () => void }) {
  const { t } = useTranslation('modals');
  const { safeAddress } = useCurrentDAOKey();
  const { addressPrefix } = useNetworkConfigStore();

  if (!safeAddress) {
    return null;
  }

  return (
    <Box>
      <Text marginBottom="1rem">{t('confirmModifyGovernanceDescription')}</Text>
      <Divider marginBottom="1rem" />
      <Text
        marginBottom="1rem"
        textStyle="heading-medium"
      >
        {t('confirmAction')}
      </Text>
      <Link to={DAO_ROUTES.modifyGovernance.relative(addressPrefix, safeAddress)}>
        <Button
          width="100%"
          onClick={close}
        >
          {t('modalContinue')}
        </Button>
      </Link>
      <Button
        marginTop="0.5rem"
        width="100%"
        variant="tertiary"
        onClick={close}
      >
        {t('modalCancel')}
      </Button>
    </Box>
  );
}
