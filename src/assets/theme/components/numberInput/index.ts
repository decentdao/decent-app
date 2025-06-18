import { numberInputAnatomy } from '@chakra-ui/anatomy';
import { createMultiStyleConfigHelpers } from '@chakra-ui/react';
import baseStyle, { tableStyle } from './numberInput.base';
import sizes from './numberInput.sizes';

const { defineMultiStyleConfig } = createMultiStyleConfigHelpers(numberInputAnatomy.keys);

const NumberInput = defineMultiStyleConfig({
  baseStyle,
  sizes,
  defaultProps: {
    size: 'base',
  },
  variants: {
    tableStyle,
  },
});

export default NumberInput;
