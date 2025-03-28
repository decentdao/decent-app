import { Box, CloseButton, Flex, Text, Image } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';

export function GaslessVoteSuccessModal({ close }: { close: () => void }) {
  const { t } = useTranslation('gaslessVoting');

  return (
    <Box>
      <Flex
        justify="flex-end"
        mb={6}
      >
        <CloseButton onClick={close} />
      </Flex>

      <Flex
        justify="center"
        alignItems="center"
        flexDirection="column"
        gap={4}
      >
        <Image
          src="/images/success-box.svg"
          alt={t('voteIsSponsoredTitle')}
          w="50%"
          mx="auto"
        />
        <Text textStyle="heading-medium">{t('voteIsSponsoredTitle')}</Text>
        <Text
          textStyle="labels-large"
          color="neutral-7"
        >
          {t('voteIsSponsoredSubtitle')}
        </Text>
      </Flex>
    </Box>
  );
}
