import { HStack, Text, Select } from '@chakra-ui/react';

interface RequirementsFooterProps {
  requirementMode: 'all' | 'any';
  setRequirementMode: (mode: 'all' | 'any') => void;
  requirementsCount: number;
}

export function RequirementsFooter({ requirementMode, setRequirementMode, requirementsCount }: RequirementsFooterProps) {
  return (
    <HStack spacing={2} justify="center">
      <Text color="color-white" fontSize="sm">
        Should meet
      </Text>
      <Select
        value={requirementMode}
        onChange={e => setRequirementMode(e.target.value as 'all' | 'any')}
        size="sm"
        w="auto"
        minW="80px"
        bg="color-neutral-900"
        border="1px solid"
        borderColor="color-neutral-800"
        color="color-neutral-400"
        fontSize="sm"
        isDisabled={requirementsCount === 0}
        opacity={requirementsCount === 0 ? 0.5 : 1}
      >
        <option value="all">All</option>
        <option value="any">Any</option>
      </Select>
      <Text color="color-white" fontSize="sm">
        requirements out of {Math.max(1, requirementsCount)}
      </Text>
    </HStack>
  );
}
