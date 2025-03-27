import { AbiFunction, decodeFunctionData, getAbiItem, Hash } from 'viem';
import { TransactionWithId } from '../components/SafeInjectIframe/types';
import { ABIElement } from '../hooks/utils/useABI';
import { CreateProposalTransaction } from '../types';

interface TransactionsDecodeResult {
  decodedTransactions: CreateProposalTransaction[];
  failedTransactions: TransactionWithId[];
}

/**
 * Decode transactions with encoded data and ABI
 * @param transactions which has encoded data
 * @param loadABI function to load ABI for a given address
 */
export async function decodeTransactionsWithABI(
  transactions: TransactionWithId[],
  loadABI: (address: string) => Promise<ABIElement[]>,
): Promise<TransactionsDecodeResult> {
  const decodedTransactions: CreateProposalTransaction[] = [];
  const failedTransactions: TransactionWithId[] = [];

  for (const transaction of transactions) {
    const functionSelector = transaction.data.slice(0, 10);
    const abi = await loadABI(transaction.to);
    const abiFunction = getAbiItem({
      abi: abi,
      name: functionSelector,
    }) as AbiFunction;

    // is there ABI for this transaction?
    if (abiFunction) {
      // decode parameters from data
      const { args: paramValues } = decodeFunctionData({
        abi,
        data: transaction.data as Hash,
      });
      const parameters = abiFunction.inputs.map((abiInput, index) => ({
        signature: `${abiInput.type} ${abiInput.name}`,
        label: '',
        value: paramValues?.[index]!.toString() || '',
      }));

      decodedTransactions.push({
        targetAddress: transaction.to || '',
        functionName: abiFunction.name,
        ethValue: {
          value: transaction.value,
          bigintValue: BigInt(transaction.value),
        },
        parameters,
      });
    } else {
      console.warn('loadABIandMatch.fail', { transaction, abi, abiFunction });
      failedTransactions.push(transaction);
    }
  }

  return { decodedTransactions, failedTransactions };
}
