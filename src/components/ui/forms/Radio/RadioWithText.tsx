import { Box, HStack, Radio, Text } from '@chakra-ui/react';
import SupportTooltip from '../../badges/SupportTooltip';

interface IRadioWithText {
  description: string;
  testId: string;
  label: string;
  value?: any;
  disabled?: boolean;
  onClick?: () => void;
  tooltip?: React.ReactNode;
}

export function RadioWithText({
  testId,
  description,
  label,
  disabled,
  value,
  onClick,
  tooltip,
}: IRadioWithText) {
  return (
    <Box onClick={onClick}>
      <Radio
        display="flex"
        data-testid={testId}
        type="radio"
        isDisabled={disabled}
        bg="color-black"
        color="lilac--3"
        _disabled={{ bg: 'neutral-6', color: 'neutral-5' }}
        _hover={{ bg: 'color-black', color: 'lilac--4' }}
        _checked={{
          bg: 'color-black',
          color: 'lilac--3',
          borderWidth: '6px',
        }}
        size="lg"
        value={value}
      >
        <Box
          p="0.5rem 0"
          ml="0.25rem"
        >
          <HStack>
            <Text color={disabled ? 'neutral-5' : 'white-0'}>{label}</Text>
            {tooltip && (
              <SupportTooltip
                label={tooltip}
                closeDelay={1000}
                pointerEvents="all"
                color="lilac-0"
              />
            )}
          </HStack>
          <Text color={disabled ? 'neutral-5' : 'neutral-7'}>{description}</Text>
        </Box>
      </Radio>
    </Box>
  );
}
