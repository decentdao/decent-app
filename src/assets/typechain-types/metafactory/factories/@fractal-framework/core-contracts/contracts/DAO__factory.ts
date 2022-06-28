/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import type { Provider, TransactionRequest } from "@ethersproject/providers";
import type {
  DAO,
  DAOInterface,
} from "../../../../@fractal-framework/core-contracts/contracts/DAO";

const _abi = [
  {
    inputs: [],
    name: "NotAuthorized",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "Unauthorized",
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
        internalType: "address[]",
        name: "targets",
        type: "address[]",
      },
      {
        indexed: false,
        internalType: "uint256[]",
        name: "values",
        type: "uint256[]",
      },
      {
        indexed: false,
        internalType: "bytes[]",
        name: "calldatas",
        type: "bytes[]",
      },
    ],
    name: "Executed",
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
    name: "accessControl",
    outputs: [
      {
        internalType: "contract IDAOAccessControl",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
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
        internalType: "uint256[]",
        name: "values",
        type: "uint256[]",
      },
      {
        internalType: "bytes[]",
        name: "calldatas",
        type: "bytes[]",
      },
    ],
    name: "execute",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_accessControl",
        type: "address",
      },
      {
        internalType: "address",
        name: "_moduleFactory",
        type: "address",
      },
      {
        internalType: "string",
        name: "_name",
        type: "string",
      },
    ],
    name: "initialize",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "moduleFactory",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
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
];

const _bytecode =
  "0x60a06040523060805234801561001457600080fd5b5060805161160b61004c60003960008181610299015281816102e201528181610443015281816104830152610516015261160b6000f3fe6080604052600436106100865760003560e01c80634571e3a6116100595780634571e3a61461013c5780634f1ef2861461015c57806352d1902d1461016f5780638991255b14610192578063a516a5bf146101b257600080fd5b806301ffc9a71461008b57806306fdde03146100c057806313007d55146100e25780633659cfe61461011a575b600080fd5b34801561009757600080fd5b506100ab6100a6366004610eaf565b6101d2565b60405190151581526020015b60405180910390f35b3480156100cc57600080fd5b506100d56101fd565b6040516100b79190610f05565b3480156100ee57600080fd5b50606654610102906001600160a01b031681565b6040516001600160a01b0390911681526020016100b7565b34801561012657600080fd5b5061013a610135366004610f4f565b61028f565b005b34801561014857600080fd5b5061013a610157366004610f6a565b610377565b61013a61016a36600461100e565b610439565b34801561017b57600080fd5b50610184610509565b6040519081526020016100b7565b34801561019e57600080fd5b50606754610102906001600160a01b031681565b3480156101be57600080fd5b5061013a6101cd36600461111c565b6105bc565b60006001600160e01b0319821663e067461960e01b14806101f757506101f7826107da565b92915050565b60606068805461020c906111b6565b80601f0160208091040260200160405190810160405280929190818152602001828054610238906111b6565b80156102855780601f1061025a57610100808354040283529160200191610285565b820191906000526020600020905b81548152906001019060200180831161026857829003601f168201915b5050505050905090565b6001600160a01b037f00000000000000000000000000000000000000000000000000000000000000001630036102e05760405162461bcd60e51b81526004016102d7906111f0565b60405180910390fd5b7f00000000000000000000000000000000000000000000000000000000000000006001600160a01b031661032960008051602061158f833981519152546001600160a01b031690565b6001600160a01b03161461034f5760405162461bcd60e51b81526004016102d79061123c565b61035881610816565b60408051600080825260208201909252610374918391906108b7565b50565b60006103836001610a27565b9050801561039b576000805461ff0019166101001790555b6103dc858585858080601f016020809104026020016040519081016040528093929190818152602001838380828437600092019190915250610ab492505050565b6103ec63e067461960e01b610b33565b8015610432576000805461ff0019169055604051600181527f7f26b83ff96e1f2b6a682f133852f6798a09c465da95921460cefb38474024989060200160405180910390a15b5050505050565b6001600160a01b037f00000000000000000000000000000000000000000000000000000000000000001630036104815760405162461bcd60e51b81526004016102d7906111f0565b7f00000000000000000000000000000000000000000000000000000000000000006001600160a01b03166104ca60008051602061158f833981519152546001600160a01b031690565b6001600160a01b0316146104f05760405162461bcd60e51b81526004016102d79061123c565b6104f982610816565b610505828260016108b7565b5050565b6000306001600160a01b037f000000000000000000000000000000000000000000000000000000000000000016146105a95760405162461bcd60e51b815260206004820152603860248201527f555550535570677261646561626c653a206d757374206e6f742062652063616c60448201527f6c6564207468726f7567682064656c656761746563616c6c000000000000000060648201526084016102d7565b5060008051602061158f83398151915290565b6066546040516001623b410b60e21b031981526001600160a01b039091169063ff12fbd4906105ff90339030906001600160e01b03196000351690600401611288565b602060405180830381865afa15801561061c573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061064091906112b5565b61065d5760405163ea8e4eb560e01b815260040160405180910390fd5b848314158061066c5750848114155b1561068a576040516311e86f7360e01b815260040160405180910390fd5b600060405180606001604052806022815260200161156d6022913990508560005b8181101561078e576000808a8a848181106106c8576106c86112d7565b90506020020160208101906106dd9190610f4f565b6001600160a01b03168989858181106106f8576106f86112d7565b90506020020135888886818110610711576107116112d7565b905060200281019061072391906112ed565b604051610731929190611334565b60006040518083038185875af1925050503d806000811461076e576040519150601f19603f3d011682016040523d82523d6000602084013e610773565b606091505b5091509150610783828287610bb2565b5050506001016106ab565b507f56bfe74cbe37ff0615c4d027adf14b7793c59322d51411a0f5a26eb77abac0958888888888886040516107c8969594939291906113fe565b60405180910390a15050505050505050565b60006301ffc9a760e01b6001600160e01b0319831614806101f75750506001600160e01b03191660009081526065602052604090205460ff1690565b6066546040516001623b410b60e21b031981526001600160a01b039091169063ff12fbd49061085990339030906001600160e01b03196000351690600401611288565b602060405180830381865afa158015610876573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061089a91906112b5565b6103745760405163ea8e4eb560e01b815260040160405180910390fd5b7f4910fdfa16fed3260ed0e7147f7cc6da11a60208b5b9406d12a635614ffd91435460ff16156108ef576108ea83610bf2565b505050565b826001600160a01b03166352d1902d6040518163ffffffff1660e01b8152600401602060405180830381865afa925050508015610949575060408051601f3d908101601f191682019092526109469181019061149e565b60015b6109ac5760405162461bcd60e51b815260206004820152602e60248201527f45524331393637557067726164653a206e657720696d706c656d656e7461746960448201526d6f6e206973206e6f74205555505360901b60648201526084016102d7565b60008051602061158f8339815191528114610a1b5760405162461bcd60e51b815260206004820152602960248201527f45524331393637557067726164653a20756e737570706f727465642070726f786044820152681a58589b195555525160ba1b60648201526084016102d7565b506108ea838383610c8e565b60008054610100900460ff1615610a6e578160ff166001148015610a4a5750303b155b610a665760405162461bcd60e51b81526004016102d7906114b7565b506000919050565b60005460ff808416911610610a955760405162461bcd60e51b81526004016102d7906114b7565b506000805460ff191660ff92909216919091179055600190565b919050565b600054610100900460ff16610adb5760405162461bcd60e51b81526004016102d790611505565b606680546001600160a01b038086166001600160a01b03199283161790925560678054928516929091169190911790558051610b1e906068906020840190610e16565b50610b27610cb9565b6108ea630afed1ab60e11b5b6001600160e01b03198082169003610b8d5760405162461bcd60e51b815260206004820152601c60248201527f4552433136353a20696e76616c696420696e746572666163652069640000000060448201526064016102d7565b6001600160e01b0319166000908152606560205260409020805460ff19166001179055565b60608315610bc1575081610beb565b825115610bd15782518084602001fd5b8160405162461bcd60e51b81526004016102d79190610f05565b9392505050565b6001600160a01b0381163b610c5f5760405162461bcd60e51b815260206004820152602d60248201527f455243313936373a206e657720696d706c656d656e746174696f6e206973206e60448201526c1bdd08184818dbdb9d1c9858dd609a1b60648201526084016102d7565b60008051602061158f83398151915280546001600160a01b0319166001600160a01b0392909216919091179055565b610c9783610ce2565b600082511180610ca45750805b156108ea57610cb38383610d22565b50505050565b600054610100900460ff16610ce05760405162461bcd60e51b81526004016102d790611505565b565b610ceb81610bf2565b6040516001600160a01b038216907fbc7cd75a20ee27fd9adebab32041f755214dbc6bffa90cc0225b39da2e5c2d3b90600090a250565b60606001600160a01b0383163b610d8a5760405162461bcd60e51b815260206004820152602660248201527f416464726573733a2064656c65676174652063616c6c20746f206e6f6e2d636f6044820152651b9d1c9858dd60d21b60648201526084016102d7565b600080846001600160a01b031684604051610da59190611550565b600060405180830381855af49150503d8060008114610de0576040519150601f19603f3d011682016040523d82523d6000602084013e610de5565b606091505b5091509150610e0d82826040518060600160405280602781526020016115af60279139610bb2565b95945050505050565b828054610e22906111b6565b90600052602060002090601f016020900481019282610e445760008555610e8a565b82601f10610e5d57805160ff1916838001178555610e8a565b82800160010185558215610e8a579182015b82811115610e8a578251825591602001919060010190610e6f565b50610e96929150610e9a565b5090565b5b80821115610e965760008155600101610e9b565b600060208284031215610ec157600080fd5b81356001600160e01b031981168114610beb57600080fd5b60005b83811015610ef4578181015183820152602001610edc565b83811115610cb35750506000910152565b6020815260008251806020840152610f24816040850160208701610ed9565b601f01601f19169190910160400192915050565b80356001600160a01b0381168114610aaf57600080fd5b600060208284031215610f6157600080fd5b610beb82610f38565b60008060008060608587031215610f8057600080fd5b610f8985610f38565b9350610f9760208601610f38565b9250604085013567ffffffffffffffff80821115610fb457600080fd5b818701915087601f830112610fc857600080fd5b813581811115610fd757600080fd5b886020828501011115610fe957600080fd5b95989497505060200194505050565b634e487b7160e01b600052604160045260246000fd5b6000806040838503121561102157600080fd5b61102a83610f38565b9150602083013567ffffffffffffffff8082111561104757600080fd5b818501915085601f83011261105b57600080fd5b81358181111561106d5761106d610ff8565b604051601f8201601f19908116603f0116810190838211818310171561109557611095610ff8565b816040528281528860208487010111156110ae57600080fd5b8260208601602083013760006020848301015280955050505050509250929050565b60008083601f8401126110e257600080fd5b50813567ffffffffffffffff8111156110fa57600080fd5b6020830191508360208260051b850101111561111557600080fd5b9250929050565b6000806000806000806060878903121561113557600080fd5b863567ffffffffffffffff8082111561114d57600080fd5b6111598a838b016110d0565b9098509650602089013591508082111561117257600080fd5b61117e8a838b016110d0565b9096509450604089013591508082111561119757600080fd5b506111a489828a016110d0565b979a9699509497509295939492505050565b600181811c908216806111ca57607f821691505b6020821081036111ea57634e487b7160e01b600052602260045260246000fd5b50919050565b6020808252602c908201527f46756e6374696f6e206d7573742062652063616c6c6564207468726f7567682060408201526b19195b1959d85d1958d85b1b60a21b606082015260800190565b6020808252602c908201527f46756e6374696f6e206d7573742062652063616c6c6564207468726f7567682060408201526b6163746976652070726f787960a01b606082015260800190565b6001600160a01b0393841681529190921660208201526001600160e01b0319909116604082015260600190565b6000602082840312156112c757600080fd5b81518015158114610beb57600080fd5b634e487b7160e01b600052603260045260246000fd5b6000808335601e1984360301811261130457600080fd5b83018035915067ffffffffffffffff82111561131f57600080fd5b60200191503681900382131561111557600080fd5b8183823760009101908152919050565b81835281816020850137506000828201602090810191909152601f909101601f19169091010190565b81835260006020808501808196508560051b810191508460005b878110156113f15782840389528135601e198836030181126113a857600080fd5b8701803567ffffffffffffffff8111156113c157600080fd5b8036038913156113d057600080fd5b6113dd8682898501611344565b9a87019a9550505090840190600101611387565b5091979650505050505050565b6060808252810186905260008760808301825b8981101561143f576001600160a01b0361142a84610f38565b16825260209283019290910190600101611411565b5083810360208501528681526001600160fb1b0387111561145f57600080fd5b8660051b9150818860208301378181019150506020810160008152602084830301604085015261149081868861136d565b9a9950505050505050505050565b6000602082840312156114b057600080fd5b5051919050565b6020808252602e908201527f496e697469616c697a61626c653a20636f6e747261637420697320616c72656160408201526d191e481a5b9a5d1a585b1a5e995960921b606082015260800190565b6020808252602b908201527f496e697469616c697a61626c653a20636f6e7472616374206973206e6f74206960408201526a6e697469616c697a696e6760a81b606082015260800190565b60008251611562818460208701610ed9565b919091019291505056fe44414f3a2063616c6c20726576657274656420776974686f7574206d657373616765360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc416464726573733a206c6f772d6c6576656c2064656c65676174652063616c6c206661696c6564a2646970667358221220f358fcc415b28406e1a2d83fc262e6a3a762f8151f96f8b25addbf19e60c09fb64736f6c634300080d0033";

type DAOConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: DAOConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class DAO__factory extends ContractFactory {
  constructor(...args: DAOConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
  }

  override deploy(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<DAO> {
    return super.deploy(overrides || {}) as Promise<DAO>;
  }
  override getDeployTransaction(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  override attach(address: string): DAO {
    return super.attach(address) as DAO;
  }
  override connect(signer: Signer): DAO__factory {
    return super.connect(signer) as DAO__factory;
  }

  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): DAOInterface {
    return new utils.Interface(_abi) as DAOInterface;
  }
  static connect(address: string, signerOrProvider: Signer | Provider): DAO {
    return new Contract(address, _abi, signerOrProvider) as DAO;
  }
}
