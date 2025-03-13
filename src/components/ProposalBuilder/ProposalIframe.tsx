import { Box } from '@chakra-ui/react';
import { useFormikContext } from 'formik';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { AbiFunction, decodeFunctionData, getAbiItem, Hash } from 'viem';
import { useABI } from '../../hooks/utils/useABI';
import { CreateProposalForm, CreateProposalTransaction } from '../../types/proposalBuilder';
import SafeInjectIframeCard from '../SafeInjectIframeCard';
import { useSafeInject } from '../SafeInjectIframeCard/context/SafeInjectedContext';

export function ProposalIframe() {
  const { values, setFieldValue } = useFormikContext<CreateProposalForm>();
  const { latestTransactions, setLatestTransactions } = useSafeInject();
  const { loadABI } = useABI();

  useEffect(() => {
    const processTransactions = async () => {
      if (latestTransactions && latestTransactions.length > 0) {
        // TODO remove this toast or add an i18n key
        toast.success(`Received ${latestTransactions.length} transactions from dApp`);
        const updatedTransactions: CreateProposalTransaction[] = [];

        for (const latestTransaction of latestTransactions) {
          const functionSelector = latestTransaction.data.slice(0, 10);
          const abi = await loadABI(latestTransaction.to);
          const abiFunction = getAbiItem({
            abi: abi,
            name: functionSelector,
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

            updatedTransactions.push({
              targetAddress: latestTransaction.to || '',
              functionName: abiFunction.name,
              ethValue: {
                value: latestTransaction.value,
                bigintValue: BigInt(latestTransaction.value),
              },
              parameters,
            });
          } else {
            console.warn('loadABIandMatch.fail', latestTransaction, abi, abiFunction);
            toast.warning(`Failed to parse transaction-${functionSelector}`);
          }
        }

        const previousTransactions = values.transactions || [];
        // if there is only one transaction and it is empty, replace it
        if (previousTransactions.length === 1 && previousTransactions[0].targetAddress === '') {
          setFieldValue('transactions', updatedTransactions);
        } else {
          setFieldValue('transactions', [...previousTransactions, ...updatedTransactions]);
        }

        setLatestTransactions([]);
      }
    };

    processTransactions();
  }, [latestTransactions, loadABI, setFieldValue, setLatestTransactions, values.transactions]);

  return (
    <Box>
      <SafeInjectIframeCard />
    </Box>
  );
}
