import { Box, Button, Flex } from '@chakra-ui/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCanUserCreateProposal } from '../../../hooks/utils/useCanUserSubmitProposal';
import { SafeGeneralSettingsPage } from '../../../pages/dao/settings/general/SafeGeneralSettingsPage';
import { SettingsNavigation } from '../../SafeSettings/SettingsNavigation';
import Divider from '../utils/Divider';

export function SafeSettingsModal({ closeModal }: { closeModal: () => void }) {
  const [settingsContent, setSettingsContent] = useState(<SafeGeneralSettingsPage />);

  const handleSettingsNavigationClick = (content: JSX.Element) => {
    setSettingsContent(content);
  };

  const { canUserCreateProposal } = useCanUserCreateProposal();

  const { t } = useTranslation(['modals', 'common']);

  return (
    <>
      <Box
        flexDirection="column"
        height="85vh"
      >
        <Flex
          flex="1"
          height="100%"
          pl="1"
        >
          <SettingsNavigation onSettingsNavigationClick={handleSettingsNavigationClick} />
          <Divider vertical />
          {settingsContent}
        </Flex>
        <Divider />
        {/* Action Buttons */}
        <Flex
          flexDirection="row"
          justifyContent="flex-end"
          mt="1rem"
          mr={4}
          alignItems="center"
          alignSelf="center"
          alignContent="center"
          gap="0.5rem"
        >
          <Button
            variant="tertiary"
            size="sm"
            px="2rem"
            onClick={closeModal}
          >
            {t('discardChanges', { ns: 'common' })}
          </Button>
          {canUserCreateProposal && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                console.log('go to builder');
              }}
            >
              {t('createProposal')}
            </Button>
          )}
        </Flex>
      </Box>
    </>
  );
}
