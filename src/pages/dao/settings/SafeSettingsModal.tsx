import { Box, Flex, Text } from '@chakra-ui/react';
import Divider from '../../../components/ui/utils/Divider';

export function SafeSettingsModal() {
  return (
    <>
      <Box>
        <Flex height="100px">
          <Text>Navigation tabs</Text>
          <Divider vertical />
          <Text>Content</Text>
        </Flex>
        <Divider />
        {/* Action Buttons */}
        <Text>Action Buttons</Text>
      </Box>
    </>
  );
}
