import { progressAnatomy } from '@chakra-ui/anatomy';
import { createMultiStyleConfigHelpers } from '@chakra-ui/react';

const { definePartsStyle } = createMultiStyleConfigHelpers(progressAnatomy.keys);

const defaultVariant = definePartsStyle({
  track: {
    bg: 'color-neutral-950',
    borderRadius: '4px',
  },
  filledTrack: {
    bg: 'color-lilac-600',
    borderRadius: '4px',
  },
  label: {},
});

const primaryVariant = definePartsStyle({
  track: {
    bg: 'color-alpha-white-900',
    borderRadius: 'full',
  },
  filledTrack: {
    bg: 'color-lilac-100',
    borderRadius: 'full',
  },
  label: {},
});

const variants = {
  default: defaultVariant,
  primary: primaryVariant,
};

export default variants;
