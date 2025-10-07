import { progressAnatomy } from '@chakra-ui/anatomy';
import { createMultiStyleConfigHelpers } from '@chakra-ui/react';
import baseStyle from './progress.base';
import sizes from './progress.size';
import variants from './progress.variants';

const { defineMultiStyleConfig } = createMultiStyleConfigHelpers(progressAnatomy.keys);

const Progress = defineMultiStyleConfig({
  baseStyle,
  sizes,
  variants,
  defaultProps: {
    size: 'base',
    variant: 'default',
  },
});

export default Progress;
