import { Flex, Text } from '@chakra-ui/react';
import { SettingsNavigation } from '../../SafeSettings/SettingsNavigation';
import Divider from '../utils/Divider';

export function SafeSettingsModal() {
  return (
    <>
      <Flex flexDirection="column">
        <Flex
          flex="1"
          minHeight="1000px"
          height="100%"
          pl="1"
        >
          <SettingsNavigation />
          <Divider vertical />
          <Text>Content</Text>
        </Flex>
        <Divider />
        {/* Action Buttons */}
        <Text>Action Buttons</Text>
      </Flex>
    </>
  );
}
