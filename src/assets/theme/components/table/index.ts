import { tableAnatomy } from '@chakra-ui/anatomy';
import { createMultiStyleConfigHelpers } from '@chakra-ui/react';
import baseStyle from './table.base';
import variants from './table.variants';

const { defineMultiStyleConfig } = createMultiStyleConfigHelpers(tableAnatomy.keys);

const Table = defineMultiStyleConfig({
  baseStyle,
  variants,
  defaultProps: {
    variant: 'tokenSales',
  },
});

export default Table;
