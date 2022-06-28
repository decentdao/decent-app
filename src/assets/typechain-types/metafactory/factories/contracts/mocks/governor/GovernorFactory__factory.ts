/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import type { Provider, TransactionRequest } from "@ethersproject/providers";
import type {
  GovernorFactory,
  GovernorFactoryInterface,
} from "../../../../contracts/mocks/governor/GovernorFactory";

const _abi = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "timelock",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "governorModule",
        type: "address",
      },
    ],
    name: "GovernorCreated",
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
        name: "previousOwner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "OwnershipTransferred",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "string",
        name: "semanticVersion",
        type: "string",
      },
      {
        indexed: false,
        internalType: "string",
        name: "frontendURI",
        type: "string",
      },
      {
        indexed: false,
        internalType: "address",
        name: "impl",
        type: "address",
      },
    ],
    name: "VersionCreated",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "_semanticVersion",
        type: "string",
      },
      {
        internalType: "string",
        name: "_frontendURI",
        type: "string",
      },
      {
        internalType: "address",
        name: "_impl",
        type: "address",
      },
    ],
    name: "addVersion",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes[]",
        name: "data",
        type: "bytes[]",
      },
    ],
    name: "create",
    outputs: [
      {
        internalType: "address[]",
        name: "",
        type: "address[]",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "initialize",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
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
    name: "renounceOwnership",
    outputs: [],
    stateMutability: "nonpayable",
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
        name: "newOwner",
        type: "address",
      },
    ],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "versionControl",
    outputs: [
      {
        internalType: "string",
        name: "semanticVersion",
        type: "string",
      },
      {
        internalType: "string",
        name: "frontendURI",
        type: "string",
      },
      {
        internalType: "address",
        name: "impl",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

const _bytecode =
  "0x608060405234801561001057600080fd5b5061001a3361001f565b61006f565b600080546001600160a01b038381166001600160a01b0319831681178455604051919092169283917f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e09190a35050565b611de58061007e6000396000f3fe60806040523480156200001157600080fd5b5060043610620000935760003560e01c80638da5cb5b11620000625780638da5cb5b14620000f1578063cacdc398146200010d578063d7bef6ce1462000133578063f2fde38b146200015b57600080fd5b806301ffc9a714620000985780634d4a76f514620000c4578063715018a614620000dd5780638129fc1c14620000e7575b600080fd5b620000af620000a93660046200102a565b62000172565b60405190151581526020015b60405180910390f35b620000db620000d5366004620010bf565b620001b3565b005b620000db6200032a565b620000db62000365565b6000546040516001600160a01b039091168152602001620000bb565b620001246200011e3660046200114c565b620003e6565b604051620000bb9190620011c6565b6200014a6200014436600462001215565b62000554565b604051620000bb9392919062001290565b620000db6200016c366004620012d2565b620006b8565b60006301ffc9a760e01b6001600160e01b031983161480620001ad57506001600160e01b0319821660009081526001602052604090205460ff165b92915050565b6000546001600160a01b03163314620001e95760405162461bcd60e51b8152600401620001e090620012f2565b60405180910390fd5b6040805160806020601f88018190040282018101909252606081018681526002928291908990899081908501838280828437600092019190915250505090825250604080516020601f88018190048102820181019092528681529181019190879087908190840183828082843760009201829052509385525050506001600160a01b0385166020928301528354600181018555938152819020825180519394600302909101926200029e928492019062000f76565b506020828101518051620002b9926001850192019062000f76565b5060409182015160029190910180546001600160a01b0319166001600160a01b03909216919091179055517f55333c8005b89ec35427ce0dee089bf2afe5d50fd45f9afd62478d8c299f9999906200031b908790879087908790879062001350565b60405180910390a15050505050565b6000546001600160a01b03163314620003575760405162461bcd60e51b8152600401620001e090620012f2565b62000363600062000752565b565b6000620003736001620007a2565b9050801562000390576000805460ff60a81b1916600160a81b1790555b6200039a62000845565b8015620003e3576000805460ff60a81b19169055604051600181527f7f26b83ff96e1f2b6a682f133852f6798a09c465da95921460cefb38474024989060200160405180910390a15b50565b60408051600280825260608083018452926000929190602083019080368337019050509050620004216200041b8486620013e0565b620008c6565b81600181518110620004375762000437620014c5565b60200260200101906001600160a01b031690816001600160a01b0316815250506200048e81600181518110620004715762000471620014c5565b6020026020010151858590620004889190620013e0565b62000b0e565b81600081518110620004a457620004a4620014c5565b60200260200101906001600160a01b031690816001600160a01b0316815250507fb6b3fe2c7fc656c523405911942be2fac1c0d67804bf2547f3fd7351574915ab81600081518110620004fb57620004fb620014c5565b602002602001015182600181518110620005195762000519620014c5565b6020026020010151604051620005459291906001600160a01b0392831681529116602082015260400190565b60405180910390a19392505050565b600281815481106200056557600080fd5b90600052602060002090600302016000915090508060000180546200058a90620014db565b80601f0160208091040260200160405190810160405280929190818152602001828054620005b890620014db565b8015620006095780601f10620005dd5761010080835404028352916020019162000609565b820191906000526020600020905b815481529060010190602001808311620005eb57829003601f168201915b5050505050908060010180546200062090620014db565b80601f01602080910402602001604051908101604052809291908181526020018280546200064e90620014db565b80156200069f5780601f1062000673576101008083540402835291602001916200069f565b820191906000526020600020905b8154815290600101906020018083116200068157829003601f168201915b505050600290930154919250506001600160a01b031683565b6000546001600160a01b03163314620006e55760405162461bcd60e51b8152600401620001e090620012f2565b6001600160a01b0381166200074c5760405162461bcd60e51b815260206004820152602660248201527f4f776e61626c653a206e6577206f776e657220697320746865207a65726f206160448201526564647265737360d01b6064820152608401620001e0565b620003e3815b600080546001600160a01b038381166001600160a01b0319831681178455604051919092169283917f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e09190a35050565b60008054600160a81b900460ff1615620007f0578160ff166001148015620007c95750303b155b620007e85760405162461bcd60e51b8152600401620001e09062001517565b506000919050565b60005460ff808416600160a01b9092041610620008215760405162461bcd60e51b8152600401620001e09062001517565b506000805460ff909216600160a01b0260ff60a01b19909216919091179055600190565b600054600160a81b900460ff16620008b45760405162461bcd60e51b815260206004820152602b60248201527f496e697469616c697a61626c653a20636f6e7472616374206973206e6f74206960448201526a6e697469616c697a696e6760a81b6064820152608401620001e0565b62000363638787b56d60e01b62000ddf565b6000620009f66000324685600b81518110620008e657620008e6620014c5565b602002602001015180602001905181019062000903919062001565565b60405160609390931b6bffffffffffffffffffffffff19166020840152603483019190915260548201526074016040516020818303038152906040528051906020012060405180602001620009589062001005565b6020820181038252601f19601f8201166040525085600481518110620009825762000982620014c5565b60200260200101518060200190518101906200099f91906200157f565b604080516001600160a01b039092166020830152818101526000606082015260800160408051601f1981840301815290829052620009e192916020016200159f565b60405160208183030381529060405262000e63565b9050806001600160a01b0316631794bb3c8360018151811062000a1d5762000a1d620014c5565b602002602001015180602001905181019062000a3a91906200157f565b8460008151811062000a505762000a50620014c5565b602002602001015180602001905181019062000a6d91906200157f565b85600a8151811062000a835762000a83620014c5565b602002602001015180602001905181019062000aa0919062001565565b6040516001600160e01b031960e086901b1681526001600160a01b0393841660048201529290911660248301526044820152606401600060405180830381600087803b15801562000af057600080fd5b505af115801562000b05573d6000803e3d6000fd5b50505050919050565b600062000bca6000324685600b8151811062000b2e5762000b2e620014c5565b602002602001015180602001905181019062000b4b919062001565565b60405160609390931b6bffffffffffffffffffffffff1916602084015260348301919091526054820152607401604051602081830303815290604052805190602001206040518060200162000ba09062001005565b6020820181038252601f19601f8201166040525085600381518110620009825762000982620014c5565b9050806001600160a01b03166358ae77ee8360028151811062000bf15762000bf1620014c5565b602002602001015180602001905181019062000c0e91906200157f565b858560058151811062000c255762000c25620014c5565b602002602001015180602001905181019062000c429190620015d2565b8660068151811062000c585762000c58620014c5565b602002602001015180602001905181019062000c75919062001565565b8760078151811062000c8b5762000c8b620014c5565b602002602001015180602001905181019062000ca8919062001565565b8860088151811062000cbe5762000cbe620014c5565b602002602001015180602001905181019062000cdb919062001565565b8960098151811062000cf15762000cf1620014c5565b602002602001015180602001905181019062000d0e919062001565565b8a60018151811062000d245762000d24620014c5565b602002602001015180602001905181019062000d4191906200157f565b6040516001600160e01b031960e08b901b1681526001600160a01b039889166004820152968816602488015267ffffffffffffffff90951660448701526064860193909352608485019190915260a484015260c48301529190911660e482015261010401600060405180830381600087803b15801562000dc057600080fd5b505af115801562000dd5573d6000803e3d6000fd5b5050505092915050565b6001600160e01b0319808216900362000e3b5760405162461bcd60e51b815260206004820152601c60248201527f4552433136353a20696e76616c696420696e74657266616365206964000000006044820152606401620001e0565b6001600160e01b0319166000908152600160208190526040909120805460ff19169091179055565b6000808447101562000eb85760405162461bcd60e51b815260206004820152601d60248201527f437265617465323a20696e73756666696369656e742062616c616e63650000006044820152606401620001e0565b825160000362000f0b5760405162461bcd60e51b815260206004820181905260248201527f437265617465323a2062797465636f6465206c656e677468206973207a65726f6044820152606401620001e0565b8383516020850187f590506001600160a01b03811662000f6e5760405162461bcd60e51b815260206004820152601960248201527f437265617465323a204661696c6564206f6e206465706c6f79000000000000006044820152606401620001e0565b949350505050565b82805462000f8490620014db565b90600052602060002090601f01602090048101928262000fa8576000855562000ff3565b82601f1062000fc357805160ff191683800117855562000ff3565b8280016001018555821562000ff3579182015b8281111562000ff357825182559160200191906001019062000fd6565b506200100192915062001013565b5090565b6107b180620015ff83390190565b5b8082111562001001576000815560010162001014565b6000602082840312156200103d57600080fd5b81356001600160e01b0319811681146200105657600080fd5b9392505050565b60008083601f8401126200107057600080fd5b50813567ffffffffffffffff8111156200108957600080fd5b602083019150836020828501011115620010a257600080fd5b9250929050565b6001600160a01b0381168114620003e357600080fd5b600080600080600060608688031215620010d857600080fd5b853567ffffffffffffffff80821115620010f157600080fd5b620010ff89838a016200105d565b909750955060208801359150808211156200111957600080fd5b5062001128888289016200105d565b90945092505060408601356200113e81620010a9565b809150509295509295909350565b600080602083850312156200116057600080fd5b823567ffffffffffffffff808211156200117957600080fd5b818501915085601f8301126200118e57600080fd5b8135818111156200119e57600080fd5b8660208260051b8501011115620011b457600080fd5b60209290920196919550909350505050565b6020808252825182820181905260009190848201906040850190845b81811015620012095783516001600160a01b031683529284019291840191600101620011e2565b50909695505050505050565b6000602082840312156200122857600080fd5b5035919050565b60005b838110156200124c57818101518382015260200162001232565b838111156200125c576000848401525b50505050565b600081518084526200127c8160208601602086016200122f565b601f01601f19169290920160200192915050565b606081526000620012a5606083018662001262565b8281036020840152620012b9818662001262565b91505060018060a01b0383166040830152949350505050565b600060208284031215620012e557600080fd5b81356200105681620010a9565b6020808252818101527f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e6572604082015260600190565b81835281816020850137506000828201602090810191909152601f909101601f19169091010190565b6060815260006200136660608301878962001327565b82810360208401526200137b81868862001327565b91505060018060a01b03831660408301529695505050505050565b634e487b7160e01b600052604160045260246000fd5b604051601f8201601f1916810167ffffffffffffffff81118282101715620013d857620013d862001396565b604052919050565b600067ffffffffffffffff80841115620013fe57620013fe62001396565b8360051b602062001411818301620013ac565b8681529185019181810190368411156200142a57600080fd5b865b84811015620014b957803586811115620014465760008081fd5b8801601f36818301126200145a5760008081fd5b8135888111156200146f576200146f62001396565b62001482818301601f19168801620013ac565b915080825236878285010111156200149a5760008081fd5b808784018884013760009082018701528452509183019183016200142c565b50979650505050505050565b634e487b7160e01b600052603260045260246000fd5b600181811c90821680620014f057607f821691505b6020821081036200151157634e487b7160e01b600052602260045260246000fd5b50919050565b6020808252602e908201527f496e697469616c697a61626c653a20636f6e747261637420697320616c72656160408201526d191e481a5b9a5d1a585b1a5e995960921b606082015260800190565b6000602082840312156200157857600080fd5b5051919050565b6000602082840312156200159257600080fd5b81516200105681620010a9565b60008351620015b38184602088016200122f565b835190830190620015c98183602088016200122f565b01949350505050565b600060208284031215620015e557600080fd5b815167ffffffffffffffff811681146200105657600080fdfe60806040526040516107b13803806107b183398101604081905261002291610349565b61004d60017f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbd610417565b60008051602061076a833981519152146100695761006961043c565b6100758282600061007c565b50506104a1565b610085836100b2565b6000825111806100925750805b156100ad576100ab83836100f260201b6100291760201c565b505b505050565b6100bb8161011e565b6040516001600160a01b038216907fbc7cd75a20ee27fd9adebab32041f755214dbc6bffa90cc0225b39da2e5c2d3b90600090a250565b6060610117838360405180606001604052806027815260200161078a602791396101de565b9392505050565b610131816102bc60201b6100551760201c565b6101985760405162461bcd60e51b815260206004820152602d60248201527f455243313936373a206e657720696d706c656d656e746174696f6e206973206e60448201526c1bdd08184818dbdb9d1c9858dd609a1b60648201526084015b60405180910390fd5b806101bd60008051602061076a83398151915260001b6102cb60201b6100641760201c565b80546001600160a01b0319166001600160a01b039290921691909117905550565b60606001600160a01b0384163b6102465760405162461bcd60e51b815260206004820152602660248201527f416464726573733a2064656c65676174652063616c6c20746f206e6f6e2d636f6044820152651b9d1c9858dd60d21b606482015260840161018f565b600080856001600160a01b0316856040516102619190610452565b600060405180830381855af49150503d806000811461029c576040519150601f19603f3d011682016040523d82523d6000602084013e6102a1565b606091505b5090925090506102b28282866102ce565b9695505050505050565b6001600160a01b03163b151590565b90565b606083156102dd575081610117565b8251156102ed5782518084602001fd5b8160405162461bcd60e51b815260040161018f919061046e565b634e487b7160e01b600052604160045260246000fd5b60005b83811015610338578181015183820152602001610320565b838111156100ab5750506000910152565b6000806040838503121561035c57600080fd5b82516001600160a01b038116811461037357600080fd5b60208401519092506001600160401b038082111561039057600080fd5b818501915085601f8301126103a457600080fd5b8151818111156103b6576103b6610307565b604051601f8201601f19908116603f011681019083821181831017156103de576103de610307565b816040528281528860208487010111156103f757600080fd5b61040883602083016020880161031d565b80955050505050509250929050565b60008282101561043757634e487b7160e01b600052601160045260246000fd5b500390565b634e487b7160e01b600052600160045260246000fd5b6000825161046481846020870161031d565b9190910192915050565b602081526000825180602084015261048d81604085016020870161031d565b601f01601f19169190910160400192915050565b6102ba806104b06000396000f3fe60806040523661001357610011610017565b005b6100115b610027610022610067565b61009f565b565b606061004e838360405180606001604052806027815260200161025e602791396100c3565b9392505050565b6001600160a01b03163b151590565b90565b600061009a7f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc546001600160a01b031690565b905090565b3660008037600080366000845af43d6000803e8080156100be573d6000f35b3d6000fd5b60606001600160a01b0384163b6101305760405162461bcd60e51b815260206004820152602660248201527f416464726573733a2064656c65676174652063616c6c20746f206e6f6e2d636f6044820152651b9d1c9858dd60d21b60648201526084015b60405180910390fd5b600080856001600160a01b03168560405161014b919061020e565b600060405180830381855af49150503d8060008114610186576040519150601f19603f3d011682016040523d82523d6000602084013e61018b565b606091505b509150915061019b8282866101a5565b9695505050505050565b606083156101b457508161004e565b8251156101c45782518084602001fd5b8160405162461bcd60e51b8152600401610127919061022a565b60005b838110156101f95781810151838201526020016101e1565b83811115610208576000848401525b50505050565b600082516102208184602087016101de565b9190910192915050565b60208152600082518060208401526102498160408501602087016101de565b601f01601f1916919091016040019291505056fe416464726573733a206c6f772d6c6576656c2064656c65676174652063616c6c206661696c6564a2646970667358221220dbc069e7147f56673a04178d356beb6746c87968c24deac86cbfc46e601875d364736f6c634300080d0033360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc416464726573733a206c6f772d6c6576656c2064656c65676174652063616c6c206661696c6564a2646970667358221220d1693d9c6a9c8f739d0cc81256b16e7554a82d169c4a1b558e903cb8d7b8029064736f6c634300080d0033";

type GovernorFactoryConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: GovernorFactoryConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class GovernorFactory__factory extends ContractFactory {
  constructor(...args: GovernorFactoryConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
  }

  override deploy(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<GovernorFactory> {
    return super.deploy(overrides || {}) as Promise<GovernorFactory>;
  }
  override getDeployTransaction(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  override attach(address: string): GovernorFactory {
    return super.attach(address) as GovernorFactory;
  }
  override connect(signer: Signer): GovernorFactory__factory {
    return super.connect(signer) as GovernorFactory__factory;
  }

  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): GovernorFactoryInterface {
    return new utils.Interface(_abi) as GovernorFactoryInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): GovernorFactory {
    return new Contract(address, _abi, signerOrProvider) as GovernorFactory;
  }
}
