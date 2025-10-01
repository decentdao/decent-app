import { Input, InputProps } from '@chakra-ui/react';

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
    <Input
      type="time"
      value={value || ''}
      onChange={handleChange}
      disabled={disabled}
      placeholder={placeholder}
      {...props}
    />
  );
}
