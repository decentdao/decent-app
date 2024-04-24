import { Box, ComponentWithAs, Hide, IconProps, Text } from '@chakra-ui/react';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useMatch } from 'react-router-dom';
import { NavigationTooltip } from './NavigationTooltip';

interface INavigationLink {
  href: string;
  labelKey: string;
  tooltipKey?: string;
  testId: string;
  Icon: ComponentWithAs<'svg', IconProps>;
  target?: string;
  rel?: string;
  closeDrawer?: () => void;
}

export function NavigationLink({
  labelKey,
  testId,
  Icon,
  tooltipKey,
  closeDrawer,
  href,
  ...rest
}: INavigationLink) {
  const tooltipTranslationKey = tooltipKey || labelKey;

  const { t } = useTranslation('navigation');
  const isActive = useMatch(href);

  const activeColors = useCallback(() => {
    return {
      color: isActive ? 'gold.500' : 'inherit',
      _hover: {
        color: 'gold.500-hover',
      },
    };
  }, [isActive]);

  return (
    <NavigationTooltip label={t(tooltipTranslationKey)}>
      <Link
        data-testid={testId}
        aria-label={t(tooltipTranslationKey)}
        to={href}
        {...rest}
        onClick={closeDrawer}
      >
        <Box
          display={{ base: 'flex', md: undefined }}
          gap={8}
          justifyContent="space-between"
          alignItems="center"
          my={3}
          {...activeColors()}
        >
          <Icon
            boxSize="1.5rem"
            sx={{
              'g path': {
                transitionProperty: 'all',
                transitionDuration: '300ms',
                transitionTimingFunction: 'ease-out',
              },
            }}
          />
          <Hide above="md">
            <Text textStyle="text-md-mono-medium">{t(labelKey)}</Text>
          </Hide>
        </Box>
      </Link>
    </NavigationTooltip>
  );
}
