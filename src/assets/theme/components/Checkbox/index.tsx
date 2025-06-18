// theme/components/checkbox.ts
// Chakra UI v2 – Checkbox component theme skeleton

import { checkboxAnatomy } from '@chakra-ui/anatomy';
import { createMultiStyleConfigHelpers, defineStyle, theme } from '@chakra-ui/react';
import type { ComponentStyleConfig } from '@chakra-ui/react';
const { definePartsStyle, defineMultiStyleConfig } = createMultiStyleConfigHelpers(
  checkboxAnatomy.keys,
);

const baseStyle = defineStyle({
  icon: {
    transitionProperty: 'background-color, border-color',
    transitionDuration: '0.2s',
    p: '0.25rem',
  },
  control: {
    w: '1rem',
    h: '1rem',
    transitionProperty: 'background-color, border-color',
    transitionDuration: '0.2s',
    border: '1px solid',
    borderRadius: '0.25rem',
    borderColor: 'color-secondary-800',
    color: 'color-base-primary',
    _checked: {
      bg: 'color-primary-400',
      borderColor: 'color-primary-400',
    },
    _indeterminate: {
      bg: 'color-primary-400',
      borderColor: 'color-primary-400',
    },
    _disabled: {
      bg: 'color-secondary-800',
      borderColor: 'color-secondary-800',
    },
    _focusVisible: {
      boxShadow: '0 0 0 0.2rem rgba(0, 0, 0, 0.1)',
    },
    _invalid: {
      borderColor: 'color-danger-400',
    },
  },
  label: {
    userSelect: 'none',
    _disabled: {
      opacity: 0.4,
    },
  },
});
const primary = definePartsStyle({
  control: {
    borderColor: 'color-secondary-800',
    _hover: {
      bg: 'color-alpha-white-900',
    },
    _checked: {
      bg: 'color-primary-400',
      borderColor: 'color-primary-400',
    },
  },
  icon: {
    color: 'color-base-primary',
  },
});

const variants = {
  primary,
};

const Checkbox: ComponentStyleConfig = defineMultiStyleConfig({
  variants,
  baseStyle,
  sizes: theme.components.Checkbox.sizes,
});

export default Checkbox;
