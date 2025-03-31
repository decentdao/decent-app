import { defineStyle } from '@chakra-ui/react';
const primaryDisabled = {
  bg: 'neutral-5',
  color: 'neutral-7',
};

const primary = defineStyle({
  bg: 'lilac-0',
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
  borderColor: 'lilac-0',
  color: 'lilac-0',
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
  color: 'lilac-0',
  _hover: {
    bg: 'white-alpha-04',
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

const dangerDisabled = {
  borderColor: 'red--2',
  color: 'red--1',
};

const danger = defineStyle({
  border: '1px solid',
  borderColor: 'red-1',
  color: 'red-1',
  _disabled: {
    ...dangerDisabled,
  },
  _hover: {
    borderColor: 'red-0',
    color: 'red-0',
  },
  _active: {
    borderColor: 'red-0',
    color: 'red-0',
  },
});

const stepper = defineStyle({
  border: '1px solid',
  borderColor: 'neutral-3',
  bg: 'neutral-1',
  color: 'lilac-0',
  _active: {
    borderColor: 'neutral-4',
    boxShadow: '0px 0px 0px 3px #534D58',
  },
  _hover: {
    borderColor: 'neutral-4',
  },
  _focus: {
    outline: 'none',
    borderColor: 'neutral-4',
    boxShadow: '0px 0px 0px 3px #534D58',
  },
});

const buttonVariants = {
  primary,
  secondary,
  tertiary,
  stepper,
  danger,
};

export default buttonVariants;
