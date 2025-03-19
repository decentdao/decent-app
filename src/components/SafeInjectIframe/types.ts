import { Transaction } from '@safe-global/safe-core-sdk-types';

export interface TransactionWithId extends Transaction {
  id: number;
}

export interface SafeInfo {
  safeAddress: string;
  network: string;
  ethBalance: string;
}

// InterfaceMessages types
export declare const INTERFACE_MESSAGES: {
  readonly ENV_INFO: 'ENV_INFO';
  readonly ON_SAFE_INFO: 'ON_SAFE_INFO';
  readonly TRANSACTION_CONFIRMED: 'TRANSACTION_CONFIRMED';
  readonly TRANSACTION_REJECTED: 'TRANSACTION_REJECTED';
};
export type InterfaceMessageIds = keyof typeof INTERFACE_MESSAGES;
export interface InterfaceMessageToPayload {
  [INTERFACE_MESSAGES.ON_SAFE_INFO]: SafeInfo;
  [INTERFACE_MESSAGES.TRANSACTION_CONFIRMED]: {
    safeTxHash: string;
  };
  [INTERFACE_MESSAGES.ENV_INFO]: {
    txServiceUrl: string;
  };
  [INTERFACE_MESSAGES.TRANSACTION_REJECTED]: Record<string, unknown>;
}
export type InterfaceMessageProps<T extends InterfaceMessageIds> = {
  messageId: T;
  data: InterfaceMessageToPayload[T];
};
export declare type RequestId = number | string;
