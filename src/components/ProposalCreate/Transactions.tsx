import {
  Box,
  Accordion,
  AccordionButton,
  AccordionItem,
  AccordionPanel,
  HStack,
  IconButton,
} from '@chakra-ui/react';
import { ArrowDown, ArrowRight, Minus } from '@decent-org/fractal-ui';
import { FormikErrors, FormikProps } from 'formik';
import { Dispatch, SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';
import { BigIntValuePair, CreateProposalForm, CreateProposalTransaction } from '../../types';
import Transaction from './Transaction';

interface TransactionsProps extends FormikProps<CreateProposalForm> {
  isVisible: boolean;
  pendingTransaction: boolean;
  expandedIndecies: number[];
  setExpandedIndecies: Dispatch<SetStateAction<number[]>>;
}
function Transactions({
  values: { transactions },
  errors,
  setFieldValue,
  pendingTransaction,
  expandedIndecies,
  setExpandedIndecies,
}: TransactionsProps) {
  const { t } = useTranslation(['proposal', 'common']);

  const removeTransaction = (transactionIndex: number) => {
    const transactionsArr = [...transactions];
    transactionsArr.splice(transactionIndex, 1);
    setFieldValue('transactions', transactionsArr);
  };
  return (
    <Accordion
      allowMultiple
      index={expandedIndecies}
    >
      {transactions.map((_, index) => {
        const txErrors = errors?.transactions?.[index] as
          | FormikErrors<CreateProposalTransaction<BigIntValuePair>>
          | undefined;
        const txAddressError = txErrors?.targetAddress;
        const txFunctionError = txErrors?.encodedFunctionData;

        return (
          <AccordionItem
            key={index}
            borderTop="none"
            borderBottom="none"
          >
            {({ isExpanded }) => (
              <Box
                rounded="lg"
                p={3}
                my="2"
                bg="black.900"
              >
                <HStack justify="space-between">
                  <AccordionButton
                    onClick={() => {
                      setExpandedIndecies(indexArray => {
                        if (indexArray.includes(index)) {
                          const newTxArr = [...indexArray];
                          newTxArr.splice(newTxArr.indexOf(index), 1);
                          return newTxArr;
                        } else {
                          return [...indexArray, index];
                        }
                      });
                    }}
                    p={0}
                    textStyle="text-button-md-semibold"
                    color="grayscale.100"
                  >
                    {isExpanded ? <ArrowDown boxSize="1.5rem" /> : <ArrowRight fontSize="1.5rem" />}
                    {t('transaction')} {index + 1}
                  </AccordionButton>
                  {index !== 0 || transactions.length !== 1 ? (
                    <IconButton
                      icon={<Minus boxSize="1.5rem" />}
                      aria-label={t('removetransactionlabel')}
                      variant="unstyled"
                      onClick={() => removeTransaction(index)}
                      minWidth="auto"
                      _hover={{ color: 'gold.500' }}
                      _disabled={{ opacity: 0.4, cursor: 'default' }}
                      sx={{ '&:disabled:hover': { color: 'inherit', opacity: 0.4 } }}
                      isDisabled={pendingTransaction}
                    />
                  ) : (
                    <Box h="2.25rem" />
                  )}
                </HStack>
                <AccordionPanel p={0}>
                  <Transaction
                    transaction={transactions[index]}
                    txAddressError={txAddressError}
                    txFunctionError={txFunctionError}
                    transactionIndex={index}
                    setFieldValue={setFieldValue}
                    transactionPending={pendingTransaction}
                  />
                </AccordionPanel>
              </Box>
            )}
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}

export default Transactions;
