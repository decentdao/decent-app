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

const variants = {
  twoTone: twoToneVariant,
};

const tabsTheme = defineMultiStyleConfig({ variants });
export default tabsTheme;
