import { Box, Flex, Radio, Text } from '@chakra-ui/react';
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
    <Flex
      alignItems="start"
      onClick={!disabled ? onClick : undefined}
    >
      <Radio
        data-testid={testId}
        type="radio"
        isDisabled={disabled}
        bg="color-black"
        color="color-lilac-600"
        _disabled={{ bg: 'color-neutral-400', color: 'color-neutral-700' }}
        _hover={!disabled ? { bg: 'color-black', color: 'color-lilac-800' } : undefined}
        _checked={{
          bg: 'color-black',
          color: 'color-lilac-600',
          borderWidth: '6px',
        }}
        alignItems="start"
        size="lg"
        value={value}
      >
        <Box
          ml="0.25rem"
          mt="-0.25rem"
        >
          <Text color={disabled ? 'color-neutral-700' : 'color-white'}>{label}</Text>
          {tooltip && (
            <SupportTooltip
              label={tooltip}
              closeDelay={1000}
              pointerEvents="all"
              color="color-lilac-100"
            />
          )}
          <Text color={disabled ? 'color-neutral-700' : 'color-neutral-300'}>{description}</Text>
        </Box>
      </Radio>
    </Flex>
  );
}
