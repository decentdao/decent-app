import { Box, Button, Flex, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';

export function GaslessVoteFailedModal({
  close,
  onRetry,
  onFallback,
}: {
  close: () => void;
  onRetry: () => void;
  onFallback: () => void;
}) {
  const { t } = useTranslation('gaslessVoting');

  const handleButtonClick = (onClick: () => void) => {
    onClick();
    close();
  };

  return (
    <Box>
      <Flex
        justify="center"
        alignItems="center"
        flexDirection="column"
        gap={4}
        p={6}
      >
        <Text
          textAlign="center"
          textStyle="text-2xl-regular"
        >
          {t('gaslessVoteFailed')}
        </Text>
        <Flex gap={2}>
          <Button
            variant="secondary"
            onClick={() => handleButtonClick(onRetry)}
          >
            {t('gaslessVoteFailedRetry')}
          </Button>
          <Button
            variant="secondary"
            onClick={() => handleButtonClick(onFallback)}
          >
            {t('gaslessVoteFailedFallback')}
          </Button>
          <Button
            variant="secondary"
            onClick={close}
          >
            {t('gaslessVoteFailedCancel')}
          </Button>
        </Flex>
      </Flex>
    </Box>
  );
}
