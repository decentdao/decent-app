import { Box, Button, Flex, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';

export function GaslessVoteFailedModal({
  onCancel,
  onRetry,
  onFallback,
}: {
  onCancel: () => void;
  onRetry: () => void;
  onFallback: () => void;
}) {
  const { t } = useTranslation('gaslessVoting');

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
          textStyle="heading-medium"
        >
          {t('gaslessVoteFailed')}
        </Text>
        <Flex gap={2}>
          <Button
            variant="secondary"
            onClick={onRetry}
          >
            {t('gaslessVoteFailedRetry')}
          </Button>
          <Button
            variant="secondary"
            onClick={onFallback}
          >
            {t('gaslessVoteFailedFallback')}
          </Button>
          <Button
            variant="secondary"
            onClick={onCancel}
          >
            {t('gaslessVoteFailedCancel')}
          </Button>
        </Flex>
      </Flex>
    </Box>
  );
}
