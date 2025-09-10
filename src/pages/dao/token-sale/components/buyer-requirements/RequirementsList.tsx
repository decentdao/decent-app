import { VStack, Box, Flex, HStack, Text, Button, Icon } from '@chakra-ui/react';
import { CheckCircle, Plus } from '@phosphor-icons/react';
import { BuyerRequirement } from './types';

interface RequirementsListProps {
  requirements: BuyerRequirement[];
  onOpen: () => void;
}

export function RequirementsList({ requirements, onOpen }: RequirementsListProps) {
  const hasOpenAccess = requirements.length === 0;

  return (
    <VStack spacing={3} align="stretch">
      <Box
        bg="color-neutral-900"
        borderRadius="lg"
        border="1px solid"
        borderColor="color-neutral-800"
        overflow="hidden"
      >
        {hasOpenAccess && (
          <Flex
            align="center"
            justify="space-between"
            p={4}
            bg="color-neutral-900"
            borderBottom={requirements.length > 0 ? '1px solid' : 'none'}
            borderBottomColor="color-neutral-800"
          >
            <HStack spacing={3}>
              <Icon as={CheckCircle} boxSize="1.5rem" color="color-base-success" />
              <Text color="color-white" fontSize="sm" fontWeight="medium">
                Open Access
              </Text>
            </HStack>
          </Flex>
        )}

        {requirements.map(requirement => (
          <Flex
            key={requirement.id}
            align="center"
            justify="space-between"
            p={4}
            borderBottom="1px solid"
            borderBottomColor="color-neutral-800"
            _last={{ borderBottom: 'none' }}
          >
            <HStack spacing={3}>
              <CheckCircle size={16} color="#5bc89c" weight="fill" />
              <VStack align="start" spacing={0}>
                <Text color="color-white" fontSize="sm" fontWeight="medium">
                  {requirement.name}
                </Text>
                <Text color="color-neutral-400" fontSize="xs">
                  {requirement.description}
                </Text>
              </VStack>
            </HStack>
          </Flex>
        ))}

        <Button
          variant="ghost"
          leftIcon={<Plus size={16} />}
          onClick={onOpen}
          w="full"
          justifyContent="flex-start"
          p={4}
          h="auto"
          color="color-white"
          fontSize="sm"
          fontWeight="normal"
          _hover={{ bg: 'color-neutral-800' }}
        >
          Add Requirement
        </Button>
      </Box>
    </VStack>
  );
}
