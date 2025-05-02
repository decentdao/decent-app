import { Flex, Text } from '@chakra-ui/react';
import { useState } from 'react';
import { SafeGeneralSettingsPage } from '../../../pages/dao/settings/general/SafeGeneralSettingsPage';
import { SettingsNavigation } from '../../SafeSettings/SettingsNavigation';
import Divider from '../utils/Divider';

export function SafeSettingsModal() {
  const [settingsContent, setSettingsContent] = useState(<SafeGeneralSettingsPage />);

  const handleSettingsNavigationClick = (content: JSX.Element) => {
    setSettingsContent(content);
  };

  return (
    <>
      <Flex flexDirection="column">
        <Flex
          flex="1"
          minHeight="1000px"
          height="100%"
          pl="1"
        >
          <SettingsNavigation onSettingsNavigationClick={handleSettingsNavigationClick} />
          <Divider vertical />
          {settingsContent}
        </Flex>
        <Divider />
        {/* Action Buttons */}
        <Text>Action Buttons</Text>
      </Flex>
    </>
  );
}
