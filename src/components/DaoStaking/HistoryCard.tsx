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

function TableBodyRowCell({ children }: PropsWithChildren) {
  return <Td borderRight="1px solid var(--colors-color-layout-border)">{children}</Td>;
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
                  <TableBodyRowCell>{tx.date}</TableBodyRowCell>
                  <TableBodyRowCell>{tx.action}</TableBodyRowCell>
                  <TableBodyRowCell>{tx.amount}</TableBodyRowCell>
                  <TableBodyRowCell>{tx.txHash}</TableBodyRowCell>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableContainer>
      </Flex>
    </>
  );
}
