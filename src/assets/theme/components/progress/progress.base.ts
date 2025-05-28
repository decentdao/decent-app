import { progressAnatomy } from '@chakra-ui/anatomy';
import { createMultiStyleConfigHelpers } from '@chakra-ui/react';

const { definePartsStyle } = createMultiStyleConfigHelpers(progressAnatomy.keys);

const baseStyles = definePartsStyle({
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

export default baseStyles;
