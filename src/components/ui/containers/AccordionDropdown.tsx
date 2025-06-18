import {
  Box,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionIcon,
  AccordionPanel,
  Flex,
} from '@chakra-ui/react';

function ContentCountBadge({ count }: { count: number | undefined }) {
  if (!count || count === 0) {
    return null;
  }
  return (
    <Box
      textStyle="text-xs-medium"
      rounded="9999px"
      bg="color-green-500"
      border="1px solid"
      borderColor="color-green-800"
      color="color-green-950"
      boxSize="1.25rem"
      textAlign="center"
    >
      {count}
    </Box>
  );
}

export function AccordionDropdown({
  content,
  contentCount,
  sectionTitle,
  defaultExpandedIndices,
}: {
  content: React.ReactNode;
  contentCount?: number;
  sectionTitle: React.ReactNode;
  defaultExpandedIndices?: number[];
}) {
  return (
    <Box
      marginTop={4}
      padding="1rem"
      borderRadius="0.75rem"
      bg="color-neutral-950"
      border="1px solid"
      borderColor="color-neutral-900"
    >
      <Accordion
        allowToggle
        gap="1.5rem"
        defaultIndex={defaultExpandedIndices}
      >
        <AccordionItem
          borderTop="none"
          borderBottom="none"
        >
          {({ isExpanded }) => (
            <>
              <Flex
                alignItems="center"
                justifyContent="space-between"
              >
                <AccordionButton
                  p={0}
                  textStyle="text-xl-regular"
                  color="color-lilac-100"
                >
                  <Flex
                    alignItems="center"
                    justifyContent="space-between"
                    width="100%"
                  >
                    {sectionTitle}
                    <Flex alignItems="center">
                      <ContentCountBadge count={contentCount} />
                      <AccordionIcon
                        transform={`rotate(-${isExpanded ? '0' : '90'}deg)`}
                        boxSize="1.25rem"
                      />
                    </Flex>
                  </Flex>
                </AccordionButton>
              </Flex>
              <AccordionPanel paddingBottom={4}>
                <Flex
                  gap={2}
                  flexDirection="column"
                >
                  {content}
                </Flex>
              </AccordionPanel>
            </>
          )}
        </AccordionItem>
      </Accordion>
    </Box>
  );
}
