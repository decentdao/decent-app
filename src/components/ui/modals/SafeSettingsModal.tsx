import { Box, Button, Flex } from '@chakra-ui/react';
import { Formik, Form } from 'formik';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useValidationAddress } from '../../../hooks/schemas/common/useValidationAddress';
import { useCanUserCreateProposal } from '../../../hooks/utils/useCanUserSubmitProposal';
import { SafeGeneralSettingsPage } from '../../../pages/dao/settings/general/SafeGeneralSettingsPage';
import { SettingsNavigation } from '../../SafeSettings/SettingsNavigation';
import { NewSignerFormikErrors, NewSignerItem } from '../../SafeSettings/Signers/SignersContainer';
import Divider from '../utils/Divider';

export type SafeSettingsEdits = {
  multisig?: {
    newSigners?: NewSignerItem[];
    removedSigners?: string[];
    signerThreshold?: number;
  };
};

export function SafeSettingsModal({ closeModal }: { closeModal: () => void }) {
  const [settingsContent, setSettingsContent] = useState(<SafeGeneralSettingsPage />);

  const handleSettingsNavigationClick = (content: JSX.Element) => {
    setSettingsContent(content);
  };

  const { canUserCreateProposal } = useCanUserCreateProposal();

  const { t } = useTranslation(['modals', 'common']);

  const { validateAddress } = useValidationAddress();

  return (
    <Formik<SafeSettingsEdits>
      initialValues={{}}
      validate={async values => {
        if (values.multisig) {
          console.log('values.multisig', values.multisig);
          const errors: NewSignerFormikErrors = {};
          const { newSigners, signerThreshold } = values.multisig;

          if (!newSigners) {
            return errors;
          }

          if (newSigners.length > 0) {
            const signerErrors = await Promise.all(
              newSigners.map(async signer => {
                if (!signer.inputValue) {
                  return { key: signer.key, error: t('addressRequired', { ns: 'common' }) };
                }

                const validation = await validateAddress({ address: signer.inputValue });
                if (!validation.validation.isValidAddress) {
                  return { key: signer.key, error: t('invalidAddress', { ns: 'common' }) };
                }
                return null;
              }),
            );

            if (signerErrors.some(error => error !== null)) {
              errors.newSigners = signerErrors.filter(error => error !== null);
            }
          }

          return errors;
        }
      }}
      onSubmit={() => {
        // Close all modals, navigate to create proposal page with all prepared actions
      }}
    >
      <Form>
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
      </Form>
    </Formik>
  );
}
