import { Center, Text, Flex, Box, Show, Hide } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import {
  StetoscopeIllustrationMobile,
  StetoscopeIllustrationDesktop,
} from '../components/ui/icons/Icons';
import { CONTENT_MAXW } from '../constants/common';
import { useNetworkConfigStore } from '../providers/NetworkConfig/useNetworkConfigStore';

function LoadingProblem({
  type,
}: {
  type: 'invalidSafe' | 'badQueryParam' | 'badQueryParamAppUrl';
}) {
  const { chain } = useNetworkConfigStore();
  const { t } = useTranslation('common');

  return (
    <Center
      mt={6}
      px={{ base: 0, lg: '3.5rem' }}
      maxW={CONTENT_MAXW}
    >
      <Flex
        bg="color-neutral-950"
        border="1px solid"
        borderColor="color-neutral-900"
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
          color="color-white"
          pt={{ base: 0, lg: '2.25rem' }}
          pb={{ base: '1.5rem', lg: '4.5rem' }}
        >
          <Text
            w="full"
            textStyle="text-3xl-regular"
          >
            {t('errorSentryFallbackTitle')}
          </Text>
          <Text
            textStyle="text-2xl-regular"
            mt="0.5rem"
          >
            {t(`${type}1`, { chain: chain.name })}
          </Text>
          <Text textStyle="text-2xl-regular">{t(`${type}2`)}</Text>
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
