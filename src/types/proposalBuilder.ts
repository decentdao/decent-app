import { ReactNode } from 'react';
import { BigIntValuePair } from './common';

export enum CreateProposalSteps {
  METADATA = 'metadata',
  TRANSACTIONS = 'transactions',
}

export interface CreateProposalTransaction<T = BigIntValuePair> {
  targetAddress: string;
  ethValue: T;
  functionName: string;
  parameters: {
    signature: string;
    label?: string;
    value?: string;
  }[];
}

export type CreateProposalMetadata = {
  title: string;
  description: string;
  documentationUrl?: string;
};

export type CreateProposalForm = {
  transactions: CreateProposalTransaction[];
  proposalMetadata: CreateProposalMetadata;
  nonce?: number;
};

export type Tranche = {
  amount: BigIntValuePair;
  duration: BigIntValuePair;
};

export type Stream = {
  type: 'tranched';
  tokenAddress: string;
  recipientAddress: string;
  startDate: Date;
  tranches: Tranche[];
  totalAmount: BigIntValuePair;
  cancelable: boolean;
  transferable: boolean;
};

export type CreateSablierProposalForm = {
  streams: Stream[];
} & CreateProposalForm;

export type ProposalTemplate = {
  transactions: CreateProposalTransaction[];
} & CreateProposalMetadata;

export enum ProposalActionType {
  ADD = 'add',
  EDIT = 'edit',
  DELETE = 'delete',
  TRANSFER = 'transfer',
  NATIVE_TRANSFER = 'native_transfer',
  AIRDROP = 'airdrop',
  WITHDRAW_STREAM = 'withdraw_stream',
  DAPP_INTEGRATION = 'dapp_integration',
}

export type CreateProposalActionData<T = BigIntValuePair> = {
  actionType: ProposalActionType;
  transactions: CreateProposalTransaction<T>[];
};

export type CreateProposalAction<T = BigIntValuePair> = CreateProposalActionData<T> & {
  content: ReactNode;
};
