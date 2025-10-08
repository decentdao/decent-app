import { tableAnatomy } from '@chakra-ui/anatomy';
import { createMultiStyleConfigHelpers } from '@chakra-ui/react';

const { definePartsStyle } = createMultiStyleConfigHelpers(tableAnatomy.keys);

const baseStyles = definePartsStyle({
  table: {
    borderCollapse: 'separate',
    borderSpacing: 0,
    width: 'full',
    borderRadius: '12px',
    border: '1px solid',
    borderColor: 'color-layout-border-10',
    overflow: 'hidden',
  },
  thead: {
    bg: 'color-content-content1',
  },
  tbody: {},
  tr: {
    _hover: {
      bg: 'transparent',
    },
  },
  th: {
    bg: 'color-content-content1',
    borderBottom: '1px solid',
    borderColor: 'color-layout-border-10',
    color: 'color-content-muted',
    fontWeight: 'medium',
    fontSize: 'sm',
    lineHeight: '20px',
    px: 3,
    py: 2.5,
    textAlign: 'left',
    height: '40px',
    position: 'relative',
    _first: {
      borderLeftRadius: 0,
    },
    _last: {
      borderRightRadius: 0,
    },
  },
  td: {
    borderBottom: '1px solid',
    borderColor: 'color-layout-border-10',
    color: 'color-content-content1-foreground',
    fontSize: 'sm',
    lineHeight: '20px',
    px: 3,
    py: 3,
    height: '72px',
    verticalAlign: 'middle',
    _last: {
      textAlign: 'right',
    },
  },
  caption: {
    color: 'color-content-muted',
    fontSize: 'xs',
    lineHeight: '16px',
    textAlign: 'left',
    pt: 4,
  },
});

export default baseStyles;
