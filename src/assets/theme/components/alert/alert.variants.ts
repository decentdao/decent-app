import { alertAnatomy } from '@chakra-ui/anatomy';
import { createMultiStyleConfigHelpers } from '@chakra-ui/react';

const { definePartsStyle } = createMultiStyleConfigHelpers(alertAnatomy.keys);

const info = definePartsStyle({
  title: {},
  container: {
    bg: 'color-neutral-900',
    border: '1px solid',
    borderColor: 'color-neutral-800',
    color: 'color-lilac-100',
  },
  description: {},
  icon: {
    color: 'color-lilac-100',
  },
  spinner: {},
});

const fundraisingBanner = definePartsStyle({
  title: {
    textStyle: 'text-sm-medium',
    color: 'color-base-information-foreground',
    h: 'fit-content',
  },
  container: {
    bg: '#0e1d28',
    border: '1px solid',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    p: '12px',
    display: 'flex',
    alignItems: 'center',
  },
  description: {
    h: 'fit-content',
    textStyle: 'text-sm-regular',
    color: 'color-base-information-foreground',
  },
  icon: {
    color: 'color-base-information-foreground',
    '& > svg': {
      boxSize: '24px',
    },
  },
  spinner: {},
});

const successBanner = definePartsStyle({
  title: {
    textStyle: 'text-sm-medium',
    color: 'color-base-success',
    h: 'fit-content',
  },
  container: {
    bg: '#0c2517',
    border: '1px solid',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    p: '12px',
    display: 'flex',
    alignItems: 'center',
  },
  description: {
    textStyle: 'text-sm-regular',
    color: 'color-base-success',
    h: 'fit-content',
  },
  icon: {
    color: 'color-base-success',
    '& > svg': {
      boxSize: '24px',
    },
  },
  spinner: {},
});

const alertVariants = {
  info,
  fundraisingBanner,
  successBanner,
};

export default alertVariants;
