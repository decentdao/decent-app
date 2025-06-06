import { inputAnatomy } from '@chakra-ui/anatomy';
import { createMultiStyleConfigHelpers } from '@chakra-ui/react';
import baseStyle, { tableStyle } from './input.base';
import sizes from './input.sizes';
import variants from './input.variants';

const { defineMultiStyleConfig } = createMultiStyleConfigHelpers(inputAnatomy.keys);

const Input = defineMultiStyleConfig({
  baseStyle,
  sizes,
  variants,
  defaultProps: {
    size: 'base',
    variant: 'unstyled',
  },
  variants: {
    tableStyle,
  },
});

export default Input;
