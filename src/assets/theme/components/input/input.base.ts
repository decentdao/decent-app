import { inputAnatomy } from '@chakra-ui/anatomy';
import { createMultiStyleConfigHelpers } from '@chakra-ui/react';
import { DISABLED_INPUT } from '../../../../constants/common';

const { definePartsStyle } = createMultiStyleConfigHelpers(inputAnatomy.keys);

const disabled = {
  cursor: 'default',
  bg: DISABLED_INPUT,
  border: '1px solid',
  borderColor: 'white-alpha-16',
  color: 'color-neutral-400',
  _placeholder: {
    color: 'color-neutral-700',
  },
  boxShadow: 'unset',
};

const invalid = {
  bg: 'color-error-950',
  color: 'color-error-400',
  _placeholder: {
    color: 'color-error-500',
  },
  boxShadow:
    '0px 0px 0px 2px #AF3A48, 0px 1px 0px 0px rgba(242, 161, 171, 0.30), 0px 0px 0px 1px rgba(0, 0, 0, 0.80)',
};

const loading = {};

const baseStyle = definePartsStyle({
  field: {
    borderRadius: '0.5rem',
    color: 'color-white',
    bg: 'color-black',
    boxShadow: '0px 1px 0px 0px rgba(255, 255, 255, 0.16), 0px 0px 0px 1px rgba(0, 0, 0, 0.68)',
    transitionDuration: 'normal',
    transitionProperty: 'common',
    width: '100%',
    _invalid: invalid,
    _placeholder: {
      color: 'color-neutral-700',
    },
    _active: {
      boxShadow:
        '0px 0px 0px 2px #534D58, 0px 1px 0px 0px rgba(255, 255, 255, 0.20), 0px 0px 0px 1px rgba(0, 0, 0, 0.80)',
      _disabled: {
        ...disabled,
        _loading: loading,
      },
    },
    _hover: {
      boxShadow: '0px 1px 0px 0px rgba(255, 255, 255, 0.24), 0px 0px 0px 1px rgba(0, 0, 0, 0.80)',
      _disabled: {
        ...disabled,
        _loading: loading,
      },
      _invalid: {
        ...invalid,
        borderColor: 'color-error-400',
      },
    },
    _disabled: {
      ...disabled,
      _loading: loading,
    },
    _focus: {
      outline: 'none',
      boxShadow:
        '0px 0px 0px 2px #534D58, 0px 1px 0px 0px rgba(255, 255, 255, 0.20), 0px 0px 0px 1px rgba(0, 0, 0, 0.80)',
      _invalid: invalid,
      _disabled: {
        ...disabled,
        _loading: loading,
      },
    },
  },
});

export const tableStyle = definePartsStyle({
  field: {
    border: 'none !important',
    borderRadius: '0',
    color: 'color-white',
    bg: 'transparent',
    h: 'full',
    overflow: 'hidden',
    margin: '0',
    transitionDuration: 'normal',
    transitionProperty: 'common',
    width: '100%',
    _invalid: invalid,
    _placeholder: {
      color: 'color-neutral-700',
    },
    _hover: {
      bg: 'color-alpha-white-950',
      _disabled: {
        ...disabled,
        _loading: loading,
      },
      _invalid: {
        ...invalid,
        borderColor: 'color-error-400',
      },
    },
    _disabled: {
      ...disabled,
      _loading: loading,
    },
    _focus: {
      bg: 'color-black',
      outline: 'none',
      boxShadow:
        '0px 0px 0px 2px #534D58, 0px 1px 0px 0px rgba(255, 255, 255, 0.20), 0px 0px 0px 1px rgba(0, 0, 0, 0.80)',
      _invalid: invalid,
      _disabled: {
        ...disabled,
        _loading: loading,
      },
    },
  },
});

export default baseStyle;
