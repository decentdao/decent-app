import {
  Box,
  Flex,
  Accordion,
  AccordionButton,
  AccordionItem,
  AccordionPanel,
  HStack,
  IconButton,
  Text,
} from '@chakra-ui/react';
import { MinusCircle, CaretDown, CaretRight } from '@phosphor-icons/react';
import { FormikErrors, FormikProps } from 'formik';
import { Dispatch, SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';
import { BigIntValuePair } from '../../types';
import { CreateProposalTransaction } from '../../types/proposalBuilder';
import ProposalTransaction from './ProposalTransaction';

interface ProposalTransactionsProps {
  values: FormikProps<CreateProposalTransaction[]>['values'];
  errors?: FormikProps<CreateProposalTransaction[]>['errors'];
  setFieldValue: FormikProps<CreateProposalTransaction[]>['setFieldValue'];
  pendingTransaction: boolean;
  expandedIndecies: number[];
  setExpandedIndecies: Dispatch<SetStateAction<number[]>>;
  isProposalMode: boolean;
  removeTransaction: (index: number) => void;
}

export default function ProposalTransactions({
  values: transactions,
  errors,
  setFieldValue,
  pendingTransaction,
  expandedIndecies,
  setExpandedIndecies,
  isProposalMode,
  removeTransaction,
}: ProposalTransactionsProps) {
  const { t } = useTranslation(['proposal', 'proposalTemplate', 'common']);

  return (
    <Accordion
      allowMultiple
      index={expandedIndecies}
    >
      {transactions.map((_, index) => {
        const txErrors = errors?.[index] as
          | FormikErrors<CreateProposalTransaction<BigIntValuePair>>
          | undefined;
        const txAddressError = txErrors?.targetAddress;
        const txFunctionError = txErrors?.functionName;

        return (
          <AccordionItem
            key={index}
            borderTop="none"
            borderBottom="none"
          >
            {({ isExpanded }) => (
              <Box borderRadius={4}>
                {/* TRANSACTION HEADER */}
                <HStack
                  px="1.5rem"
                  justify="space-between"
                >
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
                    p="0.25rem"
                    textStyle="text-xl-regular"
                    color="color-lilac-100"
                  >
                    <Text textStyle="text-xl-regular">
                      <Flex
                        alignItems="center"
                        gap={2}
                      >
                        {isExpanded ? <CaretDown /> : <CaretRight />}
                        {t('transaction')} {index + 1}
                      </Flex>
                    </Text>
                  </AccordionButton>
                  {index !== 0 || transactions.length !== 1 ? (
                    <IconButton
                      icon={<MinusCircle />}
                      aria-label={t('removetransactionlabel')}
                      variant="unstyled"
                      onClick={() => removeTransaction(index)}
                      minWidth="auto"
                      color="color-lilac-100"
                      _disabled={{ opacity: 0.4, cursor: 'default' }}
                      sx={{ '&:disabled:hover': { color: 'inherit', opacity: 0.4 } }}
                      isDisabled={pendingTransaction}
                    />
                  ) : (
                    <Box h="2.25rem" />
                  )}
                </HStack>

                <AccordionPanel p={0}>
                  <ProposalTransaction
                    transaction={transactions[index] as CreateProposalTransaction}
                    txFunctionError={txFunctionError}
                    txAddressError={txAddressError}
                    transactionIndex={index}
                    setFieldValue={setFieldValue}
                    transactionPending={pendingTransaction}
                    isProposalMode={isProposalMode}
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
