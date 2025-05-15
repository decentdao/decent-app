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
  if (!count) {
    return null;
  }
  return (
    <Box
      textStyle="labels-small"
      rounded="9999px"
      bg="celery--2"
      border="1px solid"
      borderColor="celery--5"
      color="celery--6"
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
  sectionTitle: string;
  defaultExpandedIndices?: number[];
}) {
  return (
    <Box
      marginTop={4}
      padding="1rem"
      borderRadius="0.75rem"
      bg="neutral-2"
      border="1px solid"
      borderColor="neutral-3"
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
                  textStyle="heading-small"
                  color="lilac-0"
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
