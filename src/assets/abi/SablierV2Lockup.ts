export const SablierV2LockupLinearAbi = [
  {
    type: 'constructor',
    inputs: [
      {
        name: 'initialAdmin',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'initialNFTDescriptor',
        type: 'address',
        internalType: 'contract ILockupNFTDescriptor',
      },
      {
        name: 'maxCount',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'MAX_BROKER_FEE',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'uint256',
        internalType: 'UD60x18',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'MAX_COUNT',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'admin',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'address',
        internalType: 'address',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'allowToHook',
    inputs: [
      {
        name: 'recipient',
        type: 'address',
        internalType: 'address',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'approve',
    inputs: [
      {
        name: 'to',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'tokenId',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'balanceOf',
    inputs: [
      {
        name: 'owner',
        type: 'address',
        internalType: 'address',
      },
    ],
    outputs: [
      {
        name: '',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'batch',
    inputs: [
      {
        name: 'calls',
        type: 'bytes[]',
        internalType: 'bytes[]',
      },
    ],
    outputs: [
      {
        name: 'results',
        type: 'bytes[]',
        internalType: 'bytes[]',
      },
    ],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'burn',
    inputs: [
      {
        name: 'streamId',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'cancel',
    inputs: [
      {
        name: 'streamId',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'cancelMultiple',
    inputs: [
      {
        name: 'streamIds',
        type: 'uint256[]',
        internalType: 'uint256[]',
      },
    ],
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'collectFees',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'createWithDurationsLD',
    inputs: [
      {
        name: 'params',
        type: 'tuple',
        internalType: 'struct Lockup.CreateWithDurations',
        components: [
          {
            name: 'sender',
            type: 'address',
            internalType: 'address',
          },
          {
            name: 'recipient',
            type: 'address',
            internalType: 'address',
          },
          {
            name: 'totalAmount',
            type: 'uint128',
            internalType: 'uint128',
          },
          {
            name: 'token',
            type: 'address',
            internalType: 'contract IERC20',
          },
          {
            name: 'cancelable',
            type: 'bool',
            internalType: 'bool',
          },
          {
            name: 'transferable',
            type: 'bool',
            internalType: 'bool',
          },
          {
            name: 'shape',
            type: 'string',
            internalType: 'string',
          },
          {
            name: 'broker',
            type: 'tuple',
            internalType: 'struct Broker',
            components: [
              {
                name: 'account',
                type: 'address',
                internalType: 'address',
              },
              {
                name: 'fee',
                type: 'uint256',
                internalType: 'UD60x18',
              },
            ],
          },
        ],
      },
      {
        name: 'segmentsWithDuration',
        type: 'tuple[]',
        internalType: 'struct LockupDynamic.SegmentWithDuration[]',
        components: [
          {
            name: 'amount',
            type: 'uint128',
            internalType: 'uint128',
          },
          {
            name: 'exponent',
            type: 'uint64',
            internalType: 'UD2x18',
          },
          {
            name: 'duration',
            type: 'uint40',
            internalType: 'uint40',
          },
        ],
      },
    ],
    outputs: [
      {
        name: 'streamId',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'createWithDurationsLL',
    inputs: [
      {
        name: 'params',
        type: 'tuple',
        internalType: 'struct Lockup.CreateWithDurations',
        components: [
          {
            name: 'sender',
            type: 'address',
            internalType: 'address',
          },
          {
            name: 'recipient',
            type: 'address',
            internalType: 'address',
          },
          {
            name: 'totalAmount',
            type: 'uint128',
            internalType: 'uint128',
          },
          {
            name: 'token',
            type: 'address',
            internalType: 'contract IERC20',
          },
          {
            name: 'cancelable',
            type: 'bool',
            internalType: 'bool',
          },
          {
            name: 'transferable',
            type: 'bool',
            internalType: 'bool',
          },
          {
            name: 'shape',
            type: 'string',
            internalType: 'string',
          },
          {
            name: 'broker',
            type: 'tuple',
            internalType: 'struct Broker',
            components: [
              {
                name: 'account',
                type: 'address',
                internalType: 'address',
              },
              {
                name: 'fee',
                type: 'uint256',
                internalType: 'UD60x18',
              },
            ],
          },
        ],
      },
      {
        name: 'unlockAmounts',
        type: 'tuple',
        internalType: 'struct LockupLinear.UnlockAmounts',
        components: [
          {
            name: 'start',
            type: 'uint128',
            internalType: 'uint128',
          },
          {
            name: 'cliff',
            type: 'uint128',
            internalType: 'uint128',
          },
        ],
      },
      {
        name: 'durations',
        type: 'tuple',
        internalType: 'struct LockupLinear.Durations',
        components: [
          {
            name: 'cliff',
            type: 'uint40',
            internalType: 'uint40',
          },
          {
            name: 'total',
            type: 'uint40',
            internalType: 'uint40',
          },
        ],
      },
    ],
    outputs: [
      {
        name: 'streamId',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'createWithDurationsLT',
    inputs: [
      {
        name: 'params',
        type: 'tuple',
        internalType: 'struct Lockup.CreateWithDurations',
        components: [
          {
            name: 'sender',
            type: 'address',
            internalType: 'address',
          },
          {
            name: 'recipient',
            type: 'address',
            internalType: 'address',
          },
          {
            name: 'totalAmount',
            type: 'uint128',
            internalType: 'uint128',
          },
          {
            name: 'token',
            type: 'address',
            internalType: 'contract IERC20',
          },
          {
            name: 'cancelable',
            type: 'bool',
            internalType: 'bool',
          },
          {
            name: 'transferable',
            type: 'bool',
            internalType: 'bool',
          },
          {
            name: 'shape',
            type: 'string',
            internalType: 'string',
          },
          {
            name: 'broker',
            type: 'tuple',
            internalType: 'struct Broker',
            components: [
              {
                name: 'account',
                type: 'address',
                internalType: 'address',
              },
              {
                name: 'fee',
                type: 'uint256',
                internalType: 'UD60x18',
              },
            ],
          },
        ],
      },
      {
        name: 'tranchesWithDuration',
        type: 'tuple[]',
        internalType: 'struct LockupTranched.TrancheWithDuration[]',
        components: [
          {
            name: 'amount',
            type: 'uint128',
            internalType: 'uint128',
          },
          {
            name: 'duration',
            type: 'uint40',
            internalType: 'uint40',
          },
        ],
      },
    ],
    outputs: [
      {
        name: 'streamId',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'createWithTimestampsLD',
    inputs: [
      {
        name: 'params',
        type: 'tuple',
        internalType: 'struct Lockup.CreateWithTimestamps',
        components: [
          {
            name: 'sender',
            type: 'address',
            internalType: 'address',
          },
          {
            name: 'recipient',
            type: 'address',
            internalType: 'address',
          },
          {
            name: 'totalAmount',
            type: 'uint128',
            internalType: 'uint128',
          },
          {
            name: 'token',
            type: 'address',
            internalType: 'contract IERC20',
          },
          {
            name: 'cancelable',
            type: 'bool',
            internalType: 'bool',
          },
          {
            name: 'transferable',
            type: 'bool',
            internalType: 'bool',
          },
          {
            name: 'timestamps',
            type: 'tuple',
            internalType: 'struct Lockup.Timestamps',
            components: [
              {
                name: 'start',
                type: 'uint40',
                internalType: 'uint40',
              },
              {
                name: 'end',
                type: 'uint40',
                internalType: 'uint40',
              },
            ],
          },
          {
            name: 'shape',
            type: 'string',
            internalType: 'string',
          },
          {
            name: 'broker',
            type: 'tuple',
            internalType: 'struct Broker',
            components: [
              {
                name: 'account',
                type: 'address',
                internalType: 'address',
              },
              {
                name: 'fee',
                type: 'uint256',
                internalType: 'UD60x18',
              },
            ],
          },
        ],
      },
      {
        name: 'segments',
        type: 'tuple[]',
        internalType: 'struct LockupDynamic.Segment[]',
        components: [
          {
            name: 'amount',
            type: 'uint128',
            internalType: 'uint128',
          },
          {
            name: 'exponent',
            type: 'uint64',
            internalType: 'UD2x18',
          },
          {
            name: 'timestamp',
            type: 'uint40',
            internalType: 'uint40',
          },
        ],
      },
    ],
    outputs: [
      {
        name: 'streamId',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'createWithTimestampsLL',
    inputs: [
      {
        name: 'params',
        type: 'tuple',
        internalType: 'struct Lockup.CreateWithTimestamps',
        components: [
          {
            name: 'sender',
            type: 'address',
            internalType: 'address',
          },
          {
            name: 'recipient',
            type: 'address',
            internalType: 'address',
          },
          {
            name: 'totalAmount',
            type: 'uint128',
            internalType: 'uint128',
          },
          {
            name: 'token',
            type: 'address',
            internalType: 'contract IERC20',
          },
          {
            name: 'cancelable',
            type: 'bool',
            internalType: 'bool',
          },
          {
            name: 'transferable',
            type: 'bool',
            internalType: 'bool',
          },
          {
            name: 'timestamps',
            type: 'tuple',
            internalType: 'struct Lockup.Timestamps',
            components: [
              {
                name: 'start',
                type: 'uint40',
                internalType: 'uint40',
              },
              {
                name: 'end',
                type: 'uint40',
                internalType: 'uint40',
              },
            ],
          },
          {
            name: 'shape',
            type: 'string',
            internalType: 'string',
          },
          {
            name: 'broker',
            type: 'tuple',
            internalType: 'struct Broker',
            components: [
              {
                name: 'account',
                type: 'address',
                internalType: 'address',
              },
              {
                name: 'fee',
                type: 'uint256',
                internalType: 'UD60x18',
              },
            ],
          },
        ],
      },
      {
        name: 'unlockAmounts',
        type: 'tuple',
        internalType: 'struct LockupLinear.UnlockAmounts',
        components: [
          {
            name: 'start',
            type: 'uint128',
            internalType: 'uint128',
          },
          {
            name: 'cliff',
            type: 'uint128',
            internalType: 'uint128',
          },
        ],
      },
      {
        name: 'cliffTime',
        type: 'uint40',
        internalType: 'uint40',
      },
    ],
    outputs: [
      {
        name: 'streamId',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'createWithTimestampsLT',
    inputs: [
      {
        name: 'params',
        type: 'tuple',
        internalType: 'struct Lockup.CreateWithTimestamps',
        components: [
          {
            name: 'sender',
            type: 'address',
            internalType: 'address',
          },
          {
            name: 'recipient',
            type: 'address',
            internalType: 'address',
          },
          {
            name: 'totalAmount',
            type: 'uint128',
            internalType: 'uint128',
          },
          {
            name: 'token',
            type: 'address',
            internalType: 'contract IERC20',
          },
          {
            name: 'cancelable',
            type: 'bool',
            internalType: 'bool',
          },
          {
            name: 'transferable',
            type: 'bool',
            internalType: 'bool',
          },
          {
            name: 'timestamps',
            type: 'tuple',
            internalType: 'struct Lockup.Timestamps',
            components: [
              {
                name: 'start',
                type: 'uint40',
                internalType: 'uint40',
              },
              {
                name: 'end',
                type: 'uint40',
                internalType: 'uint40',
              },
            ],
          },
          {
            name: 'shape',
            type: 'string',
            internalType: 'string',
          },
          {
            name: 'broker',
            type: 'tuple',
            internalType: 'struct Broker',
            components: [
              {
                name: 'account',
                type: 'address',
                internalType: 'address',
              },
              {
                name: 'fee',
                type: 'uint256',
                internalType: 'UD60x18',
              },
            ],
          },
        ],
      },
      {
        name: 'tranches',
        type: 'tuple[]',
        internalType: 'struct LockupTranched.Tranche[]',
        components: [
          {
            name: 'amount',
            type: 'uint128',
            internalType: 'uint128',
          },
          {
            name: 'timestamp',
            type: 'uint40',
            internalType: 'uint40',
          },
        ],
      },
    ],
    outputs: [
      {
        name: 'streamId',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'getApproved',
    inputs: [
      {
        name: 'tokenId',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [
      {
        name: '',
        type: 'address',
        internalType: 'address',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getCliffTime',
    inputs: [
      {
        name: 'streamId',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [
      {
        name: 'cliffTime',
        type: 'uint40',
        internalType: 'uint40',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getDepositedAmount',
    inputs: [
      {
        name: 'streamId',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [
      {
        name: 'depositedAmount',
        type: 'uint128',
        internalType: 'uint128',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getEndTime',
    inputs: [
      {
        name: 'streamId',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [
      {
        name: 'endTime',
        type: 'uint40',
        internalType: 'uint40',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getLockupModel',
    inputs: [
      {
        name: 'streamId',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [
      {
        name: 'lockupModel',
        type: 'uint8',
        internalType: 'enum Lockup.Model',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getRecipient',
    inputs: [
      {
        name: 'streamId',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [
      {
        name: 'recipient',
        type: 'address',
        internalType: 'address',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getRefundedAmount',
    inputs: [
      {
        name: 'streamId',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [
      {
        name: 'refundedAmount',
        type: 'uint128',
        internalType: 'uint128',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getSegments',
    inputs: [
      {
        name: 'streamId',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [
      {
        name: 'segments',
        type: 'tuple[]',
        internalType: 'struct LockupDynamic.Segment[]',
        components: [
          {
            name: 'amount',
            type: 'uint128',
            internalType: 'uint128',
          },
          {
            name: 'exponent',
            type: 'uint64',
            internalType: 'UD2x18',
          },
          {
            name: 'timestamp',
            type: 'uint40',
            internalType: 'uint40',
          },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getSender',
    inputs: [
      {
        name: 'streamId',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [
      {
        name: 'sender',
        type: 'address',
        internalType: 'address',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getStartTime',
    inputs: [
      {
        name: 'streamId',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [
      {
        name: 'startTime',
        type: 'uint40',
        internalType: 'uint40',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getTranches',
    inputs: [
      {
        name: 'streamId',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [
      {
        name: 'tranches',
        type: 'tuple[]',
        internalType: 'struct LockupTranched.Tranche[]',
        components: [
          {
            name: 'amount',
            type: 'uint128',
            internalType: 'uint128',
          },
          {
            name: 'timestamp',
            type: 'uint40',
            internalType: 'uint40',
          },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getUnderlyingToken',
    inputs: [
      {
        name: 'streamId',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [
      {
        name: 'token',
        type: 'address',
        internalType: 'contract IERC20',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getUnlockAmounts',
    inputs: [
      {
        name: 'streamId',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [
      {
        name: 'unlockAmounts',
        type: 'tuple',
        internalType: 'struct LockupLinear.UnlockAmounts',
        components: [
          {
            name: 'start',
            type: 'uint128',
            internalType: 'uint128',
          },
          {
            name: 'cliff',
            type: 'uint128',
            internalType: 'uint128',
          },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getWithdrawnAmount',
    inputs: [
      {
        name: 'streamId',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [
      {
        name: 'withdrawnAmount',
        type: 'uint128',
        internalType: 'uint128',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'isAllowedToHook',
    inputs: [
      {
        name: 'recipient',
        type: 'address',
        internalType: 'address',
      },
    ],
    outputs: [
      {
        name: 'result',
        type: 'bool',
        internalType: 'bool',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'isApprovedForAll',
    inputs: [
      {
        name: 'owner',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'operator',
        type: 'address',
        internalType: 'address',
      },
    ],
    outputs: [
      {
        name: '',
        type: 'bool',
        internalType: 'bool',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'isCancelable',
    inputs: [
      {
        name: 'streamId',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [
      {
        name: 'result',
        type: 'bool',
        internalType: 'bool',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'isCold',
    inputs: [
      {
        name: 'streamId',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [
      {
        name: 'result',
        type: 'bool',
        internalType: 'bool',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'isDepleted',
    inputs: [
      {
        name: 'streamId',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [
      {
        name: 'result',
        type: 'bool',
        internalType: 'bool',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'isStream',
    inputs: [
      {
        name: 'streamId',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [
      {
        name: 'result',
        type: 'bool',
        internalType: 'bool',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'isTransferable',
    inputs: [
      {
        name: 'streamId',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [
      {
        name: 'result',
        type: 'bool',
        internalType: 'bool',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'isWarm',
    inputs: [
      {
        name: 'streamId',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [
      {
        name: 'result',
        type: 'bool',
        internalType: 'bool',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'name',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'string',
        internalType: 'string',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'nextStreamId',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'nftDescriptor',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'address',
        internalType: 'contract ILockupNFTDescriptor',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'ownerOf',
    inputs: [
      {
        name: 'tokenId',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [
      {
        name: '',
        type: 'address',
        internalType: 'address',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'refundableAmountOf',
    inputs: [
      {
        name: 'streamId',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [
      {
        name: 'refundableAmount',
        type: 'uint128',
        internalType: 'uint128',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'renounce',
    inputs: [
      {
        name: 'streamId',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'renounceMultiple',
    inputs: [
      {
        name: 'streamIds',
        type: 'uint256[]',
        internalType: 'uint256[]',
      },
    ],
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'safeTransferFrom',
    inputs: [
      {
        name: 'from',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'to',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'tokenId',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'safeTransferFrom',
    inputs: [
      {
        name: 'from',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'to',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'tokenId',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'data',
        type: 'bytes',
        internalType: 'bytes',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'setApprovalForAll',
    inputs: [
      {
        name: 'operator',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'approved',
        type: 'bool',
        internalType: 'bool',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'setNFTDescriptor',
    inputs: [
      {
        name: 'newNFTDescriptor',
        type: 'address',
        internalType: 'contract ILockupNFTDescriptor',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'statusOf',
    inputs: [
      {
        name: 'streamId',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [
      {
        name: 'status',
        type: 'uint8',
        internalType: 'enum Lockup.Status',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'streamedAmountOf',
    inputs: [
      {
        name: 'streamId',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [
      {
        name: 'streamedAmount',
        type: 'uint128',
        internalType: 'uint128',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'supportsInterface',
    inputs: [
      {
        name: 'interfaceId',
        type: 'bytes4',
        internalType: 'bytes4',
      },
    ],
    outputs: [
      {
        name: '',
        type: 'bool',
        internalType: 'bool',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'symbol',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'string',
        internalType: 'string',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'tokenURI',
    inputs: [
      {
        name: 'streamId',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [
      {
        name: 'uri',
        type: 'string',
        internalType: 'string',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'transferAdmin',
    inputs: [
      {
        name: 'newAdmin',
        type: 'address',
        internalType: 'address',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'transferFrom',
    inputs: [
      {
        name: 'from',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'to',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'tokenId',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'wasCanceled',
    inputs: [
      {
        name: 'streamId',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [
      {
        name: 'result',
        type: 'bool',
        internalType: 'bool',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'withdraw',
    inputs: [
      {
        name: 'streamId',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'to',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'amount',
        type: 'uint128',
        internalType: 'uint128',
      },
    ],
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'withdrawMax',
    inputs: [
      {
        name: 'streamId',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'to',
        type: 'address',
        internalType: 'address',
      },
    ],
    outputs: [
      {
        name: 'withdrawnAmount',
        type: 'uint128',
        internalType: 'uint128',
      },
    ],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'withdrawMaxAndTransfer',
    inputs: [
      {
        name: 'streamId',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'newRecipient',
        type: 'address',
        internalType: 'address',
      },
    ],
    outputs: [
      {
        name: 'withdrawnAmount',
        type: 'uint128',
        internalType: 'uint128',
      },
    ],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'withdrawMultiple',
    inputs: [
      {
        name: 'streamIds',
        type: 'uint256[]',
        internalType: 'uint256[]',
      },
      {
        name: 'amounts',
        type: 'uint128[]',
        internalType: 'uint128[]',
      },
    ],
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'withdrawableAmountOf',
    inputs: [
      {
        name: 'streamId',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [
      {
        name: 'withdrawableAmount',
        type: 'uint128',
        internalType: 'uint128',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'event',
    name: 'AllowToHook',
    inputs: [
      {
        name: 'admin',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
      {
        name: 'recipient',
        type: 'address',
        indexed: false,
        internalType: 'address',
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'Approval',
    inputs: [
      {
        name: 'owner',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
      {
        name: 'approved',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
      {
        name: 'tokenId',
        type: 'uint256',
        indexed: true,
        internalType: 'uint256',
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'ApprovalForAll',
    inputs: [
      {
        name: 'owner',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
      {
        name: 'operator',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
      {
        name: 'approved',
        type: 'bool',
        indexed: false,
        internalType: 'bool',
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'BatchMetadataUpdate',
    inputs: [
      {
        name: '_fromTokenId',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
      {
        name: '_toTokenId',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'CancelLockupStream',
    inputs: [
      {
        name: 'streamId',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
      {
        name: 'sender',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
      {
        name: 'recipient',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
      {
        name: 'token',
        type: 'address',
        indexed: true,
        internalType: 'contract IERC20',
      },
      {
        name: 'senderAmount',
        type: 'uint128',
        indexed: false,
        internalType: 'uint128',
      },
      {
        name: 'recipientAmount',
        type: 'uint128',
        indexed: false,
        internalType: 'uint128',
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'CollectFees',
    inputs: [
      {
        name: 'admin',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
      {
        name: 'feeAmount',
        type: 'uint256',
        indexed: true,
        internalType: 'uint256',
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'CreateLockupDynamicStream',
    inputs: [
      {
        name: 'streamId',
        type: 'uint256',
        indexed: true,
        internalType: 'uint256',
      },
      {
        name: 'commonParams',
        type: 'tuple',
        indexed: false,
        internalType: 'struct Lockup.CreateEventCommon',
        components: [
          {
            name: 'funder',
            type: 'address',
            internalType: 'address',
          },
          {
            name: 'sender',
            type: 'address',
            internalType: 'address',
          },
          {
            name: 'recipient',
            type: 'address',
            internalType: 'address',
          },
          {
            name: 'amounts',
            type: 'tuple',
            internalType: 'struct Lockup.CreateAmounts',
            components: [
              {
                name: 'deposit',
                type: 'uint128',
                internalType: 'uint128',
              },
              {
                name: 'brokerFee',
                type: 'uint128',
                internalType: 'uint128',
              },
            ],
          },
          {
            name: 'token',
            type: 'address',
            internalType: 'contract IERC20',
          },
          {
            name: 'cancelable',
            type: 'bool',
            internalType: 'bool',
          },
          {
            name: 'transferable',
            type: 'bool',
            internalType: 'bool',
          },
          {
            name: 'timestamps',
            type: 'tuple',
            internalType: 'struct Lockup.Timestamps',
            components: [
              {
                name: 'start',
                type: 'uint40',
                internalType: 'uint40',
              },
              {
                name: 'end',
                type: 'uint40',
                internalType: 'uint40',
              },
            ],
          },
          {
            name: 'shape',
            type: 'string',
            internalType: 'string',
          },
          {
            name: 'broker',
            type: 'address',
            internalType: 'address',
          },
        ],
      },
      {
        name: 'segments',
        type: 'tuple[]',
        indexed: false,
        internalType: 'struct LockupDynamic.Segment[]',
        components: [
          {
            name: 'amount',
            type: 'uint128',
            internalType: 'uint128',
          },
          {
            name: 'exponent',
            type: 'uint64',
            internalType: 'UD2x18',
          },
          {
            name: 'timestamp',
            type: 'uint40',
            internalType: 'uint40',
          },
        ],
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'CreateLockupLinearStream',
    inputs: [
      {
        name: 'streamId',
        type: 'uint256',
        indexed: true,
        internalType: 'uint256',
      },
      {
        name: 'commonParams',
        type: 'tuple',
        indexed: false,
        internalType: 'struct Lockup.CreateEventCommon',
        components: [
          {
            name: 'funder',
            type: 'address',
            internalType: 'address',
          },
          {
            name: 'sender',
            type: 'address',
            internalType: 'address',
          },
          {
            name: 'recipient',
            type: 'address',
            internalType: 'address',
          },
          {
            name: 'amounts',
            type: 'tuple',
            internalType: 'struct Lockup.CreateAmounts',
            components: [
              {
                name: 'deposit',
                type: 'uint128',
                internalType: 'uint128',
              },
              {
                name: 'brokerFee',
                type: 'uint128',
                internalType: 'uint128',
              },
            ],
          },
          {
            name: 'token',
            type: 'address',
            internalType: 'contract IERC20',
          },
          {
            name: 'cancelable',
            type: 'bool',
            internalType: 'bool',
          },
          {
            name: 'transferable',
            type: 'bool',
            internalType: 'bool',
          },
          {
            name: 'timestamps',
            type: 'tuple',
            internalType: 'struct Lockup.Timestamps',
            components: [
              {
                name: 'start',
                type: 'uint40',
                internalType: 'uint40',
              },
              {
                name: 'end',
                type: 'uint40',
                internalType: 'uint40',
              },
            ],
          },
          {
            name: 'shape',
            type: 'string',
            internalType: 'string',
          },
          {
            name: 'broker',
            type: 'address',
            internalType: 'address',
          },
        ],
      },
      {
        name: 'cliffTime',
        type: 'uint40',
        indexed: false,
        internalType: 'uint40',
      },
      {
        name: 'unlockAmounts',
        type: 'tuple',
        indexed: false,
        internalType: 'struct LockupLinear.UnlockAmounts',
        components: [
          {
            name: 'start',
            type: 'uint128',
            internalType: 'uint128',
          },
          {
            name: 'cliff',
            type: 'uint128',
            internalType: 'uint128',
          },
        ],
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'CreateLockupTranchedStream',
    inputs: [
      {
        name: 'streamId',
        type: 'uint256',
        indexed: true,
        internalType: 'uint256',
      },
      {
        name: 'commonParams',
        type: 'tuple',
        indexed: false,
        internalType: 'struct Lockup.CreateEventCommon',
        components: [
          {
            name: 'funder',
            type: 'address',
            internalType: 'address',
          },
          {
            name: 'sender',
            type: 'address',
            internalType: 'address',
          },
          {
            name: 'recipient',
            type: 'address',
            internalType: 'address',
          },
          {
            name: 'amounts',
            type: 'tuple',
            internalType: 'struct Lockup.CreateAmounts',
            components: [
              {
                name: 'deposit',
                type: 'uint128',
                internalType: 'uint128',
              },
              {
                name: 'brokerFee',
                type: 'uint128',
                internalType: 'uint128',
              },
            ],
          },
          {
            name: 'token',
            type: 'address',
            internalType: 'contract IERC20',
          },
          {
            name: 'cancelable',
            type: 'bool',
            internalType: 'bool',
          },
          {
            name: 'transferable',
            type: 'bool',
            internalType: 'bool',
          },
          {
            name: 'timestamps',
            type: 'tuple',
            internalType: 'struct Lockup.Timestamps',
            components: [
              {
                name: 'start',
                type: 'uint40',
                internalType: 'uint40',
              },
              {
                name: 'end',
                type: 'uint40',
                internalType: 'uint40',
              },
            ],
          },
          {
            name: 'shape',
            type: 'string',
            internalType: 'string',
          },
          {
            name: 'broker',
            type: 'address',
            internalType: 'address',
          },
        ],
      },
      {
        name: 'tranches',
        type: 'tuple[]',
        indexed: false,
        internalType: 'struct LockupTranched.Tranche[]',
        components: [
          {
            name: 'amount',
            type: 'uint128',
            internalType: 'uint128',
          },
          {
            name: 'timestamp',
            type: 'uint40',
            internalType: 'uint40',
          },
        ],
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'InvalidWithdrawalInWithdrawMultiple',
    inputs: [
      {
        name: 'streamId',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
      {
        name: 'revertData',
        type: 'bytes',
        indexed: false,
        internalType: 'bytes',
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'MetadataUpdate',
    inputs: [
      {
        name: '_tokenId',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'RenounceLockupStream',
    inputs: [
      {
        name: 'streamId',
        type: 'uint256',
        indexed: true,
        internalType: 'uint256',
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'SetNFTDescriptor',
    inputs: [
      {
        name: 'admin',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
      {
        name: 'oldNFTDescriptor',
        type: 'address',
        indexed: false,
        internalType: 'contract ILockupNFTDescriptor',
      },
      {
        name: 'newNFTDescriptor',
        type: 'address',
        indexed: false,
        internalType: 'contract ILockupNFTDescriptor',
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'Transfer',
    inputs: [
      {
        name: 'from',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
      {
        name: 'to',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
      {
        name: 'tokenId',
        type: 'uint256',
        indexed: true,
        internalType: 'uint256',
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'TransferAdmin',
    inputs: [
      {
        name: 'oldAdmin',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
      {
        name: 'newAdmin',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'WithdrawFromLockupStream',
    inputs: [
      {
        name: 'streamId',
        type: 'uint256',
        indexed: true,
        internalType: 'uint256',
      },
      {
        name: 'to',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
      {
        name: 'token',
        type: 'address',
        indexed: true,
        internalType: 'contract IERC20',
      },
      {
        name: 'amount',
        type: 'uint128',
        indexed: false,
        internalType: 'uint128',
      },
    ],
    anonymous: false,
  },
  {
    type: 'error',
    name: 'AddressEmptyCode',
    inputs: [
      {
        name: 'target',
        type: 'address',
        internalType: 'address',
      },
    ],
  },
  {
    type: 'error',
    name: 'AddressInsufficientBalance',
    inputs: [
      {
        name: 'account',
        type: 'address',
        internalType: 'address',
      },
    ],
  },
  {
    type: 'error',
    name: 'CallerNotAdmin',
    inputs: [
      {
        name: 'admin',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'caller',
        type: 'address',
        internalType: 'address',
      },
    ],
  },
  {
    type: 'error',
    name: 'DelegateCall',
    inputs: [],
  },
  {
    type: 'error',
    name: 'ERC721IncorrectOwner',
    inputs: [
      {
        name: 'sender',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'tokenId',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'owner',
        type: 'address',
        internalType: 'address',
      },
    ],
  },
  {
    type: 'error',
    name: 'ERC721InsufficientApproval',
    inputs: [
      {
        name: 'operator',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'tokenId',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
  },
  {
    type: 'error',
    name: 'ERC721InvalidApprover',
    inputs: [
      {
        name: 'approver',
        type: 'address',
        internalType: 'address',
      },
    ],
  },
  {
    type: 'error',
    name: 'ERC721InvalidOperator',
    inputs: [
      {
        name: 'operator',
        type: 'address',
        internalType: 'address',
      },
    ],
  },
  {
    type: 'error',
    name: 'ERC721InvalidOwner',
    inputs: [
      {
        name: 'owner',
        type: 'address',
        internalType: 'address',
      },
    ],
  },
  {
    type: 'error',
    name: 'ERC721InvalidReceiver',
    inputs: [
      {
        name: 'receiver',
        type: 'address',
        internalType: 'address',
      },
    ],
  },
  {
    type: 'error',
    name: 'ERC721InvalidSender',
    inputs: [
      {
        name: 'sender',
        type: 'address',
        internalType: 'address',
      },
    ],
  },
  {
    type: 'error',
    name: 'ERC721NonexistentToken',
    inputs: [
      {
        name: 'tokenId',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
  },
  {
    type: 'error',
    name: 'FailedInnerCall',
    inputs: [],
  },
  {
    type: 'error',
    name: 'SablierLockupBase_AllowToHookUnsupportedInterface',
    inputs: [
      {
        name: 'recipient',
        type: 'address',
        internalType: 'address',
      },
    ],
  },
  {
    type: 'error',
    name: 'SablierLockupBase_AllowToHookZeroCodeSize',
    inputs: [
      {
        name: 'recipient',
        type: 'address',
        internalType: 'address',
      },
    ],
  },
  {
    type: 'error',
    name: 'SablierLockupBase_FeeTransferFail',
    inputs: [
      {
        name: 'admin',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'feeAmount',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
  },
  {
    type: 'error',
    name: 'SablierLockupBase_InvalidHookSelector',
    inputs: [
      {
        name: 'recipient',
        type: 'address',
        internalType: 'address',
      },
    ],
  },
  {
    type: 'error',
    name: 'SablierLockupBase_NotTransferable',
    inputs: [
      {
        name: 'tokenId',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
  },
  {
    type: 'error',
    name: 'SablierLockupBase_Null',
    inputs: [
      {
        name: 'streamId',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
  },
  {
    type: 'error',
    name: 'SablierLockupBase_Overdraw',
    inputs: [
      {
        name: 'streamId',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'amount',
        type: 'uint128',
        internalType: 'uint128',
      },
      {
        name: 'withdrawableAmount',
        type: 'uint128',
        internalType: 'uint128',
      },
    ],
  },
  {
    type: 'error',
    name: 'SablierLockupBase_StreamCanceled',
    inputs: [
      {
        name: 'streamId',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
  },
  {
    type: 'error',
    name: 'SablierLockupBase_StreamDepleted',
    inputs: [
      {
        name: 'streamId',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
  },
  {
    type: 'error',
    name: 'SablierLockupBase_StreamNotCancelable',
    inputs: [
      {
        name: 'streamId',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
  },
  {
    type: 'error',
    name: 'SablierLockupBase_StreamNotDepleted',
    inputs: [
      {
        name: 'streamId',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
  },
  {
    type: 'error',
    name: 'SablierLockupBase_StreamSettled',
    inputs: [
      {
        name: 'streamId',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
  },
  {
    type: 'error',
    name: 'SablierLockupBase_Unauthorized',
    inputs: [
      {
        name: 'streamId',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'caller',
        type: 'address',
        internalType: 'address',
      },
    ],
  },
  {
    type: 'error',
    name: 'SablierLockupBase_WithdrawAmountZero',
    inputs: [
      {
        name: 'streamId',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
  },
  {
    type: 'error',
    name: 'SablierLockupBase_WithdrawArrayCountsNotEqual',
    inputs: [
      {
        name: 'streamIdsCount',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'amountsCount',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
  },
  {
    type: 'error',
    name: 'SablierLockupBase_WithdrawToZeroAddress',
    inputs: [
      {
        name: 'streamId',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
  },
  {
    type: 'error',
    name: 'SablierLockupBase_WithdrawalAddressNotRecipient',
    inputs: [
      {
        name: 'streamId',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'caller',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'to',
        type: 'address',
        internalType: 'address',
      },
    ],
  },
  {
    type: 'error',
    name: 'SablierLockup_NotExpectedModel',
    inputs: [
      {
        name: 'actualLockupModel',
        type: 'uint8',
        internalType: 'enum Lockup.Model',
      },
      {
        name: 'expectedLockupModel',
        type: 'uint8',
        internalType: 'enum Lockup.Model',
      },
    ],
  },
  {
    type: 'error',
    name: 'SafeERC20FailedOperation',
    inputs: [
      {
        name: 'token',
        type: 'address',
        internalType: 'address',
      },
    ],
  },
] as const;
