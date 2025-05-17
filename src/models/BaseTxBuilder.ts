import { Abi, Address, encodeFunctionData, PublicClient } from 'viem';
import { buildContractCall } from '../helpers';
import {
  SafeMultisigDAO,
  SubDAO,
  AzoriusERC20DAO,
  AzoriusERC721DAO,
  SafeTransaction,
} from '../types';

export interface ContractCallTarget {
  address?: Address;
  abi: Abi;
  description: string;
}

export class BaseTxBuilder {
  protected readonly publicClient: PublicClient;
  protected readonly isAzorius: boolean;
  protected readonly daoData: SafeMultisigDAO | AzoriusERC20DAO | AzoriusERC721DAO | SubDAO;
  protected readonly parentAddress?: Address;
  protected readonly parentTokenAddress?: Address;

  constructor(
    publicClient: PublicClient,
    isAzorius: boolean,
    daoData: SafeMultisigDAO | AzoriusERC20DAO | AzoriusERC721DAO | SubDAO,
    parentAddress?: Address,
    parentTokenAddress?: Address,
  ) {
    this.publicClient = publicClient;
    this.daoData = daoData;
    this.isAzorius = isAzorius;
    this.parentAddress = parentAddress;
    this.parentTokenAddress = parentTokenAddress;
  }
}

export const call = ({
  target,
  functionName,
  args,
}: {
  target: ContractCallTarget;
  functionName: string;
  args?: readonly unknown[];
}): SafeTransaction => {
  if (!target.address) {
    throw new Error(`${target.description} not set`);
  }
  return buildContractCall({
    target: target.address,
    encodedFunctionData: encodeFunctionData({
      functionName: functionName,
      args,
      abi: target.abi,
    }),
  });
};

export const ensure = <Type>({
  data,
  description,
}: {
  data: Type | undefined;
  description: string;
}): Type => {
  if (!data) {
    throw new Error(`${description} not set`);
  }
  return data;
};
