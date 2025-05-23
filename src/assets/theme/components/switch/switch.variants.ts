import { defineStyle } from '@chakra-ui/react';

const primaryDisabled = {
  track: {
    backgroundColor: 'neutral-5',
    _checked: {
      backgroundColor: 'neutral-5',
    },
  },
  thumb: {
    backgroundColor: 'neutral-6',
    _checked: {
      backgroundColor: 'neutral-6',
    },
  },
};

const primary = defineStyle({
  track: {
    backgroundColor: 'neutral-6',
    _checked: {
      backgroundColor: 'color-lilac-600',
    },
    _disabled: primaryDisabled.track,
  },
  thumb: {
    backgroundColor: 'color-lilac-300',
    _disabled: primaryDisabled.thumb,
  },
});

const secondaryDisabled = {
  track: {
    backgroundColor: 'color-neutral-900',
    _checked: {
      backgroundColor: 'color-neutral-900',
    },
  },
  thumb: {
    backgroundColor: 'color-neutral-800',
    _checked: {
      backgroundColor: 'color-neutral-800',
    },
  },
};

const secondary = defineStyle({
  track: {
    backgroundColor: 'color-black',
    _checked: {
      backgroundColor: 'color-green-600',
    },
    _hover: {
      _disabled: secondaryDisabled.track,
    },
    _disabled: secondaryDisabled.track,
  },
  thumb: {
    backgroundColor: 'neutral-10',
    borderColor: 'white-0',
    _hover: {
      _disabled: secondaryDisabled.thumb,
    },
    _disabled: secondaryDisabled.thumb,
  },
});

const switchVariants = {
  primary,
  secondary,
};

export default switchVariants;
