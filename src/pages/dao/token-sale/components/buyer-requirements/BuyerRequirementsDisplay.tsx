import { Box, VStack, Flex, Text, Icon } from '@chakra-ui/react';
import { CheckCircle } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { BuyerRequirement } from '../../../../../types/tokenSale';
import { useRequirementDisplay } from './RequirementDisplay';

interface BuyerRequirementsDisplayProps {
  requirements?: BuyerRequirement[];
  orOutOf?: number;
}

export function BuyerRequirementsDisplay({ requirements, orOutOf }: BuyerRequirementsDisplayProps) {
  const { t } = useTranslation('tokenSale');
  const { getRequirementDisplay } = useRequirementDisplay();

  // Filter out invalid requirements
  const validRequirements =
    requirements?.filter(requirement => {
      const display = getRequirementDisplay(requirement);
      return display && display.trim() !== '';
    }) || [];

  const totalRequirements = validRequirements.length;
  // Ensure requirementsToMeet doesn't exceed actual total requirements
  const requirementsToMeet = orOutOf ? Math.min(orOutOf, totalRequirements) : totalRequirements;

  // If no requirements, show open access
  if (totalRequirements === 0) {
    return (
      <Box
        border="1px solid"
        borderColor="color-layout-border-10"
        borderRadius="12px"
        p={3}
      >
        <Flex
          align="center"
          justify="space-between"
        >
          <Text
            textStyle="text-sm-regular"
            color="color-content-muted"
          >
            {t('openAccess')}
          </Text>
          <Icon
            as={CheckCircle}
            color="color-base-success"
            boxSize={4}
          />
        </Flex>
      </Box>
    );
  }

  return (
    <Box
      border="1px solid"
      borderColor="color-layout-border-10"
      borderRadius="12px"
      p={3}
    >
      <VStack
        spacing={2}
        align="stretch"
      >
        <Text
          textStyle="text-sm-regular"
          color="color-content-content1-foreground"
        >
          {requirementsToMeet === totalRequirements
            ? t('buyerRequirementsDescriptionAll', { total: totalRequirements })
            : `${t('requirementShouldMeet')} ${requirementsToMeet} ${t('requirementOutOfText')} ${totalRequirements}`}
        </Text>

        {/* Other Requirements */}
        {validRequirements.map((requirement, index) => (
          <Flex
            key={`requirement-${index}`}
            justify="space-between"
            align="center"
          >
            <Text
              textStyle="text-sm-regular"
              color="color-content-muted"
            >
              {getRequirementDisplay(requirement)}
            </Text>
            <Icon
              as={CheckCircle}
              color="color-base-success"
              boxSize={4}
            />
          </Flex>
        ))}
      </VStack>
    </Box>
  );
}
