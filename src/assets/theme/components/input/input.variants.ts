import { defineStyle } from '@chakra-ui/react';

const unstyled = defineStyle({
  field: {
    border: 'none',
    boxShadow: 'none',
    bg: 'transparent',
    color: 'inherit',
    padding: '0',
    lineHeight: '1',
    minHeight: 'auto',
    height: 'auto',
    margin: '0',
    width: '100%',
    _placeholder: {
      color: 'inherit',
    },
    _focus: {
      outline: 'none',
      boxShadow: 'none',
    },
    _hover: {
      bg: 'transparent',
      border: 'none',
      boxShadow: 'none',
    },
    _disabled: {
      bg: 'transparent',
      color: 'inherit',
      cursor: 'not-allowed',
    },
  },
});

export default {
  unstyled,
};
