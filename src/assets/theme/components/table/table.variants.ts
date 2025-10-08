import { tableAnatomy } from '@chakra-ui/anatomy';
import { createMultiStyleConfigHelpers } from '@chakra-ui/react';

const { definePartsStyle } = createMultiStyleConfigHelpers(tableAnatomy.keys);

const tokenSales = definePartsStyle({
  table: {
    bg: 'transparent',
  },
  thead: {
    bg: 'color-content-content1',
  },
  th: {
    bg: 'color-content-content1',
    color: 'color-content-muted',
    fontWeight: 'medium',
    fontSize: 'sm',
    textTransform: 'none',
    letterSpacing: 'normal',
  },
  td: {
    color: 'color-content-content1-foreground',
    fontWeight: 'medium',
    _first: {
      fontWeight: 'medium',
    },
  },
});

const variants = {
  tokenSales,
};

export default variants;
