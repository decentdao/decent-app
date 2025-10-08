import { Box, Flex, Icon, Text } from '@chakra-ui/react';
import { Question } from '@phosphor-icons/react';
import { DecentTooltip } from '../DecentTooltip';

interface SectionHeaderProps {
  title: string;
  description: string;
  tooltip?: string;
  mb?: number | string;
}

export function SectionHeader({ title, description, tooltip, mb = 6 }: SectionHeaderProps) {
  return (
    <Box mb={mb}>
      <Flex gap="0.5">
        <Text
          color="color-layout-foreground"
          textStyle="text-lg-medium"
          mb={1}
        >
          {title}
        </Text>
        {tooltip && (
          <DecentTooltip label={tooltip}>
            <Icon
              mt="4px"
              as={Question}
              boxSize="1rem"
              color="color-content-muted"
            />
          </DecentTooltip>
        )}
      </Flex>
      <Text
        textStyle="text-sm-regular"
        color="color-content-muted"
      >
        {description}
      </Text>
    </Box>
  );
}
