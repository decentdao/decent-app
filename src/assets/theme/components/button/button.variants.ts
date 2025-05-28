import { defineStyle } from '@chakra-ui/react';
const primaryDisabled = {
  bg: 'neutral-5',
  color: 'neutral-7',
};

const primary = defineStyle({
  bg: 'color-lilac-100',
  color: 'color-lilac-700',
  _hover: {
    bg: 'color-lilac-200',
    _disabled: {
      ...primaryDisabled,
    },
  },
  _disabled: {
    ...primaryDisabled,
  },
  _active: {
    bg: 'color-lilac-300',
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
    borderColor: 'color-lilac-200',
    color: 'color-lilac-200',
    _disabled: {
      ...secondaryDisabled,
    },
  },
  _disabled: {
    ...secondaryDisabled,
  },
  _active: {
    borderColor: 'color-lilac-300',
    color: 'color-lilac-300',
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
    bg: 'white-alpha-04',
    color: 'color-lilac-200',
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
    color: 'color-lilac-300',
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
  color: 'color-lilac-100',
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
