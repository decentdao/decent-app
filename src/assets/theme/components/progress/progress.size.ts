import { progressAnatomy } from '@chakra-ui/anatomy';
import { createMultiStyleConfigHelpers } from '@chakra-ui/react';

const { definePartsStyle } = createMultiStyleConfigHelpers(progressAnatomy.keys);

const base = definePartsStyle({
  track: {},
  label: {},
  filledTrack: {
    height: '1.5rem',
  },
});

const small = definePartsStyle({
  track: {},
  label: {},
  filledTrack: {
    height: '8px',
  },
});

const sizes = {
  base,
  small,
};

export default sizes;
