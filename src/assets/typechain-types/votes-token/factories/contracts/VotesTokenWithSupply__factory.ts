/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import {
  Signer,
  utils,
  Contract,
  ContractFactory,
  BigNumberish,
  Overrides,
} from "ethers";
import type { Provider, TransactionRequest } from "@ethersproject/providers";
import type {
  VotesTokenWithSupply,
  VotesTokenWithSupplyInterface,
} from "../../contracts/VotesTokenWithSupply";

const _abi = [
  {
    inputs: [
      {
        internalType: "string",
        name: "name",
        type: "string",
      },
      {
        internalType: "string",
        name: "symbol",
        type: "string",
      },
      {
        internalType: "address[]",
        name: "hodlers",
        type: "address[]",
      },
      {
        internalType: "uint256[]",
        name: "allocations",
        type: "uint256[]",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "Approval",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "delegator",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "fromDelegate",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "toDelegate",
        type: "address",
      },
    ],
    name: "DelegateChanged",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "delegate",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "previousBalance",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "newBalance",
        type: "uint256",
      },
    ],
    name: "DelegateVotesChanged",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "Transfer",
    type: "event",
  },
  {
    inputs: [],
    name: "DOMAIN_SEPARATOR",
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
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
    ],
    name: "allowance",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "approve",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "balanceOf",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        internalType: "uint32",
        name: "pos",
        type: "uint32",
      },
    ],
    name: "checkpoints",
    outputs: [
      {
        components: [
          {
            internalType: "uint32",
            name: "fromBlock",
            type: "uint32",
          },
          {
            internalType: "uint224",
            name: "votes",
            type: "uint224",
          },
        ],
        internalType: "struct ERC20Votes.Checkpoint",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [
      {
        internalType: "uint8",
        name: "",
        type: "uint8",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "subtractedValue",
        type: "uint256",
      },
    ],
    name: "decreaseAllowance",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "delegatee",
        type: "address",
      },
    ],
    name: "delegate",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "delegatee",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "nonce",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "expiry",
        type: "uint256",
      },
      {
        internalType: "uint8",
        name: "v",
        type: "uint8",
      },
      {
        internalType: "bytes32",
        name: "r",
        type: "bytes32",
      },
      {
        internalType: "bytes32",
        name: "s",
        type: "bytes32",
      },
    ],
    name: "delegateBySig",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "delegates",
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
    inputs: [
      {
        internalType: "uint256",
        name: "blockNumber",
        type: "uint256",
      },
    ],
    name: "getPastTotalSupply",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "blockNumber",
        type: "uint256",
      },
    ],
    name: "getPastVotes",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "getVotes",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "addedValue",
        type: "uint256",
      },
    ],
    name: "increaseAllowance",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
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
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
    ],
    name: "nonces",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "numCheckpoints",
    outputs: [
      {
        internalType: "uint32",
        name: "",
        type: "uint32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "deadline",
        type: "uint256",
      },
      {
        internalType: "uint8",
        name: "v",
        type: "uint8",
      },
      {
        internalType: "bytes32",
        name: "r",
        type: "bytes32",
      },
      {
        internalType: "bytes32",
        name: "s",
        type: "bytes32",
      },
    ],
    name: "permit",
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
    inputs: [],
    name: "symbol",
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
    name: "totalSupply",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "transfer",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "transferFrom",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
];

const _bytecode =
  "0x6101606040527f6e71edae12b1b97f4d1f60370fef10105fa2faae0126114a169c64845d6126c9610140523480156200003757600080fd5b5060405162002980380380620029808339810160408190526200005a9162000a88565b83838180604051806040016040528060018152602001603160f81b815250848481600390805190602001906200009292919062000875565b508051620000a890600490602084019062000875565b5050825160209384012082519284019290922060e08390526101008190524660a0818152604080517f8b73c3c69bb8fe3d512ecc4cf759cc79239f7b179b0ffacaa9a75d522b39400f818901819052818301979097526060810194909452608080850193909352308483018190528151808603909301835260c09485019091528151919096012090529290925261012052506200014e90506336372b0760e01b620001f6565b5060009050805b8351811015620001ea57620001a984828151811062000178576200017862000bb1565b602002602001015184838151811062000195576200019562000bb1565b60200260200101516200027b60201b60201c565b828181518110620001be57620001be62000bb1565b602002602001015182620001d3919062000bdd565b915080620001e18162000bf8565b91505062000155565b50505050505062000c6a565b6001600160e01b03198082169003620002565760405162461bcd60e51b815260206004820152601c60248201527f4552433136353a20696e76616c696420696e746572666163652069640000000060448201526064015b60405180910390fd5b6001600160e01b0319166000908152600960205260409020805460ff19166001179055565b6200029282826200029660201b62000a891760201c565b5050565b620002ad82826200034960201b62000b191760201c565b6001600160e01b03620002c1620004388216565b11156200032a5760405162461bcd60e51b815260206004820152603060248201527f4552433230566f7465733a20746f74616c20737570706c79207269736b73206f60448201526f766572666c6f77696e6720766f74657360801b60648201526084016200024d565b62000343600862000c046200043e60201b178362000453565b50505050565b6001600160a01b038216620003a15760405162461bcd60e51b815260206004820152601f60248201527f45524332303a206d696e7420746f20746865207a65726f20616464726573730060448201526064016200024d565b8060026000828254620003b5919062000bdd565b90915550506001600160a01b03821660009081526020819052604081208054839290620003e490849062000bdd565b90915550506040518181526001600160a01b038316906000907fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef9060200160405180910390a362000292600083836200060a565b60025490565b60006200044c828462000bdd565b9392505050565b825460009081908015620004a557856200046f60018362000c14565b8154811062000482576200048262000bb1565b60009182526020909120015464010000000090046001600160e01b0316620004a8565b60005b6001600160e01b03169250620004bf83858760201c565b91506000811180156200050357504386620004dc60018462000c14565b81548110620004ef57620004ef62000bb1565b60009182526020909120015463ffffffff16145b1562000577576200051f826200062260201b62000c101760201c565b866200052d60018462000c14565b8154811062000540576200054062000bb1565b9060005260206000200160000160046101000a8154816001600160e01b0302191690836001600160e01b03160217905550620005fc565b85604051806040016040528062000599436200069160201b62000c7d1760201c565b63ffffffff168152602001620005ba856200062260201b62000c101760201c565b6001600160e01b0390811690915282546001810184556000938452602093849020835194909301519091166401000000000263ffffffff909316929092179101555b50935093915050565b505050565b62000605838383620006f860201b62000ce21760201c565b60006001600160e01b038211156200068d5760405162461bcd60e51b815260206004820152602760248201527f53616665436173743a2076616c756520646f65736e27742066697420696e20326044820152663234206269747360c81b60648201526084016200024d565b5090565b600063ffffffff8211156200068d5760405162461bcd60e51b815260206004820152602660248201527f53616665436173743a2076616c756520646f65736e27742066697420696e203360448201526532206269747360d01b60648201526084016200024d565b620007108383836200060560201b62000d141760201c565b6001600160a01b0383811660009081526006602052604080822054858416835291205462000605929182169116838183148015906200074f5750600081115b1562000605576001600160a01b03831615620007dc576001600160a01b03831660009081526007602090815260408220829162000799919062000867901b62000d19178562000453565b91509150846001600160a01b0316600080516020620029608339815191528383604051620007d1929190918252602082015260400190565b60405180910390a250505b6001600160a01b0382161562000605576001600160a01b0382166000908152600760209081526040822082916200082091906200043e901b62000c04178562000453565b91509150836001600160a01b031660008051602062002960833981519152838360405162000858929190918252602082015260400190565b60405180910390a25050505050565b60006200044c828462000c14565b828054620008839062000c2e565b90600052602060002090601f016020900481019282620008a75760008555620008f2565b82601f10620008c257805160ff1916838001178555620008f2565b82800160010185558215620008f2579182015b82811115620008f2578251825591602001919060010190620008d5565b506200068d9291505b808211156200068d5760008155600101620008fb565b634e487b7160e01b600052604160045260246000fd5b604051601f8201601f191681016001600160401b038111828210171562000952576200095262000911565b604052919050565b600082601f8301126200096c57600080fd5b81516001600160401b0381111562000988576200098862000911565b60206200099e601f8301601f1916820162000927565b8281528582848701011115620009b357600080fd5b60005b83811015620009d3578581018301518282018401528201620009b6565b83811115620009e55760008385840101525b5095945050505050565b60006001600160401b0382111562000a0b5762000a0b62000911565b5060051b60200190565b600082601f83011262000a2757600080fd5b8151602062000a4062000a3a83620009ef565b62000927565b82815260059290921b8401810191818101908684111562000a6057600080fd5b8286015b8481101562000a7d578051835291830191830162000a64565b509695505050505050565b6000806000806080858703121562000a9f57600080fd5b84516001600160401b038082111562000ab757600080fd5b62000ac5888389016200095a565b955060209150818701518181111562000add57600080fd5b62000aeb89828a016200095a565b95505060408701518181111562000b0157600080fd5b8701601f8101891362000b1357600080fd5b805162000b2462000a3a82620009ef565b81815260059190911b8201840190848101908b83111562000b4457600080fd5b928501925b8284101562000b7b5783516001600160a01b038116811462000b6b5760008081fd5b8252928501929085019062000b49565b60608b015190975094505050508082111562000b9657600080fd5b5062000ba58782880162000a15565b91505092959194509250565b634e487b7160e01b600052603260045260246000fd5b634e487b7160e01b600052601160045260246000fd5b6000821982111562000bf35762000bf362000bc7565b500190565b60006001820162000c0d5762000c0d62000bc7565b5060010190565b60008282101562000c295762000c2962000bc7565b500390565b600181811c9082168062000c4357607f821691505b60208210810362000c6457634e487b7160e01b600052602260045260246000fd5b50919050565b60805160a05160c05160e051610100516101205161014051611c9b62000cc560003960006108f501526000611133015260006111820152600061115d015260006110b6015260006110e00152600061110a0152611c9b6000f3fe608060405234801561001057600080fd5b506004361061014d5760003560e01c80636fcfff45116100c3578063a457c2d71161007c578063a457c2d7146102ef578063a9059cbb14610302578063c3cda52014610315578063d505accf14610328578063dd62ed3e1461033b578063f1127ed81461037457600080fd5b80636fcfff451461025d57806370a08231146102855780637ecebe00146102ae5780638e539e8c146102c157806395d89b41146102d45780639ab24eb0146102dc57600080fd5b8063313ce56711610115578063313ce567146101c75780633644e515146101d657806339509351146101de5780633a46b1a8146101f1578063587cde1e146102045780635c19a95c1461024857600080fd5b806301ffc9a71461015257806306fdde031461017a578063095ea7b31461018f57806318160ddd146101a257806323b872dd146101b4575b600080fd5b610165610160366004611923565b6103b1565b60405190151581526020015b60405180910390f35b6101826103f1565b604051610171919061194d565b61016561019d3660046119be565b610483565b6002545b604051908152602001610171565b6101656101c23660046119e8565b61049b565b60405160128152602001610171565b6101a66104bf565b6101656101ec3660046119be565b6104ce565b6101a66101ff3660046119be565b61050d565b610230610212366004611a24565b6001600160a01b039081166000908152600660205260409020541690565b6040516001600160a01b039091168152602001610171565b61025b610256366004611a24565b61058c565b005b61027061026b366004611a24565b610599565b60405163ffffffff9091168152602001610171565b6101a6610293366004611a24565b6001600160a01b031660009081526020819052604090205490565b6101a66102bc366004611a24565b6105bb565b6101a66102cf366004611a3f565b6105d9565b610182610635565b6101a66102ea366004611a24565b610644565b6101656102fd3660046119be565b6106cb565b6101656103103660046119be565b61075d565b61025b610323366004611a69565b61076b565b61025b610336366004611ac1565b6108a1565b6101a6610349366004611b2b565b6001600160a01b03918216600090815260016020908152604080832093909416825291909152205490565b610387610382366004611b5e565b610a05565b60408051825163ffffffff1681526020928301516001600160e01b03169281019290925201610171565b60006301ffc9a760e01b6001600160e01b0319831614806103eb57506001600160e01b0319821660009081526009602052604090205460ff165b92915050565b60606003805461040090611b9e565b80601f016020809104026020016040519081016040528092919081815260200182805461042c90611b9e565b80156104795780601f1061044e57610100808354040283529160200191610479565b820191906000526020600020905b81548152906001019060200180831161045c57829003601f168201915b5050505050905090565b600033610491818585610d25565b5060019392505050565b6000336104a9858285610e49565b6104b4858585610ed5565b506001949350505050565b60006104c96110a9565b905090565b3360008181526001602090815260408083206001600160a01b03871684529091528120549091906104919082908690610508908790611be8565b610d25565b60004382106105635760405162461bcd60e51b815260206004820152601f60248201527f4552433230566f7465733a20626c6f636b206e6f7420796574206d696e65640060448201526064015b60405180910390fd5b6001600160a01b038316600090815260076020526040902061058590836111d0565b9392505050565b610596338261128d565b50565b6001600160a01b0381166000908152600760205260408120546103eb90610c7d565b6001600160a01b0381166000908152600560205260408120546103eb565b600043821061062a5760405162461bcd60e51b815260206004820152601f60248201527f4552433230566f7465733a20626c6f636b206e6f7420796574206d696e656400604482015260640161055a565b6103eb6008836111d0565b60606004805461040090611b9e565b6001600160a01b03811660009081526007602052604081205480156106b8576001600160a01b0383166000908152600760205260409020610686600183611c00565b8154811061069657610696611c17565b60009182526020909120015464010000000090046001600160e01b03166106bb565b60005b6001600160e01b03169392505050565b3360008181526001602090815260408083206001600160a01b0387168452909152812054909190838110156107505760405162461bcd60e51b815260206004820152602560248201527f45524332303a2064656372656173656420616c6c6f77616e63652062656c6f77604482015264207a65726f60d81b606482015260840161055a565b6104b48286868403610d25565b600033610491818585610ed5565b834211156107bb5760405162461bcd60e51b815260206004820152601d60248201527f4552433230566f7465733a207369676e61747572652065787069726564000000604482015260640161055a565b604080517fe48329057bfd03d55e49b547132e39cffd9c1820ad7b9d4c5307691425d15adf60208201526001600160a01b0388169181019190915260608101869052608081018590526000906108359061082d9060a00160405160208183030381529060405280519060200120611306565b858585611354565b90506108408161137c565b861461088e5760405162461bcd60e51b815260206004820152601960248201527f4552433230566f7465733a20696e76616c6964206e6f6e636500000000000000604482015260640161055a565b610898818861128d565b50505050505050565b834211156108f15760405162461bcd60e51b815260206004820152601d60248201527f45524332305065726d69743a206578706972656420646561646c696e65000000604482015260640161055a565b60007f00000000000000000000000000000000000000000000000000000000000000008888886109208c61137c565b6040805160208101969096526001600160a01b0394851690860152929091166060840152608083015260a082015260c0810186905260e001604051602081830303815290604052805190602001209050600061097b82611306565b9050600061098b82878787611354565b9050896001600160a01b0316816001600160a01b0316146109ee5760405162461bcd60e51b815260206004820152601e60248201527f45524332305065726d69743a20696e76616c6964207369676e61747572650000604482015260640161055a565b6109f98a8a8a610d25565b50505050505050505050565b60408051808201909152600080825260208201526001600160a01b0383166000908152600760205260409020805463ffffffff8416908110610a4957610a49611c17565b60009182526020918290206040805180820190915291015463ffffffff8116825264010000000090046001600160e01b0316918101919091529392505050565b610a938282610b19565b6002546001600160e01b031015610b055760405162461bcd60e51b815260206004820152603060248201527f4552433230566f7465733a20746f74616c20737570706c79207269736b73206f60448201526f766572666c6f77696e6720766f74657360801b606482015260840161055a565b610b136008610c04836113a4565b50505050565b6001600160a01b038216610b6f5760405162461bcd60e51b815260206004820152601f60248201527f45524332303a206d696e7420746f20746865207a65726f206164647265737300604482015260640161055a565b8060026000828254610b819190611be8565b90915550506001600160a01b03821660009081526020819052604081208054839290610bae908490611be8565b90915550506040518181526001600160a01b038316906000907fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef9060200160405180910390a3610c006000838361151d565b5050565b60006105858284611be8565b60006001600160e01b03821115610c795760405162461bcd60e51b815260206004820152602760248201527f53616665436173743a2076616c756520646f65736e27742066697420696e20326044820152663234206269747360c81b606482015260840161055a565b5090565b600063ffffffff821115610c795760405162461bcd60e51b815260206004820152602660248201527f53616665436173743a2076616c756520646f65736e27742066697420696e203360448201526532206269747360d01b606482015260840161055a565b6001600160a01b03838116600090815260066020526040808220548584168352912054610d1492918216911683611528565b505050565b60006105858284611c00565b6001600160a01b038316610d875760405162461bcd60e51b8152602060048201526024808201527f45524332303a20617070726f76652066726f6d20746865207a65726f206164646044820152637265737360e01b606482015260840161055a565b6001600160a01b038216610de85760405162461bcd60e51b815260206004820152602260248201527f45524332303a20617070726f766520746f20746865207a65726f206164647265604482015261737360f01b606482015260840161055a565b6001600160a01b0383811660008181526001602090815260408083209487168084529482529182902085905590518481527f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925910160405180910390a3505050565b6001600160a01b038381166000908152600160209081526040808320938616835292905220546000198114610b135781811015610ec85760405162461bcd60e51b815260206004820152601d60248201527f45524332303a20696e73756666696369656e7420616c6c6f77616e6365000000604482015260640161055a565b610b138484848403610d25565b6001600160a01b038316610f395760405162461bcd60e51b815260206004820152602560248201527f45524332303a207472616e736665722066726f6d20746865207a65726f206164604482015264647265737360d81b606482015260840161055a565b6001600160a01b038216610f9b5760405162461bcd60e51b815260206004820152602360248201527f45524332303a207472616e7366657220746f20746865207a65726f206164647260448201526265737360e81b606482015260840161055a565b6001600160a01b038316600090815260208190526040902054818110156110135760405162461bcd60e51b815260206004820152602660248201527f45524332303a207472616e7366657220616d6f756e7420657863656564732062604482015265616c616e636560d01b606482015260840161055a565b6001600160a01b0380851660009081526020819052604080822085850390559185168152908120805484929061104a908490611be8565b92505081905550826001600160a01b0316846001600160a01b03167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef8460405161109691815260200190565b60405180910390a3610b1384848461151d565b6000306001600160a01b037f00000000000000000000000000000000000000000000000000000000000000001614801561110257507f000000000000000000000000000000000000000000000000000000000000000046145b1561112c57507f000000000000000000000000000000000000000000000000000000000000000090565b50604080517f00000000000000000000000000000000000000000000000000000000000000006020808301919091527f0000000000000000000000000000000000000000000000000000000000000000828401527f000000000000000000000000000000000000000000000000000000000000000060608301524660808301523060a0808401919091528351808403909101815260c0909201909252805191012090565b8154600090815b818110156112345760006111eb8284611665565b90508486828154811061120057611200611c17565b60009182526020909120015463ffffffff1611156112205780925061122e565b61122b816001611be8565b91505b506111d7565b81156112785784611246600184611c00565b8154811061125657611256611c17565b60009182526020909120015464010000000090046001600160e01b031661127b565b60005b6001600160e01b031695945050505050565b6001600160a01b038281166000818152600660208181526040808420805485845282862054949093528787166001600160a01b03198416811790915590519190951694919391928592917f3134e8a2e6d97e929a7e54011ea5485d7d196dd5f0ba4d4ef95803e8e3fc257f9190a4610b13828483611528565b60006103eb6113136110a9565b8360405161190160f01b6020820152602281018390526042810182905260009060620160405160208183030381529060405280519060200120905092915050565b600080600061136587878787611680565b915091506113728161176d565b5095945050505050565b6001600160a01b03811660009081526005602052604090208054600181018255905b50919050565b8254600090819080156113ef57856113bd600183611c00565b815481106113cd576113cd611c17565b60009182526020909120015464010000000090046001600160e01b03166113f2565b60005b6001600160e01b0316925061140b83858763ffffffff16565b915060008111801561144957504386611425600184611c00565b8154811061143557611435611c17565b60009182526020909120015463ffffffff16145b156114a95761145782610c10565b86611463600184611c00565b8154811061147357611473611c17565b9060005260206000200160000160046101000a8154816001600160e01b0302191690836001600160e01b03160217905550611514565b8560405180604001604052806114be43610c7d565b63ffffffff1681526020016114d285610c10565b6001600160e01b0390811690915282546001810184556000938452602093849020835194909301519091166401000000000263ffffffff909316929092179101555b50935093915050565b610d14838383610ce2565b816001600160a01b0316836001600160a01b03161415801561154a5750600081115b15610d14576001600160a01b038316156115d8576001600160a01b0383166000908152600760205260408120819061158590610d19856113a4565b91509150846001600160a01b03167fdec2bacdd2f05b59de34da9b523dff8be42e5e38e818c82fdb0bae774387a72483836040516115cd929190918252602082015260400190565b60405180910390a250505b6001600160a01b03821615610d14576001600160a01b0382166000908152600760205260408120819061160e90610c04856113a4565b91509150836001600160a01b03167fdec2bacdd2f05b59de34da9b523dff8be42e5e38e818c82fdb0bae774387a7248383604051611656929190918252602082015260400190565b60405180910390a25050505050565b60006116746002848418611c2d565b61058590848416611be8565b6000807f7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a08311156116b75750600090506003611764565b8460ff16601b141580156116cf57508460ff16601c14155b156116e05750600090506004611764565b6040805160008082526020820180845289905260ff881692820192909252606081018690526080810185905260019060a0016020604051602081039080840390855afa158015611734573d6000803e3d6000fd5b5050604051601f1901519150506001600160a01b03811661175d57600060019250925050611764565b9150600090505b94509492505050565b600081600481111561178157611781611c4f565b036117895750565b600181600481111561179d5761179d611c4f565b036117ea5760405162461bcd60e51b815260206004820152601860248201527f45434453413a20696e76616c6964207369676e61747572650000000000000000604482015260640161055a565b60028160048111156117fe576117fe611c4f565b0361184b5760405162461bcd60e51b815260206004820152601f60248201527f45434453413a20696e76616c6964207369676e6174757265206c656e67746800604482015260640161055a565b600381600481111561185f5761185f611c4f565b036118b75760405162461bcd60e51b815260206004820152602260248201527f45434453413a20696e76616c6964207369676e6174757265202773272076616c604482015261756560f01b606482015260840161055a565b60048160048111156118cb576118cb611c4f565b036105965760405162461bcd60e51b815260206004820152602260248201527f45434453413a20696e76616c6964207369676e6174757265202776272076616c604482015261756560f01b606482015260840161055a565b60006020828403121561193557600080fd5b81356001600160e01b03198116811461058557600080fd5b600060208083528351808285015260005b8181101561197a5785810183015185820160400152820161195e565b8181111561198c576000604083870101525b50601f01601f1916929092016040019392505050565b80356001600160a01b03811681146119b957600080fd5b919050565b600080604083850312156119d157600080fd5b6119da836119a2565b946020939093013593505050565b6000806000606084860312156119fd57600080fd5b611a06846119a2565b9250611a14602085016119a2565b9150604084013590509250925092565b600060208284031215611a3657600080fd5b610585826119a2565b600060208284031215611a5157600080fd5b5035919050565b803560ff811681146119b957600080fd5b60008060008060008060c08789031215611a8257600080fd5b611a8b876119a2565b95506020870135945060408701359350611aa760608801611a58565b92506080870135915060a087013590509295509295509295565b600080600080600080600060e0888a031215611adc57600080fd5b611ae5886119a2565b9650611af3602089016119a2565b95506040880135945060608801359350611b0f60808901611a58565b925060a0880135915060c0880135905092959891949750929550565b60008060408385031215611b3e57600080fd5b611b47836119a2565b9150611b55602084016119a2565b90509250929050565b60008060408385031215611b7157600080fd5b611b7a836119a2565b9150602083013563ffffffff81168114611b9357600080fd5b809150509250929050565b600181811c90821680611bb257607f821691505b60208210810361139e57634e487b7160e01b600052602260045260246000fd5b634e487b7160e01b600052601160045260246000fd5b60008219821115611bfb57611bfb611bd2565b500190565b600082821015611c1257611c12611bd2565b500390565b634e487b7160e01b600052603260045260246000fd5b600082611c4a57634e487b7160e01b600052601260045260246000fd5b500490565b634e487b7160e01b600052602160045260246000fdfea264697066735822122039f60f790e0b196d9c04a38f91cc3ab90b1c5b435ad967fb6f8dc39f14a8ec8c64736f6c634300080d0033dec2bacdd2f05b59de34da9b523dff8be42e5e38e818c82fdb0bae774387a724";

type VotesTokenWithSupplyConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: VotesTokenWithSupplyConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class VotesTokenWithSupply__factory extends ContractFactory {
  constructor(...args: VotesTokenWithSupplyConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
  }

  override deploy(
    name: string,
    symbol: string,
    hodlers: string[],
    allocations: BigNumberish[],
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<VotesTokenWithSupply> {
    return super.deploy(
      name,
      symbol,
      hodlers,
      allocations,
      overrides || {}
    ) as Promise<VotesTokenWithSupply>;
  }
  override getDeployTransaction(
    name: string,
    symbol: string,
    hodlers: string[],
    allocations: BigNumberish[],
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(
      name,
      symbol,
      hodlers,
      allocations,
      overrides || {}
    );
  }
  override attach(address: string): VotesTokenWithSupply {
    return super.attach(address) as VotesTokenWithSupply;
  }
  override connect(signer: Signer): VotesTokenWithSupply__factory {
    return super.connect(signer) as VotesTokenWithSupply__factory;
  }

  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): VotesTokenWithSupplyInterface {
    return new utils.Interface(_abi) as VotesTokenWithSupplyInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): VotesTokenWithSupply {
    return new Contract(
      address,
      _abi,
      signerOrProvider
    ) as VotesTokenWithSupply;
  }
}
