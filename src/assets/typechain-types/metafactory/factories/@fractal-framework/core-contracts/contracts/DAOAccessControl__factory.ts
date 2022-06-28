/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import type { Provider, TransactionRequest } from "@ethersproject/providers";
import type {
  DAOAccessControl,
  DAOAccessControlInterface,
} from "../../../../@fractal-framework/core-contracts/contracts/DAOAccessControl";

const _abi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        internalType: "string",
        name: "role",
        type: "string",
      },
    ],
    name: "MissingRole",
    type: "error",
  },
  {
    inputs: [],
    name: "OnlySelfRenounce",
    type: "error",
  },
  {
    inputs: [],
    name: "UnequalArrayLengths",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "target",
        type: "address",
      },
      {
        indexed: false,
        internalType: "string",
        name: "functionDesc",
        type: "string",
      },
      {
        indexed: false,
        internalType: "bytes4",
        name: "encodedSig",
        type: "bytes4",
      },
      {
        indexed: false,
        internalType: "string",
        name: "role",
        type: "string",
      },
    ],
    name: "ActionRoleAdded",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "target",
        type: "address",
      },
      {
        indexed: false,
        internalType: "string",
        name: "functionDesc",
        type: "string",
      },
      {
        indexed: false,
        internalType: "bytes4",
        name: "encodedSig",
        type: "bytes4",
      },
      {
        indexed: false,
        internalType: "string",
        name: "role",
        type: "string",
      },
    ],
    name: "ActionRoleRemoved",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "previousAdmin",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "newAdmin",
        type: "address",
      },
    ],
    name: "AdminChanged",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "beacon",
        type: "address",
      },
    ],
    name: "BeaconUpgraded",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint8",
        name: "version",
        type: "uint8",
      },
    ],
    name: "Initialized",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "string",
        name: "role",
        type: "string",
      },
      {
        indexed: false,
        internalType: "string",
        name: "previousAdminRole",
        type: "string",
      },
      {
        indexed: false,
        internalType: "string",
        name: "adminRole",
        type: "string",
      },
    ],
    name: "RoleAdminChanged",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "string",
        name: "role",
        type: "string",
      },
      {
        indexed: false,
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "admin",
        type: "address",
      },
    ],
    name: "RoleGranted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "string",
        name: "role",
        type: "string",
      },
      {
        indexed: false,
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "admin",
        type: "address",
      },
    ],
    name: "RoleRevoked",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "implementation",
        type: "address",
      },
    ],
    name: "Upgraded",
    type: "event",
  },
  {
    inputs: [],
    name: "DAO_ROLE",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "OPEN_ROLE",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "caller",
        type: "address",
      },
      {
        internalType: "address",
        name: "target",
        type: "address",
      },
      {
        internalType: "bytes4",
        name: "sig",
        type: "bytes4",
      },
    ],
    name: "actionIsAuthorized",
    outputs: [
      {
        internalType: "bool",
        name: "isAuthorized",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "role",
        type: "string",
      },
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "adminGrantRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "role",
        type: "string",
      },
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "adminRevokeRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address[]",
        name: "targets",
        type: "address[]",
      },
      {
        internalType: "string[]",
        name: "functionDescs",
        type: "string[]",
      },
      {
        internalType: "string[][]",
        name: "roles",
        type: "string[][]",
      },
    ],
    name: "daoAddActionsRoles",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string[]",
        name: "roles",
        type: "string[]",
      },
      {
        internalType: "address[][]",
        name: "members",
        type: "address[][]",
      },
    ],
    name: "daoGrantRoles",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string[]",
        name: "roles",
        type: "string[]",
      },
      {
        internalType: "string[]",
        name: "roleAdmins",
        type: "string[]",
      },
      {
        internalType: "address[][]",
        name: "members",
        type: "address[][]",
      },
    ],
    name: "daoGrantRolesAndAdmins",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address[]",
        name: "targets",
        type: "address[]",
      },
      {
        internalType: "string[]",
        name: "functionDescs",
        type: "string[]",
      },
      {
        internalType: "string[][]",
        name: "roles",
        type: "string[][]",
      },
    ],
    name: "daoRemoveActionsRoles",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "target",
        type: "address",
      },
      {
        internalType: "string",
        name: "functionDesc",
        type: "string",
      },
    ],
    name: "getActionRoles",
    outputs: [
      {
        internalType: "string[]",
        name: "roles",
        type: "string[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "role",
        type: "string",
      },
    ],
    name: "getRoleAdmin",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "role",
        type: "string",
      },
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "hasRole",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "dao",
        type: "address",
      },
      {
        internalType: "string[]",
        name: "roles",
        type: "string[]",
      },
      {
        internalType: "string[]",
        name: "roleAdmins",
        type: "string[]",
      },
      {
        internalType: "address[][]",
        name: "members",
        type: "address[][]",
      },
      {
        internalType: "address[]",
        name: "targets",
        type: "address[]",
      },
      {
        internalType: "string[]",
        name: "functionDescs",
        type: "string[]",
      },
      {
        internalType: "string[][]",
        name: "actionRoles",
        type: "string[][]",
      },
    ],
    name: "initialize",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "role",
        type: "string",
      },
      {
        internalType: "address",
        name: "target",
        type: "address",
      },
      {
        internalType: "string",
        name: "functionDesc",
        type: "string",
      },
    ],
    name: "isRoleAuthorized",
    outputs: [
      {
        internalType: "bool",
        name: "isAuthorized",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "proxiableUUID",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes4",
        name: "interfaceId",
        type: "bytes4",
      },
    ],
    name: "supportsInterface",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "newImplementation",
        type: "address",
      },
    ],
    name: "upgradeTo",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "newImplementation",
        type: "address",
      },
      {
        internalType: "bytes",
        name: "data",
        type: "bytes",
      },
    ],
    name: "upgradeToAndCall",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "role",
        type: "string",
      },
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "userRenounceRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

const _bytecode =
  "0x60a06040523060805234801561001457600080fd5b5060805161297d61004c600039600081816104130152818161045c015281816104fb0152818161053b01526105ce015261297d6000f3fe6080604052600436106101145760003560e01c80637b16e01f116100a0578063ddacc1a011610064578063ddacc1a014610315578063e34372ba14610335578063e9c2651814610355578063f9d68d8a14610389578063ff12fbd4146103a957600080fd5b80637b16e01f146102685780639f9aba6b14610288578063a74c3199146102a8578063b658f462146102c8578063cfb0a659146102e857600080fd5b806362777310116100e757806362777310146101a6578063672a41a1146101c65780636a928e8f146101f35780636c9cd097146102285780637033f4321461024857600080fd5b806301ffc9a7146101195780633659cfe61461014e5780634f1ef2861461017057806352d1902d14610183575b600080fd5b34801561012557600080fd5b50610139610134366004611d61565b6103c9565b60405190151581526020015b60405180910390f35b34801561015a57600080fd5b5061016e610169366004611d93565b610409565b005b61016e61017e366004611e4b565b6104f1565b34801561018f57600080fd5b506101986105c1565b604051908152602001610145565b3480156101b257600080fd5b5061016e6101c1366004611ecc565b610674565b3480156101d257600080fd5b506101e66101e1366004611f19565b610696565b6040516101459190611fad565b3480156101ff57600080fd5b506101e6604051806040016040528060098152602001684f50454e5f524f4c4560b81b81525081565b34801561023457600080fd5b50610139610243366004611ecc565b610749565b34801561025457600080fd5b50610139610263366004611fc0565b6107e1565b34801561027457600080fd5b5061016e6102833660046121fa565b61099c565b34801561029457600080fd5b5061016e6102a3366004611ecc565b6109d1565b3480156102b457600080fd5b5061016e6102c33660046122d2565b6109ee565b3480156102d457600080fd5b5061016e6102e3366004611ecc565b610a2a565b3480156102f457600080fd5b50610308610303366004612359565b610a5d565b604051610145919061239c565b34801561032157600080fd5b5061016e6103303660046123fe565b610b83565b34801561034157600080fd5b5061016e6103503660046122d2565b610bb9565b34801561036157600080fd5b506101e66040518060400160405280600881526020016744414f5f524f4c4560c01b81525081565b34801561039557600080fd5b5061016e6103a436600461247b565b610ce8565b3480156103b557600080fd5b506101396103c4366004612581565b610dfe565b60006301ffc9a760e01b6001600160e01b03198316148061040357506001600160e01b0319821660009081526020819052604090205460ff165b92915050565b6001600160a01b037f000000000000000000000000000000000000000000000000000000000000000016300361045a5760405162461bcd60e51b8152600401610451906125c4565b60405180910390fd5b7f00000000000000000000000000000000000000000000000000000000000000006001600160a01b03166104a3600080516020612901833981519152546001600160a01b031690565b6001600160a01b0316146104c95760405162461bcd60e51b815260040161045190612610565b6104d281610f47565b604080516000808252602082019092526104ee91839190610f72565b50565b6001600160a01b037f00000000000000000000000000000000000000000000000000000000000000001630036105395760405162461bcd60e51b8152600401610451906125c4565b7f00000000000000000000000000000000000000000000000000000000000000006001600160a01b0316610582600080516020612901833981519152546001600160a01b031690565b6001600160a01b0316146105a85760405162461bcd60e51b815260040161045190612610565b6105b182610f47565b6105bd82826001610f72565b5050565b6000306001600160a01b037f000000000000000000000000000000000000000000000000000000000000000016146106615760405162461bcd60e51b815260206004820152603860248201527f555550535570677261646561626c653a206d757374206e6f742062652063616c60448201527f6c6564207468726f7567682064656c656761746563616c6c00000000000000006064820152608401610451565b5060008051602061290183398151915290565b61067d82610696565b61068781336110dd565b6106918383611108565b505050565b60606066826040516106a8919061265c565b908152602001604051809103902060010180546106c490612678565b80601f01602080910402602001604051908101604052809291908181526020018280546106f090612678565b801561073d5780601f106107125761010080835404028352916020019161073d565b820191906000526020600020905b81548152906001019060200180831161072057829003601f168201915b50505050509050919050565b6040805180820190915260098152684f50454e5f524f4c4560b81b6020918201528251908301206000907f105f9fac1d35665bc3683b5b0c275c6b11ccdc5700dc819da045f601cf314f5c016107a157506001610403565b6066836040516107b1919061265c565b90815260408051602092819003830190206001600160a01b0385166000908152925290205460ff16905092915050565b600080826040516020016107f5919061265c565b60408051601f1981840301815282825280516020918201206001600160a01b0388166000908152606783528381206001600160e01b031983168252835283812080548085028701850190955284865291955093929091849084015b828210156108fc57838290600052602060002001805461086f90612678565b80601f016020809104026020016040519081016040528092919081815260200182805461089b90612678565b80156108e85780601f106108bd576101008083540402835291602001916108e8565b820191906000526020600020905b8154815290600101906020018083116108cb57829003601f168201915b505050505081526020019060010190610850565b5050825192935060009150505b8181101561099057828181518110610923576109236126b2565b602002602001015160405160200161093b919061265c565b6040516020818303038152906040528051906020012089896040516020016109649291906126c8565b60405160208183030381529060405280519060200120036109885760019450610990565b600101610909565b50505050949350505050565b6040518060400160405280600881526020016744414f5f524f4c4560c01b8152506109c781336110dd565b6106918383611199565b6109da82610696565b6109e481336110dd565b6106918383611259565b6040518060400160405280600881526020016744414f5f524f4c4560c01b815250610a1981336110dd565b610a248484846112df565b50505050565b6001600160a01b0381163314610a535760405163d8e5629560e01b815260040160405180910390fd5b6105bd8282611259565b6060600082604051602001610a72919061265c565b60408051601f1981840301815282825280516020918201206001600160a01b0388166000908152606783528381206001600160e01b031983168252835283812080548085028701850190955284865291955090929184015b82821015610b76578382906000526020600020018054610ae990612678565b80601f0160208091040260200160405190810160405280929190818152602001828054610b1590612678565b8015610b625780601f10610b3757610100808354040283529160200191610b62565b820191906000526020600020905b815481529060010190602001808311610b4557829003601f168201915b505050505081526020019060010190610aca565b5050505091505092915050565b6040518060400160405280600881526020016744414f5f524f4c4560c01b815250610bae81336110dd565b610a248484846113e2565b6040518060400160405280600881526020016744414f5f524f4c4560c01b815250610be481336110dd565b8251845114610c06576040516311e86f7360e01b815260040160405180910390fd5b8151845114610c28576040516311e86f7360e01b815260040160405180910390fd5b835160005b81811015610ce0576000848281518110610c4957610c496126b2565b602002602001015151905060005b81811015610cd657610cce888481518110610c7457610c746126b2565b6020026020010151888581518110610c8e57610c8e6126b2565b6020026020010151888681518110610ca857610ca86126b2565b60200260200101518481518110610cc157610cc16126b2565b60200260200101516114c0565b600101610c57565b5050600101610c2d565b505050505050565b6000610cf46001611710565b90508015610d0c576001805461ff0019166101001790555b85518751141580610d1f57508451875114155b80610d2c57508251845114155b80610d3957508251845114155b15610d57576040516311e86f7360e01b815260040160405180910390fd5b610d816040518060400160405280600881526020016744414f5f524f4c4560c01b81525089611108565b610d8c8787876113e2565b610d978484846112df565b610d9f61179d565b610daf637919c7cf60e11b61180a565b8015610df4576001805461ff00191681556040519081527f7f26b83ff96e1f2b6a682f133852f6798a09c465da95921460cefb38474024989060200160405180910390a15b5050505050505050565b6001600160a01b03821660009081526067602090815260408083206001600160e01b031985168452825280832080548251818502810185019093528083528493849084015b82821015610eef578382906000526020600020018054610e6290612678565b80601f0160208091040260200160405190810160405280929190818152602001828054610e8e90612678565b8015610edb5780601f10610eb057610100808354040283529160200191610edb565b820191906000526020600020905b815481529060010190602001808311610ebe57829003601f168201915b505050505081526020019060010190610e43565b5050825192935060009150505b81811015610f3d57610f27838281518110610f1957610f196126b2565b602002602001015188610749565b15610f355760019350610f3d565b600101610efc565b5050509392505050565b6040518060400160405280600881526020016744414f5f524f4c4560c01b8152506105bd81336110dd565b7f4910fdfa16fed3260ed0e7147f7cc6da11a60208b5b9406d12a635614ffd91435460ff1615610fa55761069183611889565b826001600160a01b03166352d1902d6040518163ffffffff1660e01b8152600401602060405180830381865afa925050508015610fff575060408051601f3d908101601f19168201909252610ffc918101906126d8565b60015b6110625760405162461bcd60e51b815260206004820152602e60248201527f45524331393637557067726164653a206e657720696d706c656d656e7461746960448201526d6f6e206973206e6f74205555505360901b6064820152608401610451565b60008051602061290183398151915281146110d15760405162461bcd60e51b815260206004820152602960248201527f45524331393637557067726164653a20756e737570706f727465642070726f786044820152681a58589b195555525160ba1b6064820152608401610451565b50610691838383611925565b6110e78282610749565b6105bd57808260405163e76ed20960e01b81526004016104519291906126f1565b6111128282610749565b6105bd576001606683604051611128919061265c565b90815260408051602092819003830181206001600160a01b038616600090815293529120805460ff1916921515929092179091557fe0ca4f6d52d59033a91ab89e93c98f9acada14e0086d8b1038284f42e6d532579061118d90849084903390612715565b60405180910390a15050565b80518251146111bb576040516311e86f7360e01b815260040160405180910390fd5b815160005b81811015610a245760008382815181106111dc576111dc6126b2565b602002602001015151905060005b8181101561124f57611247868481518110611207576112076126b2565b6020026020010151868581518110611221576112216126b2565b6020026020010151838151811061123a5761123a6126b2565b6020026020010151611108565b6001016111ea565b50506001016111c0565b6112638282610749565b156105bd57600060668360405161127a919061265c565b90815260408051602092819003830181206001600160a01b038616600090815293529120805460ff1916921515929092179091557ff3a2b91552b535c273a48d8b7453c8b0b287e20e51d74121eb50d975dbaa506d9061118d90849084903390612715565b8151835114611301576040516311e86f7360e01b815260040160405180910390fd5b8051835114611323576040516311e86f7360e01b815260040160405180910390fd5b825160005b818110156113db576000838281518110611344576113446126b2565b602002602001015151905060005b818110156113d1576113c987848151811061136f5761136f6126b2565b6020026020010151878581518110611389576113896126b2565b60200260200101518786815181106113a3576113a36126b2565b602002602001015184815181106113bc576113bc6126b2565b602002602001015161194a565b600101611352565b5050600101611328565b5050505050565b8151835114611404576040516311e86f7360e01b815260040160405180910390fd5b8051835114611426576040516311e86f7360e01b815260040160405180910390fd5b825160005b818110156113db5761146f858281518110611448576114486126b2565b6020026020010151858381518110611462576114626126b2565b6020026020010151611a04565b6000838281518110611483576114836126b2565b602002602001015151905060005b818110156114b6576114ae878481518110611207576112076126b2565b600101611491565b505060010161142b565b6000826040516020016114d3919061265c565b60408051601f1981840301815291815281516020928301206001600160a01b0387166000908152606784528281206001600160e01b03198316825290935290822054909250905b81811015610ce05783604051602001611533919061265c565b60408051601f1981840301815291815281516020928301206001600160a01b0389166000908152606784528281206001600160e01b0319881682529093529120805483908110611585576115856126b2565b9060005260206000200160405160200161159f9190612748565b6040516020818303038152906040528051906020012003611708576001600160a01b03861660009081526067602090815260408083206001600160e01b03198716845290915290206115f26001846127e3565b81548110611602576116026126b2565b600091825260208083206001600160a01b038a1684526067825260408085206001600160e01b0319891686529092529220805492909101918390811061164a5761164a6126b2565b9060005260206000200190805461166090612678565b61166b929190611bfb565b506001600160a01b03861660009081526067602090815260408083206001600160e01b03198716845290915290208054806116a8576116a8612808565b6001900381819060005260206000200160006116c49190611c86565b90557fa5e6b7a93ed253db6d2a06b5188982d74e373c1b7ef9ad991c6b619c2add4d22868685876040516116fb949392919061281e565b60405180910390a1610ce0565b60010161151a565b600154600090610100900460ff1615611759578160ff1660011480156117355750303b155b6117515760405162461bcd60e51b81526004016104519061286f565b506000919050565b60015460ff8084169116106117805760405162461bcd60e51b81526004016104519061286f565b506001805460ff191660ff9290921691909117815590565b919050565b600154610100900460ff166118085760405162461bcd60e51b815260206004820152602b60248201527f496e697469616c697a61626c653a20636f6e7472616374206973206e6f74206960448201526a6e697469616c697a696e6760a81b6064820152608401610451565b565b6001600160e01b031980821690036118645760405162461bcd60e51b815260206004820152601c60248201527f4552433136353a20696e76616c696420696e74657266616365206964000000006044820152606401610451565b6001600160e01b0319166000908152602081905260409020805460ff19166001179055565b6001600160a01b0381163b6118f65760405162461bcd60e51b815260206004820152602d60248201527f455243313936373a206e657720696d706c656d656e746174696f6e206973206e60448201526c1bdd08184818dbdb9d1c9858dd609a1b6064820152608401610451565b60008051602061290183398151915280546001600160a01b0319166001600160a01b0392909216919091179055565b61192e83611a87565b60008251118061193b5750805b1561069157610a248383611ac7565b60008260405160200161195d919061265c565b60408051601f1981840301815291815281516020928301206001600160a01b0387166000908152606784528281206001600160e01b031983168252845291822080546001810182559083529183902085519194506119c093920191850190611cc0565b507fb8b75e5cd091bf22489bd28795bbe9e9fc969f14231a8172a0048223d4b7a4aa848483856040516119f6949392919061281e565b60405180910390a150505050565b6000611a0f83610696565b905081606684604051611a22919061265c565b90815260200160405180910390206001019080519060200190611a46929190611cc0565b507ffaadb760342a16b35af55a84cf4830682730345e7808265fdaa03ad9e47a335e838284604051611a7a939291906128bd565b60405180910390a1505050565b611a9081611889565b6040516001600160a01b038216907fbc7cd75a20ee27fd9adebab32041f755214dbc6bffa90cc0225b39da2e5c2d3b90600090a250565b60606001600160a01b0383163b611b2f5760405162461bcd60e51b815260206004820152602660248201527f416464726573733a2064656c65676174652063616c6c20746f206e6f6e2d636f6044820152651b9d1c9858dd60d21b6064820152608401610451565b600080846001600160a01b031684604051611b4a919061265c565b600060405180830381855af49150503d8060008114611b85576040519150601f19603f3d011682016040523d82523d6000602084013e611b8a565b606091505b5091509150611bb2828260405180606001604052806027815260200161292160279139611bbb565b95945050505050565b60608315611bca575081611bf4565b825115611bda5782518084602001fd5b8160405162461bcd60e51b81526004016104519190611fad565b9392505050565b828054611c0790612678565b90600052602060002090601f016020900481019282611c295760008555611c76565b82601f10611c3a5780548555611c76565b82800160010185558215611c7657600052602060002091601f016020900482015b82811115611c76578254825591600101919060010190611c5b565b50611c82929150611d34565b5090565b508054611c9290612678565b6000825580601f10611ca2575050565b601f0160209004906000526020600020908101906104ee9190611d34565b828054611ccc90612678565b90600052602060002090601f016020900481019282611cee5760008555611c76565b82601f10611d0757805160ff1916838001178555611c76565b82800160010185558215611c76579182015b82811115611c76578251825591602001919060010190611d19565b5b80821115611c825760008155600101611d35565b80356001600160e01b03198116811461179857600080fd5b600060208284031215611d7357600080fd5b611bf482611d49565b80356001600160a01b038116811461179857600080fd5b600060208284031215611da557600080fd5b611bf482611d7c565b634e487b7160e01b600052604160045260246000fd5b604051601f8201601f191681016001600160401b0381118282101715611dec57611dec611dae565b604052919050565b60006001600160401b03831115611e0d57611e0d611dae565b611e20601f8401601f1916602001611dc4565b9050828152838383011115611e3457600080fd5b828260208301376000602084830101529392505050565b60008060408385031215611e5e57600080fd5b611e6783611d7c565b915060208301356001600160401b03811115611e8257600080fd5b8301601f81018513611e9357600080fd5b611ea285823560208401611df4565b9150509250929050565b600082601f830112611ebd57600080fd5b611bf483833560208501611df4565b60008060408385031215611edf57600080fd5b82356001600160401b03811115611ef557600080fd5b611f0185828601611eac565b925050611f1060208401611d7c565b90509250929050565b600060208284031215611f2b57600080fd5b81356001600160401b03811115611f4157600080fd5b611f4d84828501611eac565b949350505050565b60005b83811015611f70578181015183820152602001611f58565b83811115610a245750506000910152565b60008151808452611f99816020860160208601611f55565b601f01601f19169290920160200192915050565b602081526000611bf46020830184611f81565b60008060008060608587031215611fd657600080fd5b84356001600160401b0380821115611fed57600080fd5b818701915087601f83011261200157600080fd5b81358181111561201057600080fd5b88602082850101111561202257600080fd5b6020830196508095505061203860208801611d7c565b9350604087013591508082111561204e57600080fd5b5061205b87828801611eac565b91505092959194509250565b60006001600160401b0382111561208057612080611dae565b5060051b60200190565b600082601f83011261209b57600080fd5b813560206120b06120ab83612067565b611dc4565b82815260059290921b840181019181810190868411156120cf57600080fd5b8286015b8481101561210e5780356001600160401b038111156120f25760008081fd5b6121008986838b0101611eac565b8452509183019183016120d3565b509695505050505050565b600082601f83011261212a57600080fd5b8135602061213a6120ab83612067565b82815260059290921b8401810191818101908684111561215957600080fd5b8286015b8481101561210e5761216e81611d7c565b835291830191830161215d565b600082601f83011261218c57600080fd5b8135602061219c6120ab83612067565b82815260059290921b840181019181810190868411156121bb57600080fd5b8286015b8481101561210e5780356001600160401b038111156121de5760008081fd5b6121ec8986838b0101612119565b8452509183019183016121bf565b6000806040838503121561220d57600080fd5b82356001600160401b038082111561222457600080fd5b6122308683870161208a565b9350602085013591508082111561224657600080fd5b50611ea28582860161217b565b600082601f83011261226457600080fd5b813560206122746120ab83612067565b82815260059290921b8401810191818101908684111561229357600080fd5b8286015b8481101561210e5780356001600160401b038111156122b65760008081fd5b6122c48986838b010161208a565b845250918301918301612297565b6000806000606084860312156122e757600080fd5b83356001600160401b03808211156122fe57600080fd5b61230a87838801612119565b9450602086013591508082111561232057600080fd5b61232c8783880161208a565b9350604086013591508082111561234257600080fd5b5061234f86828701612253565b9150509250925092565b6000806040838503121561236c57600080fd5b61237583611d7c565b915060208301356001600160401b0381111561239057600080fd5b611ea285828601611eac565b6000602080830181845280855180835260408601915060408160051b870101925083870160005b828110156123f157603f198886030184526123df858351611f81565b945092850192908501906001016123c3565b5092979650505050505050565b60008060006060848603121561241357600080fd5b83356001600160401b038082111561242a57600080fd5b6124368783880161208a565b9450602086013591508082111561244c57600080fd5b6124588783880161208a565b9350604086013591508082111561246e57600080fd5b5061234f8682870161217b565b600080600080600080600060e0888a03121561249657600080fd5b61249f88611d7c565b965060208801356001600160401b03808211156124bb57600080fd5b6124c78b838c0161208a565b975060408a01359150808211156124dd57600080fd5b6124e98b838c0161208a565b965060608a01359150808211156124ff57600080fd5b61250b8b838c0161217b565b955060808a013591508082111561252157600080fd5b61252d8b838c01612119565b945060a08a013591508082111561254357600080fd5b61254f8b838c0161208a565b935060c08a013591508082111561256557600080fd5b506125728a828b01612253565b91505092959891949750929550565b60008060006060848603121561259657600080fd5b61259f84611d7c565b92506125ad60208501611d7c565b91506125bb60408501611d49565b90509250925092565b6020808252602c908201527f46756e6374696f6e206d7573742062652063616c6c6564207468726f7567682060408201526b19195b1959d85d1958d85b1b60a21b606082015260800190565b6020808252602c908201527f46756e6374696f6e206d7573742062652063616c6c6564207468726f7567682060408201526b6163746976652070726f787960a01b606082015260800190565b6000825161266e818460208701611f55565b9190910192915050565b600181811c9082168061268c57607f821691505b6020821081036126ac57634e487b7160e01b600052602260045260246000fd5b50919050565b634e487b7160e01b600052603260045260246000fd5b8183823760009101908152919050565b6000602082840312156126ea57600080fd5b5051919050565b6001600160a01b0383168152604060208201819052600090611f4d90830184611f81565b6060815260006127286060830186611f81565b6001600160a01b0394851660208401529290931660409091015292915050565b600080835481600182811c91508083168061276457607f831692505b6020808410820361278357634e487b7160e01b86526022600452602486fd5b81801561279757600181146127a8576127d5565b60ff198616895284890196506127d5565b60008a81526020902060005b868110156127cd5781548b8201529085019083016127b4565b505084890196505b509498975050505050505050565b60008282101561280357634e487b7160e01b600052601160045260246000fd5b500390565b634e487b7160e01b600052603160045260246000fd5b6001600160a01b038516815260806020820181905260009061284290830186611f81565b6001600160e01b03198516604084015282810360608401526128648185611f81565b979650505050505050565b6020808252602e908201527f496e697469616c697a61626c653a20636f6e747261637420697320616c72656160408201526d191e481a5b9a5d1a585b1a5e995960921b606082015260800190565b6060815260006128d06060830186611f81565b82810360208401526128e28186611f81565b905082810360408401526128f68185611f81565b969550505050505056fe360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc416464726573733a206c6f772d6c6576656c2064656c65676174652063616c6c206661696c6564a2646970667358221220eee1e377fd49c9f0abdddd2c527bd8fa17664e2d6434e37ea321c38cd09eb23a64736f6c634300080d0033";

type DAOAccessControlConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: DAOAccessControlConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class DAOAccessControl__factory extends ContractFactory {
  constructor(...args: DAOAccessControlConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
  }

  override deploy(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<DAOAccessControl> {
    return super.deploy(overrides || {}) as Promise<DAOAccessControl>;
  }
  override getDeployTransaction(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  override attach(address: string): DAOAccessControl {
    return super.attach(address) as DAOAccessControl;
  }
  override connect(signer: Signer): DAOAccessControl__factory {
    return super.connect(signer) as DAOAccessControl__factory;
  }

  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): DAOAccessControlInterface {
    return new utils.Interface(_abi) as DAOAccessControlInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): DAOAccessControl {
    return new Contract(address, _abi, signerOrProvider) as DAOAccessControl;
  }
}
