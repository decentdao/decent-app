import { tabsAnatomy } from '@chakra-ui/anatomy';
import { createMultiStyleConfigHelpers } from '@chakra-ui/react';
import { CARD_SHADOW, TAB_SHADOW } from '../../../../constants/common';

const { definePartsStyle, defineMultiStyleConfig } = createMultiStyleConfigHelpers(
  tabsAnatomy.keys,
);

const twoToneVariant = definePartsStyle({
  tablist: {
    boxShadow: TAB_SHADOW,
    padding: '0.25rem',
    borderRadius: '0.5rem',
    gap: '0.25rem',
    bg: 'color-black',
    width: 'fit-content',
  },
  tab: {
    padding: '0.5rem 1rem',
    width: { base: 'full', md: 'fit-content' },
    borderRadius: '0.25rem',
    whiteSpace: 'nowrap',
    color: 'color-neutral-400',
    _selected: {
      background: 'color-neutral-950',
      color: 'color-lilac-100',
      boxShadow: CARD_SHADOW,
    },
  },
});

const solidVariant = definePartsStyle({
  tablist: {
    padding: '0.25rem',
    alignItems: 'flex-start',
    gap: '0.5rem',
    borderRadius: '0.75rem',
    borderTop: '1px solid var(--colors-color-alpha-white-900)',
    background: 'color-secondary-950',
    boxShadow: '0px 0px 0px 1px var(--colors-color-alpha-white-950)',
  },
  tab: {
    padding: '0.25rem 0.75rem',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: '0.5rem',
    boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.05)',
    textColor: 'color-content-muted',
    _selected: {
      background: 'color-content-content3',
      textColor: 'color-layout-foreground',
    },
  },
});

const underlinedVariant = definePartsStyle({
  tablist: {
    padding: '0.25rem',
    alignItems: 'flex-start',
    gap: '0.5rem',
  },
  tab: {
    padding: '0.25rem 0.75rem',
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.05)',
    textColor: 'color-content-muted',
    _selected: {
      borderBottom: '2px solid var(--colors-color-base-neutral-foreground)',
      textColor: 'color-base-neutral-foreground',
    },
  },
});

const variants = {
  solid: solidVariant,
  twoTone: twoToneVariant,
  underlined: underlinedVariant,
};

const tabsTheme = defineMultiStyleConfig({ variants });
export default tabsTheme;
