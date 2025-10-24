import { Box, ComponentWithAs, Flex, IconProps } from '@chakra-ui/react';
import { Icon } from '@phosphor-icons/react';
import { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { Link, useMatch } from 'react-router-dom';

function LinkContent({
  labelKey,
  NavigationIcon,
  t,
  isActive,
  scope,
  customBgColor,
}: {
  labelKey: string;
  NavigationIcon: Icon | ComponentWithAs<'svg', IconProps>;
  t: TFunction;
  isActive: boolean;
  scope: 'internal' | 'external' | 'action';
  customBgColor?: string;
}) {
  const shouldApplyBorder = scope === 'internal' && isActive;
  const shouldApplyCustomBg = scope === 'action' && customBgColor;

  return (
    <Box p="0.25rem">
      <Flex
        py="6px"
        px="6px"
        borderRadius={{ md: 4 }}
        transition="all ease-out 300ms"
        _hover={{
          bgColor: shouldApplyCustomBg ? 'color-primary-500' : 'color-neutral-900',
        }}
        border={shouldApplyBorder ? `1px solid var(--colors-color-neutral-800)` : 'transparent'}
        bgColor={
          shouldApplyCustomBg
            ? customBgColor
            : shouldApplyBorder
              ? 'color-neutral-900'
              : 'transparent'
        }
      >
        <Box w={6}>
          <NavigationIcon
            size={24}
            w="1.5rem"
            h="1.5rem"
          />
        </Box>
        <Box
          mx={3}
          whiteSpace="nowrap"
        >
          {t(labelKey)}
        </Box>
      </Flex>
    </Box>
  );
}

export function NavigationLink({
  href,
  labelKey,
  testId,
  NavigationIcon,
  scope,
  closeDrawer,
  onClick,
  customBgColor,
  ...rest
}: {
  href?: string;
  labelKey: string;
  testId: string;
  NavigationIcon: Icon | ComponentWithAs<'svg', IconProps>;
  scope: 'internal' | 'external' | 'action';
  closeDrawer?: () => void;
  onClick?: () => void;
  customBgColor?: string;
}) {
  const { t } = useTranslation('navigation');
  const matchResult = useMatch(href?.substring(0, href.indexOf('?')) || '');
  const isActive = scope === 'internal' && href ? !!matchResult : false;

  const linkContent = (
    <LinkContent
      labelKey={labelKey}
      NavigationIcon={NavigationIcon}
      t={t}
      isActive={!!isActive}
      scope={scope}
      customBgColor={customBgColor}
    />
  );

  if (scope === 'internal') {
    return (
      <Link
        data-testid={testId}
        aria-label={t(labelKey)}
        to={href!}
        onClick={closeDrawer}
        {...rest}
      >
        {linkContent}
      </Link>
    );
  }

  if (scope === 'external') {
    return (
      <a
        data-testid={testId}
        aria-label={t(labelKey)}
        href={href!}
        onClick={closeDrawer}
        {...rest}
        target="_blank"
        rel="noreferrer noopener"
      >
        {linkContent}
      </a>
    );
  }

  if (scope === 'action') {
    return (
      <Box
        data-testid={testId}
        aria-label={t(labelKey)}
        cursor="pointer"
        onClick={() => {
          onClick?.();
          closeDrawer?.();
        }}
        {...rest}
      >
        {linkContent}
      </Box>
    );
  }

  return null;
}
