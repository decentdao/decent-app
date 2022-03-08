/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import {
  ethers,
  EventFilter,
  Signer,
  BigNumber,
  BigNumberish,
  PopulatedTransaction,
  BaseContract,
  ContractTransaction,
  Overrides,
  CallOverrides,
} from "ethers";
import { BytesLike } from "@ethersproject/bytes";
import { Listener, Provider } from "@ethersproject/providers";
import { FunctionFragment, EventFragment, Result } from "@ethersproject/abi";
import type { TypedEventFilter, TypedEvent, TypedListener } from "./common";

interface IAccessControlInterface extends ethers.utils.Interface {
  functions: {
    "DAO_ROLE()": FunctionFragment;
    "actionIsAuthorized(address,address,bytes4)": FunctionFragment;
    "addActionsRoles(address[],string[],string[][])": FunctionFragment;
    "getActionRoles(address,string)": FunctionFragment;
    "getRoleAdmin(string)": FunctionFragment;
    "grantRole(string,address)": FunctionFragment;
    "grantRolesAndAdmins(string[],string[],address[][])": FunctionFragment;
    "hasRole(string,address)": FunctionFragment;
    "initialize(address,string[],string[],address[][],address[],string[],string[][])": FunctionFragment;
    "isRoleAuthorized(string,address,string)": FunctionFragment;
    "removeActionsRoles(address[],string[],string[][])": FunctionFragment;
    "renounceRole(string,address)": FunctionFragment;
    "revokeRole(string,address)": FunctionFragment;
  };

  encodeFunctionData(functionFragment: "DAO_ROLE", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "actionIsAuthorized",
    values: [string, string, BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: "addActionsRoles",
    values: [string[], string[], string[][]]
  ): string;
  encodeFunctionData(
    functionFragment: "getActionRoles",
    values: [string, string]
  ): string;
  encodeFunctionData(
    functionFragment: "getRoleAdmin",
    values: [string]
  ): string;
  encodeFunctionData(
    functionFragment: "grantRole",
    values: [string, string]
  ): string;
  encodeFunctionData(
    functionFragment: "grantRolesAndAdmins",
    values: [string[], string[], string[][]]
  ): string;
  encodeFunctionData(
    functionFragment: "hasRole",
    values: [string, string]
  ): string;
  encodeFunctionData(
    functionFragment: "initialize",
    values: [
      string,
      string[],
      string[],
      string[][],
      string[],
      string[],
      string[][]
    ]
  ): string;
  encodeFunctionData(
    functionFragment: "isRoleAuthorized",
    values: [string, string, string]
  ): string;
  encodeFunctionData(
    functionFragment: "removeActionsRoles",
    values: [string[], string[], string[][]]
  ): string;
  encodeFunctionData(
    functionFragment: "renounceRole",
    values: [string, string]
  ): string;
  encodeFunctionData(
    functionFragment: "revokeRole",
    values: [string, string]
  ): string;

  decodeFunctionResult(functionFragment: "DAO_ROLE", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "actionIsAuthorized",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "addActionsRoles",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getActionRoles",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getRoleAdmin",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "grantRole", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "grantRolesAndAdmins",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "hasRole", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "initialize", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "isRoleAuthorized",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "removeActionsRoles",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "renounceRole",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "revokeRole", data: BytesLike): Result;

  events: {
    "ActionRoleAdded(address,string,bytes4,string)": EventFragment;
    "ActionRoleRemoved(address,string,bytes4,string)": EventFragment;
    "RoleAdminChanged(string,string,string)": EventFragment;
    "RoleGranted(string,address,address)": EventFragment;
    "RoleRevoked(string,address,address)": EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: "ActionRoleAdded"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "ActionRoleRemoved"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "RoleAdminChanged"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "RoleGranted"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "RoleRevoked"): EventFragment;
}

export type ActionRoleAddedEvent = TypedEvent<
  [string, string, string, string] & {
    target: string;
    functionDesc: string;
    encodedSig: string;
    role: string;
  }
>;

export type ActionRoleRemovedEvent = TypedEvent<
  [string, string, string, string] & {
    target: string;
    functionDesc: string;
    encodedSig: string;
    role: string;
  }
>;

export type RoleAdminChangedEvent = TypedEvent<
  [string, string, string] & {
    role: string;
    previousAdminRole: string;
    adminRole: string;
  }
>;

export type RoleGrantedEvent = TypedEvent<
  [string, string, string] & { role: string; account: string; admin: string }
>;

export type RoleRevokedEvent = TypedEvent<
  [string, string, string] & { role: string; account: string; admin: string }
>;

export class IAccessControl extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  listeners<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter?: TypedEventFilter<EventArgsArray, EventArgsObject>
  ): Array<TypedListener<EventArgsArray, EventArgsObject>>;
  off<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>,
    listener: TypedListener<EventArgsArray, EventArgsObject>
  ): this;
  on<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>,
    listener: TypedListener<EventArgsArray, EventArgsObject>
  ): this;
  once<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>,
    listener: TypedListener<EventArgsArray, EventArgsObject>
  ): this;
  removeListener<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>,
    listener: TypedListener<EventArgsArray, EventArgsObject>
  ): this;
  removeAllListeners<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>
  ): this;

  listeners(eventName?: string): Array<Listener>;
  off(eventName: string, listener: Listener): this;
  on(eventName: string, listener: Listener): this;
  once(eventName: string, listener: Listener): this;
  removeListener(eventName: string, listener: Listener): this;
  removeAllListeners(eventName?: string): this;

  queryFilter<EventArgsArray extends Array<any>, EventArgsObject>(
    event: TypedEventFilter<EventArgsArray, EventArgsObject>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TypedEvent<EventArgsArray & EventArgsObject>>>;

  interface: IAccessControlInterface;

  functions: {
    DAO_ROLE(overrides?: CallOverrides): Promise<[string]>;

    actionIsAuthorized(
      caller: string,
      target: string,
      sig: BytesLike,
      overrides?: CallOverrides
    ): Promise<[boolean] & { isAuthorized: boolean }>;

    addActionsRoles(
      targets: string[],
      functionDescs: string[],
      roles: string[][],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    getActionRoles(
      target: string,
      functionDesc: string,
      overrides?: CallOverrides
    ): Promise<[string[]] & { roles: string[] }>;

    getRoleAdmin(role: string, overrides?: CallOverrides): Promise<[string]>;

    grantRole(
      role: string,
      account: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    grantRolesAndAdmins(
      roles: string[],
      roleAdmins: string[],
      members: string[][],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    hasRole(
      role: string,
      account: string,
      overrides?: CallOverrides
    ): Promise<[boolean]>;

    initialize(
      dao: string,
      roles: string[],
      roleAdmins: string[],
      members: string[][],
      targets: string[],
      functionDescs: string[],
      actionRoles: string[][],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    isRoleAuthorized(
      role: string,
      target: string,
      functionDesc: string,
      overrides?: CallOverrides
    ): Promise<[boolean] & { isAuthorized: boolean }>;

    removeActionsRoles(
      targets: string[],
      functionDescs: string[],
      roles: string[][],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    renounceRole(
      role: string,
      account: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    revokeRole(
      role: string,
      account: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;
  };

  DAO_ROLE(overrides?: CallOverrides): Promise<string>;

  actionIsAuthorized(
    caller: string,
    target: string,
    sig: BytesLike,
    overrides?: CallOverrides
  ): Promise<boolean>;

  addActionsRoles(
    targets: string[],
    functionDescs: string[],
    roles: string[][],
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  getActionRoles(
    target: string,
    functionDesc: string,
    overrides?: CallOverrides
  ): Promise<string[]>;

  getRoleAdmin(role: string, overrides?: CallOverrides): Promise<string>;

  grantRole(
    role: string,
    account: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  grantRolesAndAdmins(
    roles: string[],
    roleAdmins: string[],
    members: string[][],
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  hasRole(
    role: string,
    account: string,
    overrides?: CallOverrides
  ): Promise<boolean>;

  initialize(
    dao: string,
    roles: string[],
    roleAdmins: string[],
    members: string[][],
    targets: string[],
    functionDescs: string[],
    actionRoles: string[][],
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  isRoleAuthorized(
    role: string,
    target: string,
    functionDesc: string,
    overrides?: CallOverrides
  ): Promise<boolean>;

  removeActionsRoles(
    targets: string[],
    functionDescs: string[],
    roles: string[][],
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  renounceRole(
    role: string,
    account: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  revokeRole(
    role: string,
    account: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  callStatic: {
    DAO_ROLE(overrides?: CallOverrides): Promise<string>;

    actionIsAuthorized(
      caller: string,
      target: string,
      sig: BytesLike,
      overrides?: CallOverrides
    ): Promise<boolean>;

    addActionsRoles(
      targets: string[],
      functionDescs: string[],
      roles: string[][],
      overrides?: CallOverrides
    ): Promise<void>;

    getActionRoles(
      target: string,
      functionDesc: string,
      overrides?: CallOverrides
    ): Promise<string[]>;

    getRoleAdmin(role: string, overrides?: CallOverrides): Promise<string>;

    grantRole(
      role: string,
      account: string,
      overrides?: CallOverrides
    ): Promise<void>;

    grantRolesAndAdmins(
      roles: string[],
      roleAdmins: string[],
      members: string[][],
      overrides?: CallOverrides
    ): Promise<void>;

    hasRole(
      role: string,
      account: string,
      overrides?: CallOverrides
    ): Promise<boolean>;

    initialize(
      dao: string,
      roles: string[],
      roleAdmins: string[],
      members: string[][],
      targets: string[],
      functionDescs: string[],
      actionRoles: string[][],
      overrides?: CallOverrides
    ): Promise<void>;

    isRoleAuthorized(
      role: string,
      target: string,
      functionDesc: string,
      overrides?: CallOverrides
    ): Promise<boolean>;

    removeActionsRoles(
      targets: string[],
      functionDescs: string[],
      roles: string[][],
      overrides?: CallOverrides
    ): Promise<void>;

    renounceRole(
      role: string,
      account: string,
      overrides?: CallOverrides
    ): Promise<void>;

    revokeRole(
      role: string,
      account: string,
      overrides?: CallOverrides
    ): Promise<void>;
  };

  filters: {
    "ActionRoleAdded(address,string,bytes4,string)"(
      target?: null,
      functionDesc?: null,
      encodedSig?: null,
      role?: null
    ): TypedEventFilter<
      [string, string, string, string],
      { target: string; functionDesc: string; encodedSig: string; role: string }
    >;

    ActionRoleAdded(
      target?: null,
      functionDesc?: null,
      encodedSig?: null,
      role?: null
    ): TypedEventFilter<
      [string, string, string, string],
      { target: string; functionDesc: string; encodedSig: string; role: string }
    >;

    "ActionRoleRemoved(address,string,bytes4,string)"(
      target?: null,
      functionDesc?: null,
      encodedSig?: null,
      role?: null
    ): TypedEventFilter<
      [string, string, string, string],
      { target: string; functionDesc: string; encodedSig: string; role: string }
    >;

    ActionRoleRemoved(
      target?: null,
      functionDesc?: null,
      encodedSig?: null,
      role?: null
    ): TypedEventFilter<
      [string, string, string, string],
      { target: string; functionDesc: string; encodedSig: string; role: string }
    >;

    "RoleAdminChanged(string,string,string)"(
      role?: null,
      previousAdminRole?: null,
      adminRole?: null
    ): TypedEventFilter<
      [string, string, string],
      { role: string; previousAdminRole: string; adminRole: string }
    >;

    RoleAdminChanged(
      role?: null,
      previousAdminRole?: null,
      adminRole?: null
    ): TypedEventFilter<
      [string, string, string],
      { role: string; previousAdminRole: string; adminRole: string }
    >;

    "RoleGranted(string,address,address)"(
      role?: null,
      account?: null,
      admin?: null
    ): TypedEventFilter<
      [string, string, string],
      { role: string; account: string; admin: string }
    >;

    RoleGranted(
      role?: null,
      account?: null,
      admin?: null
    ): TypedEventFilter<
      [string, string, string],
      { role: string; account: string; admin: string }
    >;

    "RoleRevoked(string,address,address)"(
      role?: null,
      account?: null,
      admin?: null
    ): TypedEventFilter<
      [string, string, string],
      { role: string; account: string; admin: string }
    >;

    RoleRevoked(
      role?: null,
      account?: null,
      admin?: null
    ): TypedEventFilter<
      [string, string, string],
      { role: string; account: string; admin: string }
    >;
  };

  estimateGas: {
    DAO_ROLE(overrides?: CallOverrides): Promise<BigNumber>;

    actionIsAuthorized(
      caller: string,
      target: string,
      sig: BytesLike,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    addActionsRoles(
      targets: string[],
      functionDescs: string[],
      roles: string[][],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    getActionRoles(
      target: string,
      functionDesc: string,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getRoleAdmin(role: string, overrides?: CallOverrides): Promise<BigNumber>;

    grantRole(
      role: string,
      account: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    grantRolesAndAdmins(
      roles: string[],
      roleAdmins: string[],
      members: string[][],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    hasRole(
      role: string,
      account: string,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    initialize(
      dao: string,
      roles: string[],
      roleAdmins: string[],
      members: string[][],
      targets: string[],
      functionDescs: string[],
      actionRoles: string[][],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    isRoleAuthorized(
      role: string,
      target: string,
      functionDesc: string,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    removeActionsRoles(
      targets: string[],
      functionDescs: string[],
      roles: string[][],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    renounceRole(
      role: string,
      account: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    revokeRole(
      role: string,
      account: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    DAO_ROLE(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    actionIsAuthorized(
      caller: string,
      target: string,
      sig: BytesLike,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    addActionsRoles(
      targets: string[],
      functionDescs: string[],
      roles: string[][],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    getActionRoles(
      target: string,
      functionDesc: string,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getRoleAdmin(
      role: string,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    grantRole(
      role: string,
      account: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    grantRolesAndAdmins(
      roles: string[],
      roleAdmins: string[],
      members: string[][],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    hasRole(
      role: string,
      account: string,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    initialize(
      dao: string,
      roles: string[],
      roleAdmins: string[],
      members: string[][],
      targets: string[],
      functionDescs: string[],
      actionRoles: string[][],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    isRoleAuthorized(
      role: string,
      target: string,
      functionDesc: string,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    removeActionsRoles(
      targets: string[],
      functionDescs: string[],
      roles: string[][],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    renounceRole(
      role: string,
      account: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    revokeRole(
      role: string,
      account: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;
  };
}
