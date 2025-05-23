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
        color="color-lilac-600"
        _disabled={{ bg: 'color-neutral-400', color: 'color-neutral-700' }}
        _hover={{ bg: 'color-black', color: 'color-lilac-800' }}
        _checked={{
          bg: 'color-black',
          color: 'color-lilac-600',
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
            <Text color={disabled ? 'color-neutral-700' : 'white-0'}>{label}</Text>
            {tooltip && (
              <SupportTooltip
                label={tooltip}
                closeDelay={1000}
                pointerEvents="all"
                color="color-lilac-100"
              />
            )}
          </HStack>
          <Text color={disabled ? 'color-neutral-700' : 'neutral-7'}>{description}</Text>
        </Box>
      </Radio>
    </Box>
  );
}
