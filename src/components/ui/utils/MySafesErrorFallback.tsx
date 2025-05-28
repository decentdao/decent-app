import { Box, Text } from '@chakra-ui/react';
import { t } from 'i18next';

export function MySafesErrorFallback() {
  return (
    <Box
      p="1rem"
      maxW="100%"
      bg="color-neutral-950"
      borderRadius="0.5rem"
    >
      <Text
        color="white-alpha-16"
        align="center"
      >
        {t('errorMySafesNotLoaded', { ns: 'common' })}
      </Text>
    </Box>
  );
}
