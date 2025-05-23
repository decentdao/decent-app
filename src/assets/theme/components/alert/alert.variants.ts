import { alertAnatomy } from '@chakra-ui/anatomy';
import { createMultiStyleConfigHelpers } from '@chakra-ui/react';

const { definePartsStyle } = createMultiStyleConfigHelpers(alertAnatomy.keys);

const info = definePartsStyle({
  title: {},
  container: {
    bg: 'color-neutral-900',
    border: '1px solid',
    borderColor: 'color-neutral-800',
    color: 'color-lilac-100',
  },
  description: {},
  icon: {
    color: 'color-lilac-100',
  },
  spinner: {},
});

const alertVariants = {
  info,
};

export default alertVariants;
