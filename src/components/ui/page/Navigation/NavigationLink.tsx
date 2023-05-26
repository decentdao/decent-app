import { Box, ComponentWithAs, Hide, IconProps, Text } from '@chakra-ui/react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
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
  return (
    <NavigationTooltip label={t(tooltipTranslationKey)}>
      <Link
        data-testid={testId}
        aria-label={t(tooltipTranslationKey)}
        href={href}
        {...rest}
        onClick={closeDrawer}
      >
        <Box
          display={{ base: 'flex', md: undefined }}
          gap={8}
          justifyContent="space-between"
          alignItems="center"
        >
          <Icon boxSize="1.5rem" />
          <Hide above="md">
            <Text textStyle="text-md-mono-medium">{t(labelKey)}</Text>
          </Hide>
        </Box>
      </Link>
    </NavigationTooltip>
  );
}
