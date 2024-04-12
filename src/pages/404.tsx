import { AbsoluteCenter, Button, ChakraProvider, Image, Text, VStack } from '@chakra-ui/react';
import { I18nextProvider, useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { theme } from '../assets/theme';
import { BASE_ROUTES } from '../constants/routes';
import i18n from '../i18n';

export default function FourOhFourPage() {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const home = () => {
    navigate(BASE_ROUTES.landing);
  };
  return (
    <ChakraProvider theme={theme}>
      <I18nextProvider i18n={i18n}>
        <AbsoluteCenter>
          <VStack>
            <Image
              width={252}
              height={48}
              src="/images/fractal-text-logo.svg"
              alt="Fractal Logo"
            />
            <Text
              paddingTop="3.25rem"
              data-testid="404-pageCode"
              textStyle="text-6xl-mono-regular"
              color="grayscale.100"
            >
              404
            </Text>
            <Text
              data-testid="404-pageTitle"
              textStyle="text-mono-regular"
              color="grayscale.100"
              marginTop="0.5rem"
              paddingBottom="3.25rem"
            >
              {t('404Title')}
            </Text>
            <Button
              onClick={home}
              data-testid={'404-linkHome'}
            >
              {t('404Button')}
            </Button>
          </VStack>
        </AbsoluteCenter>
      </I18nextProvider>
    </ChakraProvider>
  );
}
