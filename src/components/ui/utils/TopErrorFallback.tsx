import { Box, Button, Flex, Hide, Image, Show, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useHeaderHeight } from '../../../constants/common';
import { BASE_ROUTES } from '../../../constants/routes';

export function TopErrorFallback() {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const HEADER_HEIGHT = useHeaderHeight();

  return (
    <Flex
      alignItems="center"
      justifyContent="center"
      minHeight={`calc(100vh - ${HEADER_HEIGHT} - 15rem)`}
      mt="6rem"
    >
      <Box
        borderRadius="0.5rem"
        bg="color-neutral-950"
        py="2rem"
        px={{ base: '1.25rem', md: '2rem' }}
        overflow="hidden"
      >
        <Flex gap="4rem">
          <Flex
            flexDir="column"
            gap="1rem"
            justifyContent="center"
            width={{ base: 'full', md: '50%' }}
          >
            <Text textStyle="text-3xl-regular">{t('errorSentryFallbackTitle')}</Text>
            <Text textStyle="text-2xl-regular">{t('errorSentryFallbackMessage')}</Text>
            <Flex
              flexDir="column"
              gap="1rem"
            >
              <Hide above="md">
                <Image
                  src="/images/tools.svg"
                  alt={t('errorSentryFallbackTitle')}
                  w="50%"
                  mx="auto"
                />
              </Hide>
              <Button
                w="fit-content"
                mx={{ base: 'auto', md: 'unset' }}
                onClick={() => navigate(BASE_ROUTES.landing)}
              >
                {t('goHome')}
              </Button>
            </Flex>
          </Flex>
          <Show above="md">
            <Image
              src="/images/tools.svg"
              alt={t('errorSentryFallbackTitle')}
              width="100%"
              mb="-6rem"
            />
          </Show>
        </Flex>
      </Box>
    </Flex>
  );
}
