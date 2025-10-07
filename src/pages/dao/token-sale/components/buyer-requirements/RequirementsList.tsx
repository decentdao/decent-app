import { VStack, Box, Flex, HStack, Text, Button, Icon, IconButton } from '@chakra-ui/react';
import { CheckCircle, Plus, PencilSimple, Trash } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { BuyerRequirement } from '../../../../../types/tokenSale';
import { useRequirementDisplay } from './RequirementDisplay';

interface RequirementsListProps {
  requirements: BuyerRequirement[];
  onAddRequirement: () => void;
  onEditRequirement: (requirement: BuyerRequirement, index: number) => void;
  onRemoveRequirement: (index: number) => void;
}

export function RequirementsList({
  requirements,
  onAddRequirement,
  onEditRequirement,
  onRemoveRequirement,
}: RequirementsListProps) {
  const { t } = useTranslation('tokenSale');
  const { getRequirementDisplay } = useRequirementDisplay();
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
          const displayText = getRequirementDisplay(requirement);
          return (
            <Flex
              key={`requirement-${index}`}
              align="center"
              justify="space-between"
              p={4}
              borderBottom="1px solid"
              borderBottomColor="color-neutral-800"
              _last={{ borderBottom: 'none' }}
            >
              <HStack spacing={3}>
                <Icon
                  as={CheckCircle}
                  boxSize="1rem"
                  color="color-base-success"
                />
                <Text
                  color="color-white"
                  fontSize="sm"
                  fontWeight="medium"
                >
                  {displayText}
                </Text>
              </HStack>
              <HStack spacing={2}>
                <IconButton
                  aria-label={t('editRequirement')}
                  icon={<PencilSimple size="1rem" />}
                  variant="ghost"
                  size="sm"
                  color="color-neutral-400"
                  _hover={{ color: 'color-white', bg: 'color-neutral-800' }}
                  onClick={() => onEditRequirement(requirement, index)}
                />
                <IconButton
                  aria-label={t('removeRequirement')}
                  icon={<Trash size="1rem" />}
                  variant="ghost"
                  size="sm"
                  color="color-neutral-400"
                  _hover={{ color: 'color-base-error', bg: 'color-neutral-800' }}
                  onClick={() => onRemoveRequirement(index)}
                />
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
