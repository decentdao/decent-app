import { Flex, Icon, Text } from '@chakra-ui/react';
import { CalendarBlank } from '@phosphor-icons/react';
import { format } from 'date-fns';
import { t } from 'i18next';
import { DISABLED_INPUT } from '../../../constants/common';
import { DEFAULT_DATE_FORMAT } from '../../../utils';

interface DatePickerTriggerProps {
  selectedDate: Date | undefined;
  disabled: boolean;
}

export function DatePickerTrigger({ selectedDate, disabled }: DatePickerTriggerProps) {
  const selectedDateStr = selectedDate && format(selectedDate, DEFAULT_DATE_FORMAT);

  return (
    <Flex
      borderRadius="0.25rem"
      bg={disabled ? DISABLED_INPUT : 'neutral-1'}
      borderWidth="1px"
      borderColor={disabled ? 'white-alpha-16' : 'neutral-3'}
      padding="0.5rem 1rem"
      alignItems="center"
      minW={{ base: 'full', md: '10rem' }}
      gap="0.5rem"
      cursor={disabled ? 'not-allowed' : 'pointer'}
    >
      <Icon
        as={CalendarBlank}
        boxSize="24px"
        color="neutral-5"
      />
      <Text color={disabled ? 'neutral-7' : undefined}>{selectedDateStr ?? t('select')}</Text>
    </Flex>
  );
}
