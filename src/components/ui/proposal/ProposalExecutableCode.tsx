import {
  Alert,
  AlertTitle,
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Flex,
  Text,
} from '@chakra-ui/react';
import { Info } from '@decent-org/fractal-ui';
import { useTranslation } from 'react-i18next';
import { isAddress } from 'viem';
import { ADDRESS_MULTISIG_METADATA } from '../../../constants/common';
import { DecodedTransaction, FractalProposal } from '../../../types';
import EtherscanLinkAddress from '../links/EtherscanLinkAddress';

function TransactionRow({ paramKey, value }: { paramKey: string; value: string }) {
  const { t } = useTranslation('proposal');
  return (
    <Flex
      width="full"
      textStyle="text-base-mono-regular"
      color="grayscale.100"
      justifyContent="space-between"
      maxH={{ base: '12.5rem', md: 'initial' }}
      h={{ base: 'fit-content', md: 'initial' }}
      overflowY={{ base: 'auto', md: 'initial' }}
      flexWrap={{ base: 'wrap', md: 'nowrap' }}
      gap={2}
    >
      <Text whiteSpace="nowrap">{t(paramKey)}</Text>
      <Text
        textAlign="end"
        wordBreak="break-word"
        ml={{ base: 0, md: '0.5rem' }}
        maxW={{ base: '100%', md: '70%' }}
      >
        {isAddress(value) ? (
          <EtherscanLinkAddress address={value}>{value}</EtherscanLinkAddress>
        ) : (
          value
        )}
      </Text>
    </Flex>
  );
}
function TransactionBlock({ transaction }: { transaction: DecodedTransaction }) {
  const { t } = useTranslation('proposal');
  if (
    transaction.target == ADDRESS_MULTISIG_METADATA &&
    transaction.value === '0' &&
    transaction.function === undefined
  ) {
    // this is a multisig metadata transaction, alert the user
    return (
      <Alert
        status="info"
        mt={2}
      >
        <Flex
          width="full"
          borderRadius="4px"
          bg="black.600"
          flexWrap="wrap"
          padding={4}
          rowGap={2}
        >
          <Flex alignItems="center">
            <Info boxSize="24px" />
            <AlertTitle>{t('multisigMetadataMessage')}</AlertTitle>
          </Flex>
          <TransactionRow
            paramKey="paramTarget"
            value={ADDRESS_MULTISIG_METADATA}
          />
          <TransactionRow
            paramKey="paramFunction"
            value={'n/a'}
          />
          <TransactionRow
            paramKey="paramValue"
            value={'0'}
          />
        </Flex>
      </Alert>
    );
  }

  return (
    <Flex
      width="full"
      borderRadius="4px"
      bg="black.600"
      flexWrap="wrap"
      padding={4}
      rowGap={2}
    >
      <TransactionRow
        paramKey="paramTarget"
        value={transaction.target}
      />
      <TransactionRow
        paramKey="paramFunction"
        value={transaction.function}
      />
      <TransactionRow
        paramKey="paramTypes"
        value={transaction.parameterTypes.join(', ')}
      />
      <TransactionRow
        paramKey="paramInputs"
        value={transaction.parameterValues.join(', ')}
      />
      <TransactionRow
        paramKey="paramValue"
        value={transaction.value}
      />
      {transaction.decodingFailed && (
        <Alert
          status="info"
          mt={2}
        >
          <Info boxSize="24px" />
          <AlertTitle>{t('decodingFailedMessage')}</AlertTitle>
        </Alert>
      )}
    </Flex>
  );
}

export default function ProposalExecutableCode({ proposal }: { proposal: FractalProposal }) {
  const { t } = useTranslation('proposal');
  if (!proposal.data) {
    return null;
  }
  return (
    <Box
      bg="black.900"
      borderRadius="4px"
      marginTop={4}
      paddingTop={2}
      paddingBottom={2}
    >
      <Accordion allowToggle>
        <AccordionItem
          borderTop="none"
          borderBottom="none"
        >
          {({ isExpanded }) => (
            <>
              <AccordionButton
                textStyle="text-button-md-semibold"
                color="grayscale.100"
              >
                <AccordionIcon
                  marginRight={3}
                  transform={`rotate(-${isExpanded ? '0' : '90'}deg)`}
                />
                {t(isExpanded ? 'hideExecutableCode' : 'showExecutableCode')}
              </AccordionButton>
              <AccordionPanel paddingBottom={4}>
                <Flex
                  gap={2}
                  flexDirection="column"
                >
                  {proposal.data?.decodedTransactions.map((tx, i) => (
                    <TransactionBlock
                      transaction={tx}
                      key={i}
                    />
                  ))}
                </Flex>
              </AccordionPanel>
            </>
          )}
        </AccordionItem>
      </Accordion>
    </Box>
  );
}
