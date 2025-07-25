import { Flex, Text, Td, TableContainer, Table, Thead, Tr, Th, Tbody } from '@chakra-ui/react';
import { PropsWithChildren } from 'react';

function StyledTd({
  children,
  wrappedWithTextNode,
}: PropsWithChildren<{ wrappedWithTextNode?: boolean }>) {
  return (
    <Td borderRight="1px solid var(--colors-color-layout-border)">
      {wrappedWithTextNode ? (
        <Text
          overflow="hidden"
          textOverflow="ellipsis"
          color="color-content-content1-foreground"
          textStyle="text-sm-medium"
        >
          {children}
        </Text>
      ) : (
        children
      )}
    </Td>
  );
}

export interface StyledTableData {
  head: string[];
  body: (string | JSX.Element)[][];
}

export default function StyledTable({ data }: { data: StyledTableData }) {
  return (
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
              {data.head.map((header, index) => (
                <Th
                  key={index}
                  textTransform="none"
                >
                  <Text textStyle="text-sm-medium">{header}</Text>
                </Th>
              ))}
            </Tr>
          </Thead>
          <Tbody textColor="color-content-content1-foreground">
            {data.body.map((row, index) => (
              <Tr
                key={index}
                borderBottom="1px solid var(--colors-color-layout-border)"
              >
                {row.map((value, valueIndex) => (
                  <StyledTd
                    key={valueIndex}
                    wrappedWithTextNode={typeof value === 'string'}
                  >
                    {value}
                  </StyledTd>
                ))}
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>
    </Flex>
  );
}
