/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import type {
  BaseContract,
  BigNumber,
  BigNumberish,
  BytesLike,
  CallOverrides,
  ContractTransaction,
  Overrides,
  PopulatedTransaction,
  Signer,
  utils,
} from "ethers";
import type { FunctionFragment, Result } from "@ethersproject/abi";
import type { Listener, Provider } from "@ethersproject/providers";
import type {
  TypedEventFilter,
  TypedEvent,
  TypedListener,
  OnEvent,
  PromiseOrValue,
} from "../../../../common";

export interface MockContractInterface extends utils.Interface {
  functions: {
    "DEFAULT_FALLBACK_VALUE()": FunctionFragment;
    "MOCKS_LIST_END()": FunctionFragment;
    "MOCKS_LIST_END_HASH()": FunctionFragment;
    "MOCKS_LIST_START()": FunctionFragment;
    "SENTINEL_ANY_MOCKS()": FunctionFragment;
    "givenAnyReturn(bytes)": FunctionFragment;
    "givenAnyReturnAddress(address)": FunctionFragment;
    "givenAnyReturnBool(bool)": FunctionFragment;
    "givenAnyReturnUint(uint256)": FunctionFragment;
    "givenAnyRevert()": FunctionFragment;
    "givenAnyRevertWithMessage(string)": FunctionFragment;
    "givenAnyRunOutOfGas()": FunctionFragment;
    "givenCalldataReturn(bytes,bytes)": FunctionFragment;
    "givenCalldataReturnAddress(bytes,address)": FunctionFragment;
    "givenCalldataReturnBool(bytes,bool)": FunctionFragment;
    "givenCalldataReturnUint(bytes,uint256)": FunctionFragment;
    "givenCalldataRevert(bytes)": FunctionFragment;
    "givenCalldataRevertWithMessage(bytes,string)": FunctionFragment;
    "givenCalldataRunOutOfGas(bytes)": FunctionFragment;
    "givenMethodReturn(bytes,bytes)": FunctionFragment;
    "givenMethodReturnAddress(bytes,address)": FunctionFragment;
    "givenMethodReturnBool(bytes,bool)": FunctionFragment;
    "givenMethodReturnUint(bytes,uint256)": FunctionFragment;
    "givenMethodRevert(bytes)": FunctionFragment;
    "givenMethodRevertWithMessage(bytes,string)": FunctionFragment;
    "givenMethodRunOutOfGas(bytes)": FunctionFragment;
    "invocationCount()": FunctionFragment;
    "invocationCountForCalldata(bytes)": FunctionFragment;
    "invocationCountForMethod(bytes)": FunctionFragment;
    "reset()": FunctionFragment;
    "updateInvocationCount(bytes4,bytes)": FunctionFragment;
  };

  getFunction(
    nameOrSignatureOrTopic:
      | "DEFAULT_FALLBACK_VALUE"
      | "MOCKS_LIST_END"
      | "MOCKS_LIST_END_HASH"
      | "MOCKS_LIST_START"
      | "SENTINEL_ANY_MOCKS"
      | "givenAnyReturn"
      | "givenAnyReturnAddress"
      | "givenAnyReturnBool"
      | "givenAnyReturnUint"
      | "givenAnyRevert"
      | "givenAnyRevertWithMessage"
      | "givenAnyRunOutOfGas"
      | "givenCalldataReturn"
      | "givenCalldataReturnAddress"
      | "givenCalldataReturnBool"
      | "givenCalldataReturnUint"
      | "givenCalldataRevert"
      | "givenCalldataRevertWithMessage"
      | "givenCalldataRunOutOfGas"
      | "givenMethodReturn"
      | "givenMethodReturnAddress"
      | "givenMethodReturnBool"
      | "givenMethodReturnUint"
      | "givenMethodRevert"
      | "givenMethodRevertWithMessage"
      | "givenMethodRunOutOfGas"
      | "invocationCount"
      | "invocationCountForCalldata"
      | "invocationCountForMethod"
      | "reset"
      | "updateInvocationCount"
  ): FunctionFragment;

  encodeFunctionData(
    functionFragment: "DEFAULT_FALLBACK_VALUE",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "MOCKS_LIST_END",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "MOCKS_LIST_END_HASH",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "MOCKS_LIST_START",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "SENTINEL_ANY_MOCKS",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "givenAnyReturn",
    values: [PromiseOrValue<BytesLike>]
  ): string;
  encodeFunctionData(
    functionFragment: "givenAnyReturnAddress",
    values: [PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "givenAnyReturnBool",
    values: [PromiseOrValue<boolean>]
  ): string;
  encodeFunctionData(
    functionFragment: "givenAnyReturnUint",
    values: [PromiseOrValue<BigNumberish>]
  ): string;
  encodeFunctionData(
    functionFragment: "givenAnyRevert",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "givenAnyRevertWithMessage",
    values: [PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "givenAnyRunOutOfGas",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "givenCalldataReturn",
    values: [PromiseOrValue<BytesLike>, PromiseOrValue<BytesLike>]
  ): string;
  encodeFunctionData(
    functionFragment: "givenCalldataReturnAddress",
    values: [PromiseOrValue<BytesLike>, PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "givenCalldataReturnBool",
    values: [PromiseOrValue<BytesLike>, PromiseOrValue<boolean>]
  ): string;
  encodeFunctionData(
    functionFragment: "givenCalldataReturnUint",
    values: [PromiseOrValue<BytesLike>, PromiseOrValue<BigNumberish>]
  ): string;
  encodeFunctionData(
    functionFragment: "givenCalldataRevert",
    values: [PromiseOrValue<BytesLike>]
  ): string;
  encodeFunctionData(
    functionFragment: "givenCalldataRevertWithMessage",
    values: [PromiseOrValue<BytesLike>, PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "givenCalldataRunOutOfGas",
    values: [PromiseOrValue<BytesLike>]
  ): string;
  encodeFunctionData(
    functionFragment: "givenMethodReturn",
    values: [PromiseOrValue<BytesLike>, PromiseOrValue<BytesLike>]
  ): string;
  encodeFunctionData(
    functionFragment: "givenMethodReturnAddress",
    values: [PromiseOrValue<BytesLike>, PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "givenMethodReturnBool",
    values: [PromiseOrValue<BytesLike>, PromiseOrValue<boolean>]
  ): string;
  encodeFunctionData(
    functionFragment: "givenMethodReturnUint",
    values: [PromiseOrValue<BytesLike>, PromiseOrValue<BigNumberish>]
  ): string;
  encodeFunctionData(
    functionFragment: "givenMethodRevert",
    values: [PromiseOrValue<BytesLike>]
  ): string;
  encodeFunctionData(
    functionFragment: "givenMethodRevertWithMessage",
    values: [PromiseOrValue<BytesLike>, PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "givenMethodRunOutOfGas",
    values: [PromiseOrValue<BytesLike>]
  ): string;
  encodeFunctionData(
    functionFragment: "invocationCount",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "invocationCountForCalldata",
    values: [PromiseOrValue<BytesLike>]
  ): string;
  encodeFunctionData(
    functionFragment: "invocationCountForMethod",
    values: [PromiseOrValue<BytesLike>]
  ): string;
  encodeFunctionData(functionFragment: "reset", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "updateInvocationCount",
    values: [PromiseOrValue<BytesLike>, PromiseOrValue<BytesLike>]
  ): string;

  decodeFunctionResult(
    functionFragment: "DEFAULT_FALLBACK_VALUE",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "MOCKS_LIST_END",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "MOCKS_LIST_END_HASH",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "MOCKS_LIST_START",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "SENTINEL_ANY_MOCKS",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "givenAnyReturn",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "givenAnyReturnAddress",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "givenAnyReturnBool",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "givenAnyReturnUint",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "givenAnyRevert",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "givenAnyRevertWithMessage",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "givenAnyRunOutOfGas",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "givenCalldataReturn",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "givenCalldataReturnAddress",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "givenCalldataReturnBool",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "givenCalldataReturnUint",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "givenCalldataRevert",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "givenCalldataRevertWithMessage",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "givenCalldataRunOutOfGas",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "givenMethodReturn",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "givenMethodReturnAddress",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "givenMethodReturnBool",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "givenMethodReturnUint",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "givenMethodRevert",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "givenMethodRevertWithMessage",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "givenMethodRunOutOfGas",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "invocationCount",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "invocationCountForCalldata",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "invocationCountForMethod",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "reset", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "updateInvocationCount",
    data: BytesLike
  ): Result;

  events: {};
}

export interface MockContract extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: MockContractInterface;

  queryFilter<TEvent extends TypedEvent>(
    event: TypedEventFilter<TEvent>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TEvent>>;

  listeners<TEvent extends TypedEvent>(
    eventFilter?: TypedEventFilter<TEvent>
  ): Array<TypedListener<TEvent>>;
  listeners(eventName?: string): Array<Listener>;
  removeAllListeners<TEvent extends TypedEvent>(
    eventFilter: TypedEventFilter<TEvent>
  ): this;
  removeAllListeners(eventName?: string): this;
  off: OnEvent<this>;
  on: OnEvent<this>;
  once: OnEvent<this>;
  removeListener: OnEvent<this>;

  functions: {
    DEFAULT_FALLBACK_VALUE(overrides?: CallOverrides): Promise<[string]>;

    MOCKS_LIST_END(overrides?: CallOverrides): Promise<[string]>;

    MOCKS_LIST_END_HASH(overrides?: CallOverrides): Promise<[string]>;

    MOCKS_LIST_START(overrides?: CallOverrides): Promise<[string]>;

    SENTINEL_ANY_MOCKS(overrides?: CallOverrides): Promise<[string]>;

    givenAnyReturn(
      response: PromiseOrValue<BytesLike>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    givenAnyReturnAddress(
      response: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    givenAnyReturnBool(
      response: PromiseOrValue<boolean>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    givenAnyReturnUint(
      response: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    givenAnyRevert(
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    givenAnyRevertWithMessage(
      message: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    givenAnyRunOutOfGas(
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    givenCalldataReturn(
      call: PromiseOrValue<BytesLike>,
      response: PromiseOrValue<BytesLike>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    givenCalldataReturnAddress(
      call: PromiseOrValue<BytesLike>,
      response: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    givenCalldataReturnBool(
      call: PromiseOrValue<BytesLike>,
      response: PromiseOrValue<boolean>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    givenCalldataReturnUint(
      call: PromiseOrValue<BytesLike>,
      response: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    givenCalldataRevert(
      call: PromiseOrValue<BytesLike>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    givenCalldataRevertWithMessage(
      call: PromiseOrValue<BytesLike>,
      message: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    givenCalldataRunOutOfGas(
      call: PromiseOrValue<BytesLike>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    givenMethodReturn(
      call: PromiseOrValue<BytesLike>,
      response: PromiseOrValue<BytesLike>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    givenMethodReturnAddress(
      call: PromiseOrValue<BytesLike>,
      response: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    givenMethodReturnBool(
      call: PromiseOrValue<BytesLike>,
      response: PromiseOrValue<boolean>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    givenMethodReturnUint(
      call: PromiseOrValue<BytesLike>,
      response: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    givenMethodRevert(
      call: PromiseOrValue<BytesLike>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    givenMethodRevertWithMessage(
      call: PromiseOrValue<BytesLike>,
      message: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    givenMethodRunOutOfGas(
      call: PromiseOrValue<BytesLike>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    invocationCount(
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    invocationCountForCalldata(
      call: PromiseOrValue<BytesLike>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    invocationCountForMethod(
      call: PromiseOrValue<BytesLike>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    reset(
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    updateInvocationCount(
      methodId: PromiseOrValue<BytesLike>,
      originalMsgData: PromiseOrValue<BytesLike>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;
  };

  DEFAULT_FALLBACK_VALUE(overrides?: CallOverrides): Promise<string>;

  MOCKS_LIST_END(overrides?: CallOverrides): Promise<string>;

  MOCKS_LIST_END_HASH(overrides?: CallOverrides): Promise<string>;

  MOCKS_LIST_START(overrides?: CallOverrides): Promise<string>;

  SENTINEL_ANY_MOCKS(overrides?: CallOverrides): Promise<string>;

  givenAnyReturn(
    response: PromiseOrValue<BytesLike>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  givenAnyReturnAddress(
    response: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  givenAnyReturnBool(
    response: PromiseOrValue<boolean>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  givenAnyReturnUint(
    response: PromiseOrValue<BigNumberish>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  givenAnyRevert(
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  givenAnyRevertWithMessage(
    message: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  givenAnyRunOutOfGas(
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  givenCalldataReturn(
    call: PromiseOrValue<BytesLike>,
    response: PromiseOrValue<BytesLike>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  givenCalldataReturnAddress(
    call: PromiseOrValue<BytesLike>,
    response: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  givenCalldataReturnBool(
    call: PromiseOrValue<BytesLike>,
    response: PromiseOrValue<boolean>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  givenCalldataReturnUint(
    call: PromiseOrValue<BytesLike>,
    response: PromiseOrValue<BigNumberish>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  givenCalldataRevert(
    call: PromiseOrValue<BytesLike>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  givenCalldataRevertWithMessage(
    call: PromiseOrValue<BytesLike>,
    message: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  givenCalldataRunOutOfGas(
    call: PromiseOrValue<BytesLike>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  givenMethodReturn(
    call: PromiseOrValue<BytesLike>,
    response: PromiseOrValue<BytesLike>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  givenMethodReturnAddress(
    call: PromiseOrValue<BytesLike>,
    response: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  givenMethodReturnBool(
    call: PromiseOrValue<BytesLike>,
    response: PromiseOrValue<boolean>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  givenMethodReturnUint(
    call: PromiseOrValue<BytesLike>,
    response: PromiseOrValue<BigNumberish>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  givenMethodRevert(
    call: PromiseOrValue<BytesLike>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  givenMethodRevertWithMessage(
    call: PromiseOrValue<BytesLike>,
    message: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  givenMethodRunOutOfGas(
    call: PromiseOrValue<BytesLike>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  invocationCount(
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  invocationCountForCalldata(
    call: PromiseOrValue<BytesLike>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  invocationCountForMethod(
    call: PromiseOrValue<BytesLike>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  reset(
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  updateInvocationCount(
    methodId: PromiseOrValue<BytesLike>,
    originalMsgData: PromiseOrValue<BytesLike>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  callStatic: {
    DEFAULT_FALLBACK_VALUE(overrides?: CallOverrides): Promise<string>;

    MOCKS_LIST_END(overrides?: CallOverrides): Promise<string>;

    MOCKS_LIST_END_HASH(overrides?: CallOverrides): Promise<string>;

    MOCKS_LIST_START(overrides?: CallOverrides): Promise<string>;

    SENTINEL_ANY_MOCKS(overrides?: CallOverrides): Promise<string>;

    givenAnyReturn(
      response: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<void>;

    givenAnyReturnAddress(
      response: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<void>;

    givenAnyReturnBool(
      response: PromiseOrValue<boolean>,
      overrides?: CallOverrides
    ): Promise<void>;

    givenAnyReturnUint(
      response: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<void>;

    givenAnyRevert(overrides?: CallOverrides): Promise<void>;

    givenAnyRevertWithMessage(
      message: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<void>;

    givenAnyRunOutOfGas(overrides?: CallOverrides): Promise<void>;

    givenCalldataReturn(
      call: PromiseOrValue<BytesLike>,
      response: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<void>;

    givenCalldataReturnAddress(
      call: PromiseOrValue<BytesLike>,
      response: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<void>;

    givenCalldataReturnBool(
      call: PromiseOrValue<BytesLike>,
      response: PromiseOrValue<boolean>,
      overrides?: CallOverrides
    ): Promise<void>;

    givenCalldataReturnUint(
      call: PromiseOrValue<BytesLike>,
      response: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<void>;

    givenCalldataRevert(
      call: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<void>;

    givenCalldataRevertWithMessage(
      call: PromiseOrValue<BytesLike>,
      message: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<void>;

    givenCalldataRunOutOfGas(
      call: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<void>;

    givenMethodReturn(
      call: PromiseOrValue<BytesLike>,
      response: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<void>;

    givenMethodReturnAddress(
      call: PromiseOrValue<BytesLike>,
      response: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<void>;

    givenMethodReturnBool(
      call: PromiseOrValue<BytesLike>,
      response: PromiseOrValue<boolean>,
      overrides?: CallOverrides
    ): Promise<void>;

    givenMethodReturnUint(
      call: PromiseOrValue<BytesLike>,
      response: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<void>;

    givenMethodRevert(
      call: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<void>;

    givenMethodRevertWithMessage(
      call: PromiseOrValue<BytesLike>,
      message: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<void>;

    givenMethodRunOutOfGas(
      call: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<void>;

    invocationCount(overrides?: CallOverrides): Promise<BigNumber>;

    invocationCountForCalldata(
      call: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    invocationCountForMethod(
      call: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    reset(overrides?: CallOverrides): Promise<void>;

    updateInvocationCount(
      methodId: PromiseOrValue<BytesLike>,
      originalMsgData: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<void>;
  };

  filters: {};

  estimateGas: {
    DEFAULT_FALLBACK_VALUE(overrides?: CallOverrides): Promise<BigNumber>;

    MOCKS_LIST_END(overrides?: CallOverrides): Promise<BigNumber>;

    MOCKS_LIST_END_HASH(overrides?: CallOverrides): Promise<BigNumber>;

    MOCKS_LIST_START(overrides?: CallOverrides): Promise<BigNumber>;

    SENTINEL_ANY_MOCKS(overrides?: CallOverrides): Promise<BigNumber>;

    givenAnyReturn(
      response: PromiseOrValue<BytesLike>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    givenAnyReturnAddress(
      response: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    givenAnyReturnBool(
      response: PromiseOrValue<boolean>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    givenAnyReturnUint(
      response: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    givenAnyRevert(
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    givenAnyRevertWithMessage(
      message: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    givenAnyRunOutOfGas(
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    givenCalldataReturn(
      call: PromiseOrValue<BytesLike>,
      response: PromiseOrValue<BytesLike>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    givenCalldataReturnAddress(
      call: PromiseOrValue<BytesLike>,
      response: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    givenCalldataReturnBool(
      call: PromiseOrValue<BytesLike>,
      response: PromiseOrValue<boolean>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    givenCalldataReturnUint(
      call: PromiseOrValue<BytesLike>,
      response: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    givenCalldataRevert(
      call: PromiseOrValue<BytesLike>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    givenCalldataRevertWithMessage(
      call: PromiseOrValue<BytesLike>,
      message: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    givenCalldataRunOutOfGas(
      call: PromiseOrValue<BytesLike>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    givenMethodReturn(
      call: PromiseOrValue<BytesLike>,
      response: PromiseOrValue<BytesLike>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    givenMethodReturnAddress(
      call: PromiseOrValue<BytesLike>,
      response: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    givenMethodReturnBool(
      call: PromiseOrValue<BytesLike>,
      response: PromiseOrValue<boolean>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    givenMethodReturnUint(
      call: PromiseOrValue<BytesLike>,
      response: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    givenMethodRevert(
      call: PromiseOrValue<BytesLike>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    givenMethodRevertWithMessage(
      call: PromiseOrValue<BytesLike>,
      message: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    givenMethodRunOutOfGas(
      call: PromiseOrValue<BytesLike>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    invocationCount(
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    invocationCountForCalldata(
      call: PromiseOrValue<BytesLike>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    invocationCountForMethod(
      call: PromiseOrValue<BytesLike>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    reset(
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    updateInvocationCount(
      methodId: PromiseOrValue<BytesLike>,
      originalMsgData: PromiseOrValue<BytesLike>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    DEFAULT_FALLBACK_VALUE(
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    MOCKS_LIST_END(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    MOCKS_LIST_END_HASH(
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    MOCKS_LIST_START(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    SENTINEL_ANY_MOCKS(
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    givenAnyReturn(
      response: PromiseOrValue<BytesLike>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    givenAnyReturnAddress(
      response: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    givenAnyReturnBool(
      response: PromiseOrValue<boolean>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    givenAnyReturnUint(
      response: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    givenAnyRevert(
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    givenAnyRevertWithMessage(
      message: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    givenAnyRunOutOfGas(
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    givenCalldataReturn(
      call: PromiseOrValue<BytesLike>,
      response: PromiseOrValue<BytesLike>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    givenCalldataReturnAddress(
      call: PromiseOrValue<BytesLike>,
      response: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    givenCalldataReturnBool(
      call: PromiseOrValue<BytesLike>,
      response: PromiseOrValue<boolean>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    givenCalldataReturnUint(
      call: PromiseOrValue<BytesLike>,
      response: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    givenCalldataRevert(
      call: PromiseOrValue<BytesLike>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    givenCalldataRevertWithMessage(
      call: PromiseOrValue<BytesLike>,
      message: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    givenCalldataRunOutOfGas(
      call: PromiseOrValue<BytesLike>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    givenMethodReturn(
      call: PromiseOrValue<BytesLike>,
      response: PromiseOrValue<BytesLike>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    givenMethodReturnAddress(
      call: PromiseOrValue<BytesLike>,
      response: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    givenMethodReturnBool(
      call: PromiseOrValue<BytesLike>,
      response: PromiseOrValue<boolean>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    givenMethodReturnUint(
      call: PromiseOrValue<BytesLike>,
      response: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    givenMethodRevert(
      call: PromiseOrValue<BytesLike>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    givenMethodRevertWithMessage(
      call: PromiseOrValue<BytesLike>,
      message: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    givenMethodRunOutOfGas(
      call: PromiseOrValue<BytesLike>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    invocationCount(
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    invocationCountForCalldata(
      call: PromiseOrValue<BytesLike>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    invocationCountForMethod(
      call: PromiseOrValue<BytesLike>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    reset(
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    updateInvocationCount(
      methodId: PromiseOrValue<BytesLike>,
      originalMsgData: PromiseOrValue<BytesLike>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;
  };
}
