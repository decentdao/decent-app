import { Box, Button, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import Divider from '../utils/Divider';

export function ConfirmUrlModal({ url, close }: { url: string; close: () => void }) {
  const { t } = useTranslation('modals');
  return (
    <Box>
      <Text
        marginBottom="1rem"
        color="color-neutral-300"
      >
        {url}
      </Text>
      <Divider marginBottom="1rem" />
      <Text marginBottom="1rem">{t('confirmAction')}</Text>
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
      >
        <Button
          width="100%"
          onClick={close}
        >
          {t('modalContinue')}
        </Button>
      </a>
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
