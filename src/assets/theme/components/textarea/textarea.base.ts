import { defineStyle } from '@chakra-ui/react';

const disabled = {
  cursor: 'default',
  border: 'white-alpha-08',
  color: 'color-black',
  _placeholder: {
    color: 'color-neutral-700',
  },
};

const loading = {};

const baseStyle = defineStyle({
  borderRadius: '4px',
  color: 'color-white',
  bg: 'color-black',
  border: '1px solid',
  borderColor: 'color-neutral-900',
  transitionDuration: 'normal',
  transitionProperty: 'common',
  width: '100%',
  _invalid: {
    borderColor: 'color-error-500',
    bg: 'color-error-950',
    color: 'color-error-400',
    _placeholder: {
      color: 'color-error-500',
    },
  },
  _placeholder: {
    color: 'color-neutral-700',
  },
  _active: {
    borderColor: 'color-neutral-800',
    boxShadow: '0px 0px 0px 3px #534D58',
    _disabled: {
      ...disabled,
      _loading: loading,
    },
  },
  _hover: {
    borderColor: 'color-neutral-800',
    _disabled: {
      ...disabled,
      _loading: loading,
    },
  },
  _disabled: {
    ...disabled,
    _loading: loading,
  },
  _focus: {
    outline: 'none',
    borderColor: 'color-neutral-800',
    boxShadow: '0px 0px 0px 3px #534D58',
    _invalid: {
      borderColor: 'color-error-500',
      bg: 'color-error-950',
      color: 'color-error-400',
      _placeholder: {
        color: 'color-error-500',
      },
    },
    _disabled: {
      ...disabled,
      _loading: loading,
    },
  } /*  */,
});

export default baseStyle;
