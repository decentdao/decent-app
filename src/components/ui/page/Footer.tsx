import { Box, Icon as ChakraIcon, ComponentWithAs, Flex, IconProps } from '@chakra-ui/react';
import { DiscordLogo, Icon, TelegramLogo, XLogo } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { WarpcastIcon } from '../../../assets/theme/custom/icons/WarpcastIcon';
import {
  URL_DECENT,
  URL_DISCORD,
  URL_TELEGRAM,
  URL_TWITTER,
  URL_WARPCAST,
} from '../../../constants/url';
import { DemoModeButton } from '../../../utils/demoMode';
import ExternalLink from '../links/ExternalLink';

function NavigationIconLink(props: {
  DisplayIcon: Icon | ComponentWithAs<'svg', IconProps>;
  to: string;
  ariaLabel: string;
}) {
  const { t } = useTranslation('navigation');
  const { DisplayIcon, to, ariaLabel } = props;
  return (
    <Link
      aria-label={t(ariaLabel)}
      to={to}
    >
      <Box p="0.25rem">
        <Flex
          py="6px"
          px="6px"
          borderRadius={{ md: 4 }}
          transition="all ease-out 300ms"
          _hover={{ bgColor: 'neutral-3' }}
        >
          <ChakraIcon
            as={DisplayIcon}
            boxSize="1rem"
          />
        </Flex>
      </Box>
    </Link>
  );
}

export function Footer() {
  const { t } = useTranslation(['navigation', 'home']);
  return (
    <Flex
      w="100%"
      flexWrap="wrap"
      justifyContent={{ base: 'flex-start', md: 'center' }}
      alignItems="center"
      gap={4}
    >
      <Flex>
        <ExternalLink href="/docs/fractal_audit.pdf">{t('audit', { ns: 'home' })}</ExternalLink>
        <ExternalLink
          href={`https://github.com/decentdao/decent-interface/releases/tag/v${import.meta.env.PACKAGE_VERSION}`}
        >
          v{import.meta.env.PACKAGE_VERSION}
        </ExternalLink>
      </Flex>

      <ExternalLink
        href={URL_DECENT}
        styleVariant="grey"
        fontSize="1.2rem"
      >
        {t('madeWithLove', { ns: 'home' })}
      </ExternalLink>

      <Flex
        gap={4}
        alignItems="center"
      >
        <NavigationIconLink
          to={URL_TELEGRAM}
          ariaLabel="navigationExternalTelegram"
          DisplayIcon={TelegramLogo}
        />
        <NavigationIconLink
          to={URL_TWITTER}
          ariaLabel="navigationExternalX"
          DisplayIcon={XLogo}
        />
        <NavigationIconLink
          to={URL_WARPCAST}
          ariaLabel="navigationExternalWarpcast"
          DisplayIcon={WarpcastIcon}
        />
        <NavigationIconLink
          to={URL_DISCORD}
          ariaLabel="navigationExternalDiscord"
          DisplayIcon={DiscordLogo}
        />
      </Flex>
      <DemoModeButton />
    </Flex>
  );
}
