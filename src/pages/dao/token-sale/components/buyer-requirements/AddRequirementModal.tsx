import { VStack, HStack, Text, Button, Box } from '@chakra-ui/react';
import { ModalBase } from '../../../../../components/ui/modals/ModalBase';

interface AddRequirementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddRequirement: (type: 'token' | 'nft' | 'whitelist') => void;
}

export function AddRequirementModal({ isOpen, onClose, onAddRequirement }: AddRequirementModalProps) {
  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title="Add Requirement" size="md">
      <VStack spacing={4} align="stretch">
        <Button
          variant="ghost"
          h="auto"
          p={4}
          justifyContent="flex-start"
          onClick={() => onAddRequirement('token')}
          bg="rgba(255, 255, 255, 0.05)"
          border="1px solid"
          borderColor="color-neutral-800"
          borderRadius="lg"
          _hover={{ bg: 'rgba(255, 255, 255, 0.1)' }}
        >
          <HStack spacing={3}>
            <Box
              w={6}
              h={6}
              bg="color-neutral-800"
              borderRadius="sm"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Box w={4} h={4} bg="color-lilac-100" borderRadius="full" />
            </Box>
            <VStack align="start" spacing={0}>
              <Text color="color-white" fontSize="sm" fontWeight="medium">
                Token
              </Text>
              <Text color="color-neutral-400" fontSize="sm">
                Set an ERC-20 threshold
              </Text>
            </VStack>
          </HStack>
        </Button>

        <Button
          variant="ghost"
          h="auto"
          p={4}
          justifyContent="flex-start"
          onClick={() => onAddRequirement('nft')}
          bg="rgba(255, 255, 255, 0.05)"
          border="1px solid"
          borderColor="color-neutral-800"
          borderRadius="lg"
          _hover={{ bg: 'rgba(255, 255, 255, 0.1)' }}
        >
          <HStack spacing={3}>
            <Box
              w={6}
              h={6}
              bg="color-neutral-800"
              borderRadius="sm"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Box w={3} h={3} bg="color-lilac-100" borderRadius="sm" />
            </Box>
            <VStack align="start" spacing={0}>
              <Text color="color-white" fontSize="sm" fontWeight="medium">
                NFT
              </Text>
              <Text color="color-neutral-400" fontSize="sm">
                Set an ERC-721 or ERC-1155 threshold
              </Text>
            </VStack>
          </HStack>
        </Button>

        <Button
          variant="ghost"
          h="auto"
          p={4}
          justifyContent="flex-start"
          onClick={() => onAddRequirement('whitelist')}
          bg="rgba(255, 255, 255, 0.05)"
          border="1px solid"
          borderColor="color-neutral-800"
          borderRadius="lg"
          _hover={{ bg: 'rgba(255, 255, 255, 0.1)' }}
        >
          <HStack spacing={3}>
            <Box
              w={6}
              h={6}
              bg="color-neutral-800"
              borderRadius="sm"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Box w={4} h={2} bg="color-lilac-100" borderRadius="xs" />
            </Box>
            <VStack align="start" spacing={0}>
              <Text color="color-white" fontSize="sm" fontWeight="medium">
                Whitelist
              </Text>
              <Text color="color-neutral-400" fontSize="sm">
                Specify a list of addresses
              </Text>
            </VStack>
          </HStack>
        </Button>
      </VStack>
    </ModalBase>
  );
}
