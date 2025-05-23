import { inputAnatomy } from '@chakra-ui/anatomy';
import { createMultiStyleConfigHelpers, defineStyle } from '@chakra-ui/react';

const { definePartsStyle } = createMultiStyleConfigHelpers(inputAnatomy.keys);

const paddingBase = { px: '1rem' };
const paddingAddonLeft = { pl: '3rem', pr: '1rem' };
const paddingAddonRight = { pl: '1rem', pr: '4rem' };

const baseStyle = {
  apply: 'textStyles.text-base-regular',
  height: '2.5rem',
};
const base = defineStyle({
  ...baseStyle,
  ...paddingBase,
});

const baseAddonLeft = defineStyle({
  ...baseStyle,
  ...paddingAddonLeft,
});
const baseAddonRight = defineStyle({
  ...baseStyle,
  ...paddingAddonRight,
});

const baseWithAddons = defineStyle({
  ...baseStyle,
  ...paddingAddonRight,
  ...paddingAddonLeft,
});

const xlStyle = {
  apply: 'text-base-regular',
  h: '4.375rem',
};

const xl = defineStyle({
  ...xlStyle,
  ...paddingBase,
});

const xlAddonLeft = defineStyle({
  ...xlStyle,
  ...paddingAddonLeft,
});
const xlAddonRight = defineStyle({
  ...xlStyle,
  ...paddingAddonRight,
});

const xlWithAddons = defineStyle({
  ...xlStyle,
  ...paddingAddonRight,
  ...paddingAddonLeft,
});

const sizes = {
  base: definePartsStyle({ field: base, addon: base }),
  baseAddonLeft: definePartsStyle({ field: baseAddonLeft, addon: baseAddonLeft }),
  baseAddonRight: definePartsStyle({ field: baseAddonRight, addon: baseAddonRight }),
  baseWithAddons: definePartsStyle({ field: baseWithAddons, addon: baseWithAddons }),
  xl: definePartsStyle({ field: xl, addon: xl }),
  xlAddonLeft: definePartsStyle({ field: xlAddonLeft, addon: xlAddonLeft }),
  xlAddonRight: definePartsStyle({ field: xlAddonRight, addon: xlAddonRight }),
  xlWithAddons: definePartsStyle({ field: xlWithAddons, addon: xlWithAddons }),
};

export default sizes;
