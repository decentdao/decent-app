import { Input, InputGroup, InputLeftElement, InputProps, Icon, Flex, Box } from '@chakra-ui/react';
import { Clock } from '@phosphor-icons/react';

interface TimeInputProps extends Omit<InputProps, 'type' | 'value' | 'onChange'> {
  value?: string; // Format: "HH:MM" (24-hour)
  onChange: (time: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function TimeInput({
  value,
  onChange,
  disabled = false,
  placeholder = '09:00',
  ...props
}: TimeInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <InputGroup>
      <InputLeftElement 
        cursor={disabled ? 'not-allowed' : 'pointer'}
        onClick={() => {
          if (!disabled) {
            // Focus the input to trigger the native time picker
            const input = document.querySelector('input[type="time"]') as HTMLInputElement;
            input?.focus();
            input?.showPicker?.();
          }
        }}
      >
        <Flex
          align="center"
          h="100%"
          pl={3}
          pr={3}
          mb="-1px"
        >
          <Icon
            as={Clock}
            color="color-content-muted-foreground"
            boxSize="24px"
          />
        </Flex>
      </InputLeftElement>
      <Box position="relative" flex="1">
        <Input
          type="time"
          value={value || ''}
          onChange={handleChange}
          disabled={disabled}
          placeholder={placeholder}
          pl="2.5rem" // Add left padding to make room for the icon
          sx={{
            // Hide the native time picker button/icon on the right
            '&::-webkit-calendar-picker-indicator': {
              display: 'none',
            },
            '&::-webkit-inner-spin-button': {
              display: 'none',
            },
            '&::-webkit-clear-button': {
              display: 'none',
            },
          }}
          {...props}
        />
      </Box>
    </InputGroup>
  );
}
