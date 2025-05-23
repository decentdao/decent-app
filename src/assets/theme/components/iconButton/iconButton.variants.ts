import { defineStyle } from '@chakra-ui/react';
const primaryDisabled = {
  bg: 'neutral-5',
  color: 'neutral-7',
};

const primary = defineStyle({
  bg: 'color-lilac-100',
  color: 'cosmic-nebula-0',
  _hover: {
    bg: 'lilac--1',
    _disabled: {
      ...primaryDisabled,
    },
  },
  _disabled: {
    ...primaryDisabled,
  },
  _active: {
    bg: 'lilac--2',
  },
});

const secondaryDisabled = {
  borderColor: 'neutral-5',
  color: 'neutral-5',
};
const secondary = defineStyle({
  border: '1px solid',
  borderColor: 'color-lilac-100',
  color: 'color-lilac-100',
  _hover: {
    borderColor: 'lilac--1',
    color: 'lilac--1',
    _disabled: {
      ...secondaryDisabled,
    },
  },
  _disabled: {
    ...secondaryDisabled,
  },
  _active: {
    borderColor: 'lilac--2',
    color: 'lilac--2',
  },
});

const tertiaryDisabled = {
  color: 'neutral-5',
};

const tertiaryLoading = {
  // @todo add loading state
};
const tertiary = defineStyle({
  bg: 'transparent',
  color: 'color-lilac-100',
  _hover: {
    bg: 'white-alpha-08',
    color: 'lilac--1',
    _disabled: {
      ...tertiaryDisabled,
      _loading: tertiaryLoading,
    },
  },
  _disabled: {
    ...tertiaryDisabled,
    _loading: tertiaryLoading,
  },
  _active: {
    bg: 'white-alpha-08',
    color: 'lilac--2',
  },
  _focus: {},
});

const iconButtonVariants = {
  primary,
  secondary,
  tertiary,
};

export default iconButtonVariants;
