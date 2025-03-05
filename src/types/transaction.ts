import { Address, Hex } from 'viem';

export interface DecodedTransaction {
  target: Address;
  value: string;
  function: string;
  parameterTypes: string[];
  parameterValues: string[];
  decodingFailed?: boolean;
}
export interface MetaTransaction {
  to: Address;
  value: bigint;
  data: Hex;
  operation: number;
}

type Modify<T, R> = Omit<T, keyof R> & R;

export interface SafePostTransaction
  extends Modify<
    SafeTransaction,
    {
      safe: Address;
      contractTransactionHash: string;
      sender: Address;
      signature: string;
      value: string;
    }
  > {}

export interface SafeTransaction extends MetaTransaction {
  safeTxGas: string;
  baseGas: string;
  gasPrice: string;
  gasToken: Address;
  refundReceiver: Address;
  nonce: number;
}
