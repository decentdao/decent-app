import { alertAnatomy } from '@chakra-ui/anatomy';
import { createMultiStyleConfigHelpers } from '@chakra-ui/react';

const { definePartsStyle } = createMultiStyleConfigHelpers(alertAnatomy.keys);

const info = definePartsStyle({
  title: {},
  container: {
    bg: 'neutral-3',
    border: '1px solid',
    borderColor: 'neutral-4',
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
