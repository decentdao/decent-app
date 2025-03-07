import { Box, Flex, Icon, Text } from '@chakra-ui/react';
import { WarningCircle } from '@phosphor-icons/react';
import { INotice } from './Interfaces';

export function Notice({ id, label }: INotice) {
  return (
    <Box
      id={id}
      p="1rem"
      bg="neutral-3"
      borderRadius="0.75rem"
    >
      <Flex alignItems="center">
        <Icon
          as={WarningCircle}
          color="lilac-0"
          width="1.5rem"
          height="1.5rem"
        />
        <Text
          color="lilac-0"
          marginLeft="1rem"
        >
          {label}
        </Text>
      </Flex>
    </Box>
  );
}
