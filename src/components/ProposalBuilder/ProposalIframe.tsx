import { Box } from '@chakra-ui/react';
import { useFormikContext } from 'formik';
import { useEffect } from 'react';
import { AbiFunction, decodeAbiParameters, decodeFunctionData, getAbiItem, Hash } from 'viem';
import { useABI } from '../../hooks/utils/useABI';
import { CreateProposalForm } from '../../types/proposalBuilder';
import SafeInjectIframeCard from '../SafeInjectIframeCard';
import { useSafeInject } from '../SafeInjectIframeCard/context/SafeInjectedContext';

export function ProposalIframe() {
  const { values, setFieldValue } = useFormikContext<CreateProposalForm>();
  const { latestTransaction, setLatestTransaction } = useSafeInject();
  const abi = useABI(latestTransaction?.to);

  useEffect(() => {
    if (latestTransaction) {
      const abiFunction = getAbiItem({
        abi: abi,
        name: latestTransaction.data.slice(0, 10), // 4 byte function selector
      }) as AbiFunction;
      // is there ABI for this transaction?
      if (abiFunction) {
        // decode parameters from data
        const { args: paramValues } = decodeFunctionData({
          abi,
          data: latestTransaction.data as Hash,
        });
        const parameters = abiFunction.inputs.map((abiInput, index) => ({
          signature: `${abiInput.type} ${abiInput.name}`,
          label: '',
          value: paramValues?.[index]!.toString() || '',
        }));

        const previousTransactions = values.transactions || [];
        // if there is only one transaction and it is empty, replace it
        if (previousTransactions.length === 1 && previousTransactions[0].targetAddress === '') {
          setFieldValue('transactions', [
            {
              targetAddress: latestTransaction.to,
              functionName: abiFunction.name,
              ethValue: {
                value: latestTransaction.value,
                bigintValue: BigInt(latestTransaction.value),
              },
              parameters,
            },
          ]);
        } else {
          setFieldValue('transactions', [
            ...previousTransactions,
            {
              targetAddress: latestTransaction.to,
              functionName: abiFunction.name,
              ethValue: {
                value: latestTransaction.value,
                bigintValue: BigInt(latestTransaction.value),
              },
              parameters,
            },
          ]);
        }

        setLatestTransaction(undefined);
      }
    }
  }, [abi, latestTransaction, setFieldValue, setLatestTransaction, values.transactions]);

  console.debug('aha', values);

  return (
    <Box>
      <SafeInjectIframeCard />
    </Box>
  );
}
