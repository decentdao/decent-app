import { progressAnatomy } from '@chakra-ui/anatomy';
import { createMultiStyleConfigHelpers } from '@chakra-ui/react';

const { definePartsStyle } = createMultiStyleConfigHelpers(progressAnatomy.keys);

const baseStyles = definePartsStyle({
  track: {},
  filledTrack: {},
  label: {},
});

export default baseStyles;
