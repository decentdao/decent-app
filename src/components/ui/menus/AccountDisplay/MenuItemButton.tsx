import { Box, Button, MenuItem, Text } from '@chakra-ui/react';

/**
 * Used to display a simple clickable item to the menu.
 * This will contain a label to the left and the given icon on the right
 */
export function MenuItemButton({
  label,
  Icon,
  testId,
  onClick,
}: {
  testId: string;
  label: string;
  Icon: any;
  onClick?: () => void;
}) {
  return (
    <Box mx="0.25rem">
      <MenuItem
        as={Button}
        borderRadius="0.75rem"
        variant="tertiary"
        cursor="pointer"
        data-testid={testId}
        onClick={onClick}
        h="3rem"
        justifyContent="space-between"
        rightIcon={<Icon size="1.5rem" />}
      >
        <Text textStyle="text-lg-regular">{label}</Text>
      </MenuItem>
    </Box>
  );
}
