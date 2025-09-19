import { HStack, Text, Select } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';

interface RequirementsFooterProps {
  requirementMode: 'all' | number;
  setRequirementMode: (mode: 'all' | number) => void;
  requirementsCount: number;
}

export function RequirementsFooter({
  requirementMode,
  setRequirementMode,
  requirementsCount,
}: RequirementsFooterProps) {
  const { t } = useTranslation('tokenSale');
  
  // Generate number options from 1 to requirementsCount - 1
  const numberOptions = Array.from({ length: Math.max(0, requirementsCount - 1) }, (_, i) => i + 1);
  
  return (
    <HStack
      spacing={2}
      justify="center"
    >
      <Text
        color="color-white"
        fontSize="sm"
      >
        {t('requirementShouldMeet')}
      </Text>
      <Select
        value={requirementMode}
        onChange={e => {
          const value = e.target.value;
          setRequirementMode(value === 'all' ? 'all' : parseInt(value, 10));
        }}
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
        <option value="all">{t('requirementAllOption')}</option>
        {numberOptions.map(num => (
          <option key={num} value={num}>
            {num}
          </option>
        ))}
      </Select>
      <Text
        color="color-white"
        fontSize="sm"
      >
        {t('requirementOutOfText')} {requirementsCount}
      </Text>
    </HStack>
  );
}
