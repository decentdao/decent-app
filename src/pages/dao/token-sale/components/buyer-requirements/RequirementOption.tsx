import { Button, HStack, VStack, Text, Icon } from '@chakra-ui/react';
import { IconProps } from '@phosphor-icons/react';

interface RequirementOptionProps {
  icon: React.ComponentType<IconProps>;
  title: string;
  description: string;
  onClick: () => void;
}

export function RequirementOption({ icon, title, description, onClick }: RequirementOptionProps) {
  return (
    <Button
      variant="ghost"
      h="auto"
      p={4}
      justifyContent="flex-start"
      onClick={onClick}
      bg="rgba(255, 255, 255, 0.05)"
      border="1px solid"
      borderColor="color-neutral-800"
      borderRadius="lg"
      _hover={{ bg: "rgba(255, 255, 255, 0.1)" }}
      w="full"
    >
      <HStack spacing={3} align="center">
        <Icon
          as={icon}
          boxSize={6}
          color="color-lilac-100"
        />
        <VStack align="start" spacing={0}>
          <Text
            color="color-white"
            textStyle="text-sm-leading-none-medium"
          >
            {title}
          </Text>
          <Text
            color="color-neutral-400"
            textStyle="text-sm-regular"
          >
            {description}
          </Text>
        </VStack>
      </HStack>
    </Button>
  );
}
