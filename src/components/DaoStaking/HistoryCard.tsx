import {
  Flex,
  Tab,
  Table,
  TableContainer,
  TabList,
  Tabs,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/react';
import { PropsWithChildren } from 'react';

function StyledTd({ children, onlyText }: PropsWithChildren<{ onlyText?: string }>) {
  return (
    <Td borderRight="1px solid var(--colors-color-layout-border)">
      {onlyText ? (
        <Text
          overflow="hidden"
          textOverflow="ellipsis"
          color="color-content-content1-foreground"
          textStyle="text-sm-medium"
        >
          {onlyText}
        </Text>
      ) : (
        children
      )}
    </Td>
  );
}

function BadgeText({ children }: PropsWithChildren) {
  return (
    <Flex
      padding="2px 4px"
      justifyContent="center"
      alignItems="center"
      gap="1px"
      borderRadius="9999px"
      background="color-content-content2"
    >
      <Flex
        padding="0px 2px"
        alignItems="center"
        gap="4px"
      >
        <Flex
          padding="0px 4px"
          justifyContent="center"
          alignItems="center"
          flexShrink={0}
          aspectRatio="1/1"
          borderRadius="9999px"
          background="color-content-content1-foreground"
        ></Flex>
        <Text
          color="color-content-content1-foreground"
          textStyle="text-xs-medium"
        >
          {children}
        </Text>
      </Flex>
    </Flex>
  );
}

interface TransactionEntry {
  date: string;
  action: string;
  amount: string;
  txHash: string;
}

const exampleTransactions: TransactionEntry[] = [
  {
    date: '09/07/2025 13:33',
    action: 'Staked',
    amount: '1,500 DRVN',
    txHash: '0x1234...abcd',
  },
  {
    date: '08/07/2025 09:23',
    action: 'Claimed',
    amount: 'Multiple Tokens',
    txHash: '0x2234...abcd',
  },
  {
    date: '07/07/2025 10:03',
    action: 'Claimed',
    amount: '85.50 USDC',
    txHash: '0x3234...abcd',
  },
  {
    date: '06/07/2025 11:33',
    action: 'Unstaked',
    amount: '5,000 DRVN',
    txHash: '0x4234...abcd',
  },
];

export default function HistoryCard() {
  return (
    <>
      <Tabs
        variant="underlined"
        size="md"
      >
        <TabList>
          <Tab>Transactions</Tab>
          <Tab>Revenue Share History</Tab>
        </TabList>
      </Tabs>

      <Flex
        direction="column"
        alignItems="flex-start"
        alignSelf="stretch"
        borderRadius="12px"
        border="1px solid rgba(255, 255, 255, 0.10)"
      >
        <TableContainer width="full">
          <Table variant="unstyled">
            <Thead
              borderBottom="1px solid var(--colors-color-layout-border)"
              background="color-content-content2"
              textColor="color-content-content2-foreground"
            >
              <Tr>
                <Th>
                  <Text textStyle="text-sm-medium">Date</Text>
                </Th>
                <Th>
                  <Text textStyle="text-sm-medium">Action</Text>
                </Th>
                <Th>
                  <Text textStyle="text-sm-medium">Amount</Text>
                </Th>
                <Th>
                  <Text textStyle="text-sm-medium">Tx Hash / Link</Text>
                </Th>
              </Tr>
            </Thead>
            <Tbody textColor="color-content-content1-foreground">
              {exampleTransactions.map(tx => (
                <Tr
                  key={tx.txHash}
                  borderBottom="1px solid var(--colors-color-layout-border)"
                >
                  <StyledTd onlyText={tx.date} />
                  <StyledTd>
                    <BadgeText>{tx.action}</BadgeText>
                  </StyledTd>
                  <StyledTd onlyText={tx.amount} />
                  <StyledTd onlyText={tx.txHash} />
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableContainer>
      </Flex>
    </>
  );
}
