import {
  VStack,
  HStack,
  Text,
  Switch,
  Button,
  Box,
  Flex,
  Select,
  useDisclosure,
} from '@chakra-ui/react';
import { Plus, CheckCircle } from '@phosphor-icons/react';
import { useState } from 'react';
import { ContentBoxTight } from '../../../../components/ui/containers/ContentBox';
import { LabelComponent } from '../../../../components/ui/forms/InputComponent';
import { ModalBase } from '../../../../components/ui/modals/ModalBase';
import { TokenSaleFormValues } from '../types';

interface BuyerRequirement {
  id: string;
  type: 'token' | 'nft' | 'whitelist';
  name: string;
  description: string;
}

interface BuyerRequirementsFormProps {
  values: TokenSaleFormValues;
  setFieldValue: (field: string, value: any) => void;
}

export function BuyerRequirementsForm({}: BuyerRequirementsFormProps) {
  const [requireKYC, setRequireKYC] = useState(false);
  const [requirements, setRequirements] = useState<BuyerRequirement[]>([]);
  const [requirementMode, setRequirementMode] = useState<'all' | 'any'>('all');
  const { isOpen, onOpen, onClose } = useDisclosure();

  const handleAddRequirement = (type: 'token' | 'nft' | 'whitelist') => {
    const newRequirement: BuyerRequirement = {
      id: Date.now().toString(),
      type,
      name: type === 'token' ? 'Token' : type === 'nft' ? 'NFT' : 'Whitelist',
      description:
        type === 'token'
          ? 'Set an ERC-20 threshold'
          : type === 'nft'
            ? 'Set an ERC-721 or ERC-1155 threshold'
            : 'Specify a list of addresses',
    };
    setRequirements([...requirements, newRequirement]);
    onClose();
  };

  const hasOpenAccess = requirements.length === 0;

  return (
    <ContentBoxTight>
      <VStack
        spacing={8}
        align="stretch"
      >
        {/* KYC/KYB Section */}
        <VStack
          spacing={6}
          align="stretch"
        >
          <LabelComponent
            label="Require KYC/KYB"
            helper="Lorem Ipsum"
            isRequired={false}
            gridContainerProps={{
              templateColumns: '1fr auto',
              alignItems: 'center',
            }}
          >
            <Switch
              isChecked={requireKYC}
              onChange={e => setRequireKYC(e.target.checked)}
              colorScheme="purple"
              size="md"
            />
          </LabelComponent>
        </VStack>

        {/* Buyer Requirements Section */}
        <VStack
          spacing={6}
          align="stretch"
        >
          <LabelComponent
            label="Buyer Requirements"
            helper="Curate your available buyers by setting up a whitelist, KYC/KYB, ERC-20, or ERC-721 eligibility requirements for your sale."
            isRequired={false}
            gridContainerProps={{
              templateColumns: '1fr',
            }}
          >
            <Box />
          </LabelComponent>

          {/* Requirements List */}
          <VStack
            spacing={3}
            align="stretch"
          >
            <Box
              bg="color-neutral-900"
              borderRadius="lg"
              border="1px solid"
              borderColor="color-neutral-800"
              overflow="hidden"
            >
              {/* Open Access Row (always shown when no requirements) */}
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
                    <CheckCircle
                      size={16}
                      color="#5bc89c"
                      weight="fill"
                    />
                    <Text
                      color="color-white"
                      fontSize="sm"
                      fontWeight="medium"
                    >
                      Open Access
                    </Text>
                  </HStack>
                </Flex>
              )}

              {/* Requirements */}
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
                    <CheckCircle
                      size={16}
                      color="#5bc89c"
                      weight="fill"
                    />
                    <VStack
                      align="start"
                      spacing={0}
                    >
                      <Text
                        color="color-white"
                        fontSize="sm"
                        fontWeight="medium"
                      >
                        {requirement.name}
                      </Text>
                      <Text
                        color="color-neutral-400"
                        fontSize="xs"
                      >
                        {requirement.description}
                      </Text>
                    </VStack>
                  </HStack>
                </Flex>
              ))}

              {/* Add Requirement Button */}
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

            {/* Requirements Footer */}
            <HStack
              spacing={2}
              justify="center"
            >
              <Text
                color="color-white"
                fontSize="sm"
              >
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
                isDisabled={requirements.length === 0}
                opacity={requirements.length === 0 ? 0.5 : 1}
              >
                <option value="all">All</option>
                <option value="any">Any</option>
              </Select>
              <Text
                color="color-white"
                fontSize="sm"
              >
                requirements out of {Math.max(1, requirements.length)}
              </Text>
            </HStack>
          </VStack>
        </VStack>

        {/* Add Requirement Modal */}
        <ModalBase
          isOpen={isOpen}
          onClose={onClose}
          title="Add Requirement"
          size="md"
        >
          <VStack
            spacing={4}
            align="stretch"
          >
            {/* Token Option */}
            <Button
              variant="ghost"
              h="auto"
              p={4}
              justifyContent="flex-start"
              onClick={() => handleAddRequirement('token')}
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
                  {/* Token icon placeholder */}
                  <Box
                    w={4}
                    h={4}
                    bg="color-lilac-100"
                    borderRadius="full"
                  />
                </Box>
                <VStack
                  align="start"
                  spacing={0}
                >
                  <Text
                    color="color-white"
                    fontSize="sm"
                    fontWeight="medium"
                  >
                    Token
                  </Text>
                  <Text
                    color="color-neutral-400"
                    fontSize="sm"
                  >
                    Set an ERC-20 threshold
                  </Text>
                </VStack>
              </HStack>
            </Button>

            {/* NFT Option */}
            <Button
              variant="ghost"
              h="auto"
              p={4}
              justifyContent="flex-start"
              onClick={() => handleAddRequirement('nft')}
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
                  {/* NFT icon placeholder */}
                  <Box
                    w={3}
                    h={3}
                    bg="color-lilac-100"
                    borderRadius="sm"
                  />
                </Box>
                <VStack
                  align="start"
                  spacing={0}
                >
                  <Text
                    color="color-white"
                    fontSize="sm"
                    fontWeight="medium"
                  >
                    NFT
                  </Text>
                  <Text
                    color="color-neutral-400"
                    fontSize="sm"
                  >
                    Set an ERC-721 or ERC-1155 threshold
                  </Text>
                </VStack>
              </HStack>
            </Button>

            {/* Whitelist Option */}
            <Button
              variant="ghost"
              h="auto"
              p={4}
              justifyContent="flex-start"
              onClick={() => handleAddRequirement('whitelist')}
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
                  {/* Whitelist icon placeholder */}
                  <Box
                    w={4}
                    h={2}
                    bg="color-lilac-100"
                    borderRadius="xs"
                  />
                </Box>
                <VStack
                  align="start"
                  spacing={0}
                >
                  <Text
                    color="color-white"
                    fontSize="sm"
                    fontWeight="medium"
                  >
                    Whitelist
                  </Text>
                  <Text
                    color="color-neutral-400"
                    fontSize="sm"
                  >
                    Specify a list of addresses
                  </Text>
                </VStack>
              </HStack>
            </Button>
          </VStack>
        </ModalBase>
      </VStack>
    </ContentBoxTight>
  );
}
