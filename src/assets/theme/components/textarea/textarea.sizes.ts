import { defineStyle } from '@chakra-ui/react';

const paddingBase = { px: '1rem' };
const paddingAddonLeft = { pl: '3rem', pr: '1rem' };
const paddingAddonRight = { pl: '1rem', pr: '4rem' };

const baseStyle = {
  apply: 'textStyles.text-base-regular',
  py: '1rem',
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

const sizes = {
  base,
  baseAddonLeft,
  baseAddonRight,
  baseWithAddons,
};

export default sizes;
