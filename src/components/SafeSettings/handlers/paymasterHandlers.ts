import { Text } from '@chakra-ui/react';
import * as React from 'react';
import type { PublicClient } from 'viem';
import { CreateProposalAction } from '../../../types';
import { prepareRefillPaymasterAction } from '../../../utils/dao/prepareRefillPaymasterActionData';
import { prepareWithdrawPaymasterAction } from '../../../utils/dao/prepareWithdrawPaymasterActionData';
import { formatCoin } from '../../../utils/numberFormats';
import { SafeSettingsEdits } from '../types';

interface Governance {
  paymasterAddress: `0x${string}` | null;
}

interface AccountAbstraction {
  entryPointv07: `0x${string}`;
}

export const handleEditPaymaster = async (
  updatedValues: SafeSettingsEdits,
  governance: Governance,
  accountAbstraction: AccountAbstraction | undefined,
  publicClient: PublicClient,
): Promise<CreateProposalAction[] | undefined> => {
  const { paymasterAddress } = governance;
  if (!paymasterAddress) {
    throw new Error('Paymaster address is not set');
  }

  const actions: CreateProposalAction[] = [];
  if (!publicClient.chain) {
    throw new Error('Public client chain is not set');
  }
  const nativeCurrency = publicClient.chain.nativeCurrency;
  const { paymasterGasTank } = updatedValues;

  if (paymasterGasTank?.withdraw?.amount?.bigintValue) {
    if (!paymasterGasTank.withdraw.recipientAddress) {
      throw new Error('Recipient address is not set');
    }

    const actionData = prepareWithdrawPaymasterAction({
      withdrawData: {
        withdrawAmount: paymasterGasTank.withdraw.amount.bigintValue,
        recipientAddress: paymasterGasTank.withdraw.recipientAddress as `0x${string}`,
      },
      paymasterAddress,
    });

    const formattedWithdrawAmount = formatCoin(
      paymasterGasTank.withdraw.amount.bigintValue,
      true,
      nativeCurrency.decimals,
      nativeCurrency.symbol,
      false,
    );

    const withdrawContent = 'Withdraw ' + formattedWithdrawAmount + ' ' + nativeCurrency.symbol + ' from the gas tank';
    actions.push({
      ...actionData,
      content: React.createElement(Text, null, withdrawContent),
    });
  }

  if (paymasterGasTank?.deposit?.amount?.bigintValue) {
    if (!accountAbstraction) {
      throw new Error('Account Abstraction addresses are not set');
    }

    if (paymasterGasTank.deposit.isDirectDeposit) {
      return;
    }

    const actionData = prepareRefillPaymasterAction({
      refillAmount: paymasterGasTank.deposit.amount.bigintValue,
      paymasterAddress,
      nativeToken: nativeCurrency,
      entryPointAddress: accountAbstraction.entryPointv07 as `0x${string}`,
    });
    
    const formattedRefillAmount = formatCoin(
      paymasterGasTank.deposit.amount.bigintValue,
      true,
      nativeCurrency.decimals,
      nativeCurrency.symbol,
      false,
    );

    const refillContent = 'Refill gas tank with ' + formattedRefillAmount + ' ' + nativeCurrency.symbol;
    actions.push({
      ...actionData,
      content: React.createElement(Text, null, refillContent),
    });
  }

  return actions;
};
