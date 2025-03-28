import { alertAnatomy } from '@chakra-ui/anatomy';
import { createMultiStyleConfigHelpers } from '@chakra-ui/react';

const { definePartsStyle } = createMultiStyleConfigHelpers(alertAnatomy.keys);

const baseStyle = definePartsStyle({
  title: {
    display: 'flex',
    alignItems: 'center',
    textStyle: 'helper-text',
  },
  container: {
    border: '1px solid',
    borderRadius: '12px',
    p: '1rem',
  },
  description: {
    display: 'flex',
    alignItems: 'center',
    textStyle: 'helper-text',
  },
  icon: {
    '& > svg': {
      boxSize: '1.5rem',
    },
  },
  spinner: {},
});

export default baseStyle;
