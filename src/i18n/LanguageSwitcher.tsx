import { Box, Flex } from '@chakra-ui/react';
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
    <OptionMenu
      offset={[16, 8]}
      trigger={
        <Flex>
          <Box w={6}>
            <GlobeSimple size={24} />
          </Box>
          <Box ml={3}>{t('tooltipTitle')}</Box>
        </Flex>
      }
      options={supported}
      namespace="languages"
      buttonProps={{
        width: 'full',
      }}
    />
  );
}
