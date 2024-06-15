import { inputAnatomy } from '@chakra-ui/anatomy';
import { createMultiStyleConfigHelpers } from '@chakra-ui/react';

const { definePartsStyle } = createMultiStyleConfigHelpers(inputAnatomy.keys);

const disabled = {
  cursor: 'default',
  borderColor: 'white-alpha-08',
  color: 'neutral-6',
  _placeholder: {
    color: 'neutral-5',
  },
};

const invalid = {
  borderColor: 'red-0',
  bg: 'red--3',
  color: 'red-1',
  _placeholder: {
    color: 'red-0',
  },
};

const loading = {};

const baseStyle = definePartsStyle({
  field: {
    borderRadius: '4px',
    color: 'white-0',
    bg: 'neutral-1',
    border: '1px solid',
    borderColor: 'neutral-3',
    transitionDuration: 'normal',
    transitionProperty: 'common',
    width: '100%',
    _invalid: invalid,
    _placeholder: {
      color: 'neutral-5',
    },
    _active: {
      borderColor: 'neutral-4',
      boxShadow: '0px 0px 0px 3px #534D58',
      _disabled: {
        ...disabled,
        _loading: loading,
      },
    },
    _hover: {
      borderColor: 'neutral-4',
      _disabled: {
        ...disabled,
        _loading: loading,
      },
      _invalid: {
        ...invalid,
        borderColor: 'red-1',
      },
    },
    _disabled: {
      ...disabled,
      _loading: loading,
    },
    _focus: {
      outline: 'none',
      borderColor: 'neutral-4',
      boxShadow: '0px 0px 0px 3px #534D58',
      _invalid: invalid,
      _disabled: {
        ...disabled,
        _loading: loading,
      },
    },
  },
});

export default baseStyle;
