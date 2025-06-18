import { Alert, AlertTitle, Box, Flex, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { isAddress } from 'viem';
import { Info } from '../../../assets/theme/custom/icons/Info';
import { ADDRESS_MULTISIG_METADATA } from '../../../constants/common';
import { DecodedTransaction, FractalProposal } from '../../../types';
import { AccordionDropdown } from '../containers/AccordionDropdown';
import EtherscanLink from '../links/EtherscanLink';

function TransactionRow({ paramKey, value }: { paramKey: string; value: string }) {
  const { t } = useTranslation('proposal');
  return (
    <Flex
      width="full"
      textStyle="text-sm-mono"
      color="color-white"
      alignItems="center"
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
        display={isAddress(value) ? 'inline-flex' : undefined}
      >
        {isAddress(value) ? (
          <EtherscanLink
            type="address"
            value={value}
          >
            {value}
          </EtherscanLink>
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
      bg="color-neutral-900"
      flexWrap="wrap"
      padding="1rem"
      rowGap="0.5rem"
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
          <Box
            width="1.5rem"
            height="1.5rem"
          >
            <Info boxSize="24px" />
          </Box>
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
    <AccordionDropdown
      sectionTitle={t('executableCode')}
      content={
        <Flex
          mt={2}
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
      }
    />
  );
}
