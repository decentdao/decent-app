import { Box, Button, Flex, Icon, Text } from '@chakra-ui/react';
import { Cardholder, Gauge } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';

export function CreateSmartWalletModal({ close }: { close: () => void }) {
  const { t } = useTranslation('gaslessVoting');

  const handleCreateSmartWalletSubmit = async () => {
    close();
  };

  return (
    <Box>
      <Flex
        justify="space-between"
        flexDirection="column"
        gap={4}
      >
        <Text textStyle="heading-medium">{t('createSmartWallet')}</Text>
        <Text
          textStyle="labels-large"
          color="neutral-7"
        >
          {t('createSmartWalletDescription')}
        </Text>
      </Flex>

      <Flex
        marginTop="2rem"
        flexDirection="column"
        gap={4}
      >
        <Flex
          alignItems="flex-start"
          gap={4}
        >
          <Icon
            as={Gauge}
            color="lilac-0"
            boxSize="24px"
            mt={0.25}
          />
          <Text
            textStyle="body-small"
            mt={0}
          >
            {t('cancelCreateSmartWalletConsequence')}
          </Text>
        </Flex>
        <Flex
          alignItems="flex-start"
          gap={4}
        >
          <Icon
            as={Cardholder}
            color="lilac-0"
            boxSize="24px"
            mt={0.25}
          />
          <Text textStyle="body-small">{t('createSmartWalletOneTimeGasFeeNotice')}</Text>
        </Flex>
      </Flex>

      <Flex
        justifyContent="flex-end"
        gap={2}
        mt={6}
      >
        <Button
          variant="secondary"
          onClick={close}
        >
          {t('cancelCreateSmartWallet')}
        </Button>
        <Button
          type="submit"
          onClick={handleCreateSmartWalletSubmit}
        >
          {t('proceedCreateSmartWallet')}
        </Button>
      </Flex>
    </Box>
  );
}
