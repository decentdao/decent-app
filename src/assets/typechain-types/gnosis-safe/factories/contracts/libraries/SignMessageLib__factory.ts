/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import type { Provider, TransactionRequest } from "@ethersproject/providers";
import type { PromiseOrValue } from "../../../common";
import type {
  SignMessageLib,
  SignMessageLibInterface,
} from "../../../contracts/libraries/SignMessageLib";

const _abi = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "msgHash",
        type: "bytes32",
      },
    ],
    name: "SignMsg",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "bytes",
        name: "message",
        type: "bytes",
      },
    ],
    name: "getMessageHash",
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
        internalType: "bytes",
        name: "_data",
        type: "bytes",
      },
    ],
    name: "signMessage",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

const _bytecode =
  "0x608060405234801561001057600080fd5b506103c6806100206000396000f3fe608060405234801561001057600080fd5b50600436106100365760003560e01c80630a1028c41461003b57806385a5affe1461010a575b600080fd5b6100f46004803603602081101561005157600080fd5b810190808035906020019064010000000081111561006e57600080fd5b82018360208201111561008057600080fd5b803590602001918460018302840111640100000000831117156100a257600080fd5b91908080601f016020809104026020016040519081016040528093929190818152602001838380828437600081840152601f19601f820116905080830192505050505050509192919290505050610183565b6040518082815260200191505060405180910390f35b6101816004803603602081101561012057600080fd5b810190808035906020019064010000000081111561013d57600080fd5b82018360208201111561014f57600080fd5b8035906020019184600183028401116401000000008311171561017157600080fd5b90919293919293905050506102f4565b005b6000807f60b3cbf8b4a223d68d641b3b6ddf9a298e7f33710cf3d3a9d1146b5a6150fbca60001b83805190602001206040516020018083815260200182815260200192505050604051602081830303815290604052805190602001209050601960f81b600160f81b3073ffffffffffffffffffffffffffffffffffffffff1663f698da256040518163ffffffff1660e01b815260040160206040518083038186803b15801561023157600080fd5b505afa158015610245573d6000803e3d6000fd5b505050506040513d602081101561025b57600080fd5b81019080805190602001909291905050508360405160200180857effffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff19168152600101847effffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916815260010183815260200182815260200194505050505060405160208183030381529060405280519060200120915050919050565b600061034383838080601f016020809104026020016040519081016040528093929190818152602001838380828437600081840152601f19601f82011690508083019250505050505050610183565b905060016007600083815260200190815260200160002081905550807fe7f4675038f4f6034dfcbbb24c4dc08e4ebf10eb9d257d3d02c0f38d122ac6e460405160405180910390a250505056fea26469706673582212206411ee228db22523f4873896f0414b79098034a96558fea74594f5885bdf8b8364736f6c63430007060033";

type SignMessageLibConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: SignMessageLibConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class SignMessageLib__factory extends ContractFactory {
  constructor(...args: SignMessageLibConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
  }

  override deploy(
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<SignMessageLib> {
    return super.deploy(overrides || {}) as Promise<SignMessageLib>;
  }
  override getDeployTransaction(
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  override attach(address: string): SignMessageLib {
    return super.attach(address) as SignMessageLib;
  }
  override connect(signer: Signer): SignMessageLib__factory {
    return super.connect(signer) as SignMessageLib__factory;
  }

  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): SignMessageLibInterface {
    return new utils.Interface(_abi) as SignMessageLibInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): SignMessageLib {
    return new Contract(address, _abi, signerOrProvider) as SignMessageLib;
  }
}
