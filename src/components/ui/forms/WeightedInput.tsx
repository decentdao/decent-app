import { IconButton, Flex, Input, Text } from '@chakra-ui/react';
import { AddPlus } from '../../../assets/theme/custom/icons/AddPlus';
import { Minus } from '../../../assets/theme/custom/icons/Minus';

interface IWeightedInput {
  onChange: (value: number) => void;
  label: string;
  value: number;
  totalValue: number;
}

export default function WeightedInput({ label, value, totalValue, onChange }: IWeightedInput) {
  return (
    <Flex
      color="color-lilac-100"
      bg="color-neutral-900"
      borderRadius="0.5rem"
      mt={4}
      mb={4}
      py={1}
      px={4}
    >
      <Flex
        width="50%"
        alignItems="center"
      >
        <Text>{label}</Text>
      </Flex>
      <Flex
        width="50%"
        alignItems="center"
        justifyContent="space-between"
      >
        <IconButton
          aria-label={`Reduce vote weight for ${label}`}
          p={1}
          minW="24px"
          h="24px"
          variant="secondary"
          border="none"
          bg="color-neutral-950"
          onClick={() => onChange(Math.max(0, value - 1))}
          isDisabled={!value}
        >
          <Minus />
        </IconButton>
        <Input
          onChange={e => onChange(Math.max(parseInt(e.target.value), 0))}
          value={value.toString()}
          type="number"
          border="none"
          bg="transparent"
          padding={0}
          textAlign="center"
          color="color-lilac-100"
          width="48px"
        />
        <IconButton
          aria-label={`Increase vote weight for ${label}`}
          p={1}
          minW="24px"
          h="24px"
          variant="secondary"
          border="none"
          bg="color-neutral-950"
          onClick={() => onChange(value + 1)}
          mr={3}
        >
          <AddPlus />
        </IconButton>
        <Text>{totalValue ? ((value * 100) / totalValue).toFixed(2) : 0}%</Text>
      </Flex>
    </Flex>
  );
}
