import { defineStyle } from '@chakra-ui/react';
const primaryDisabled = {
  bg: 'color-neutral-700',
  color: 'color-neutral-300',
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
  borderColor: 'color-neutral-700',
  color: 'color-neutral-700',
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
  color: 'color-neutral-700',
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
  borderColor: 'color-error-900',
  color: 'color-error-800',
};

const danger = defineStyle({
  border: '1px solid',
  borderColor: 'color-error-400',
  color: 'color-error-400',
  _disabled: {
    ...dangerDisabled,
  },
  _hover: {
    borderColor: 'color-error-500',
    color: 'color-error-500',
  },
  _active: {
    borderColor: 'color-error-500',
    color: 'color-error-500',
  },
});

const stepper = defineStyle({
  border: '1px solid',
  borderColor: 'color-neutral-900',
  bg: 'color-black',
  color: 'color-lilac-100',
  _active: {
    borderColor: 'color-neutral-800',
    boxShadow: '0px 0px 0px 3px #534D58',
  },
  _hover: {
    borderColor: 'color-neutral-800',
  },
  _focus: {
    outline: 'none',
    borderColor: 'color-neutral-800',
    boxShadow: '0px 0px 0px 3px #534D58',
  },
});
const secondaryV1Disabled = {
  borderColor: 'color-neutral-700',
  color: 'color-base-secondary-foreground',
  opacity: 0.5,
};
const secondaryV1 = defineStyle({
  borderTop: '1px solid',
  borderColor: 'color-layout-border',
  bg: 'color-content-content2',
  color: 'color-base-secondary-foreground',
  _disabled: {
    ...secondaryV1Disabled,
  },
  _hover: {
    bg: 'color-content-content3',
    _disabled: {
      ...secondaryV1Disabled,
    },
  },
  _active: {
    bg: 'color-content-content4',
    borderColor: 'color-base-information-foreground',
  },
});

const ghostDisabled = {
  opacity: 0.5,
};

const ghostV1 = defineStyle({
  bg: 'transparent',
  color: 'color-content-content1-foreground',
  _hover: {
    bg: 'color-alpha-white-950',
    _disabled: {
      ...ghostDisabled,
    },
  },
  _disabled: {
    ...ghostDisabled,
  },
  _active: {},
  _focus: {},
});

const buttonVariants = {
  primary,
  secondary,
  secondaryV1,
  tertiary,
  stepper,
  danger,
  ghostV1,
};

export default buttonVariants;
