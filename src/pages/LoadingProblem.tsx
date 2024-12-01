import { Center, Text, Flex, Box, Show, Hide } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import {
  StetoscopeIllustrationMobile,
  StetoscopeIllustrationDesktop,
} from '../components/ui/icons/Icons';
import { CONTENT_MAXW } from '../constants/common';
import { useNetworkConfig } from '../providers/NetworkConfig/NetworkConfigProvider';

function LoadingProblem({ type }: { type: 'invalidSafe' | 'wrongNetwork' | 'badQueryParam' }) {
  const { chain } = useNetworkConfig();
  const { t } = useTranslation('common');

  return (
    <Center
      mt={6}
      px={{ base: 0, lg: '3.5rem' }}
      maxW={CONTENT_MAXW}
    >
      <Flex
        bg="neutral-2"
        border="1px solid"
        borderColor="neutral-3"
        borderRadius={8}
        justifyContent={{ base: 'center', lg: 'space-between' }}
        w={{ base: '100%', lg: '93%' }}
        pl={{ base: '1.5rem', lg: '3rem' }}
        pr={{ base: '1.5rem', lg: 0 }}
        pt={{ base: '1.5rem', lg: '2rem' }}
        flexWrap={{ base: 'wrap', lg: 'nowrap' }}
      >
        <Box
          w={{ base: 'full', lg: '250px' }}
          color="white-0"
          pt={{ base: 0, lg: '2.25rem' }}
          pb={{ base: '1.5rem', lg: '4.5rem' }}
        >
          <Text
            w="full"
            textStyle={{ base: 'display-2xl', lg: 'heading-large' }}
          >
            {t('errorSentryFallbackTitle')}
          </Text>
          <Text
            textStyle={{ base: 'display-lg', lg: 'display-xl' }}
            mt="0.5rem"
          >
            {t(`${type}1`, { chain: chain.name })}
          </Text>
          <Text textStyle={{ base: 'display-lg', lg: 'display-xl' }}>{t(`${type}2`)}</Text>
        </Box>
        <Flex alignItems="flex-end">
          <Hide above="lg">
            <StetoscopeIllustrationMobile />
          </Hide>
          <Show above="lg">
            <StetoscopeIllustrationDesktop />
          </Show>
        </Flex>
      </Flex>
    </Center>
  );
}

export default LoadingProblem;
