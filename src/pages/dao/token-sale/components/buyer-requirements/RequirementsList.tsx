import { VStack, Box, Flex, HStack, Text, Button, Icon } from '@chakra-ui/react';
import { CheckCircle, Plus } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { BuyerRequirement } from '../../../../../types/tokenSale';

interface RequirementsListProps {
  requirements: BuyerRequirement[];
  onAddRequirement: () => void;
}

const getRequirementDisplay = (requirement: BuyerRequirement, index: number) => {
  switch (requirement.type) {
    case 'token':
      return {
        id: `token-${index}`,
        name: requirement.tokenName || `Token ${requirement.tokenAddress.slice(0, 6)}...`,
        description: `Minimum balance: ${requirement.minimumBalance.toString()}`,
      };
    case 'nft':
      return {
        id: `nft-${index}`,
        name: requirement.collectionName || `${requirement.tokenStandard} Collection`,
        description: `Minimum balance: ${requirement.minimumBalance.toString()}`,
      };
    case 'whitelist':
      return {
        id: `whitelist-${index}`,
        name: requirement.name,
        description: `${requirement.addresses.length} addresses`,
      };
  }
};

export function RequirementsList({ requirements, onAddRequirement }: RequirementsListProps) {
  const { t } = useTranslation('tokenSale');
  const hasOpenAccess = requirements.length === 0;

  return (
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
              <Icon
                as={CheckCircle}
                boxSize="1.5rem"
                color="color-base-success"
              />
              <Text
                color="color-white"
                fontSize="sm"
                fontWeight="medium"
              >
                {t('openAccess')}
              </Text>
            </HStack>
          </Flex>
        )}

        {requirements.map((requirement, index) => {
          const display = getRequirementDisplay(requirement, index);
          return (
            <Flex
              key={display.id}
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
                    {display.name}
                  </Text>
                  <Text
                    color="color-neutral-400"
                    fontSize="xs"
                  >
                    {display.description}
                  </Text>
                </VStack>
              </HStack>
            </Flex>
          );
        })}

        <Button
          variant="ghost"
          leftIcon={<Plus size="1.5rem" />}
          onClick={onAddRequirement}
          w="full"
          justifyContent="flex-start"
          p={4}
          h="auto"
          color="color-white"
          borderTopRadius="0"
          _hover={{ bg: 'color-neutral-800' }}
        >
          {t('addRequirementButton')}
        </Button>
      </Box>
    </VStack>
  );
}
