import { Box, Flex, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { CircleLoader } from '../../loaders/CircleLoader';

export function GaslessVoteLoadingModal() {
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
        <CircleLoader />
        <Text
          textAlign="center"
          textStyle="text-2xl-regular"
        >
          {t('voteIsSponsoredLoading')}
        </Text>
      </Flex>
    </Box>
  );
}
