import { Box, Button, Flex, Text } from '@chakra-ui/react';
import { Trash, WarningCircle } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';

export default function PaymentCancelConfirmModal({
  onSubmit,
  closeModal,
}: {
  onSubmit: () => void;
  closeModal: () => void;
}) {
  const { t } = useTranslation(['roles', 'common']);

  return (
    <Flex
      gap="1rem"
      flexDirection="column"
      maxWidth="320px"
      mx="auto"
    >
      <Flex
        justifyContent="center"
        alignItems="center"
      >
        <WarningCircle size="40" />
      </Flex>
      <Box
        px={4}
        textAlign="center"
      >
        <Text textStyle="text-2xl-regular">{t('confirmCancelPaymentTitle')}</Text>
        <Text>{t('confirmCancelPaymentBody')}</Text>
      </Box>
      <Flex
        gap="1rem"
        justifyContent="space-between"
        mt="0.5rem"
      >
        <Button
          color="color-error-400"
          borderColor="color-error-400"
          _hover={{ color: 'color-error-500', borderColor: 'color-error-500' }}
          variant="secondary"
          leftIcon={<Trash />}
          onClick={() => {
            onSubmit();
            closeModal();
          }}
        >
          {t('cancelPayment')}
        </Button>
        <Button
          onClick={closeModal}
          width="100%"
        >
          {t('cancel', { ns: 'common' })}
        </Button>
      </Flex>
    </Flex>
  );
}
