import { Box, Center, Hide, Text } from '@chakra-ui/react';
import { GlobeSimple } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { OptionMenu } from '../components/ui/menus/OptionMenu';
import { supportedLanguages } from '.';

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation('languages');

  const supported = Object.keys(supportedLanguages).map(function (languageCode) {
    return {
      optionKey: languageCode,
      onClick: () => i18n.changeLanguage(languageCode),
    };
  });
  return (
    <Center>
      <OptionMenu
        offset={[16, 8]}
        trigger={
          <Box
            display={{ base: 'flex', md: undefined }}
            gap={8}
            justifyContent="space-between"
            alignItems="center"
            my={3}
          >
            <GlobeSimple size={24} />
            <Hide above="md">
              <Text textStyle="text-md-mono-medium">{t(i18n.language.slice(0, 2))}</Text>
            </Hide>
          </Box>
        }
        options={supported}
        namespace="languages"
        tooltipKey="tooltipTitle"
      />
    </Center>
  );
}
