export const DecentPaymasterV1Abi = [
  {
    inputs: [],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    inputs: [],
    name: 'InvalidArrayLength',
    type: 'error',
  },
  {
    inputs: [],
    name: 'InvalidCallDataLength',
    type: 'error',
  },
  {
    inputs: [],
    name: 'UnauthorizedStrategy',
    type: 'error',
  },
  {
    inputs: [],
    name: 'ZeroAddressStrategy',
    type: 'error',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'address',
        name: 'strategy',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'bytes4',
        name: 'selector',
        type: 'bytes4',
      },
      {
        indexed: false,
        internalType: 'bool',
        name: 'approved',
        type: 'bool',
      },
    ],
    name: 'FunctionApproved',
    type: 'event',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'strategy',
        type: 'address',
      },
      {
        internalType: 'bytes4',
        name: 'selector',
        type: 'bytes4',
      },
    ],
    name: 'isFunctionApproved',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'strategy',
        type: 'address',
      },
      {
        internalType: 'bytes4[]',
        name: 'selectors',
        type: 'bytes4[]',
      },
      {
        internalType: 'bool[]',
        name: 'approved',
        type: 'bool[]',
      },
    ],
    name: 'setStrategyFunctionApproval',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes4',
        name: 'interfaceId',
        type: 'bytes4',
      },
    ],
    name: 'supportsInterface',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getVersion',
    outputs: [
      {
        internalType: 'uint16',
        name: '',
        type: 'uint16',
      },
    ],
    stateMutability: 'pure',
    type: 'function',
  },
] as const;
