import { Box, Button, Flex } from '@chakra-ui/react';
import { Formik, Form } from 'formik';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import useFeatureFlag from '../../../helpers/environmentFeatureFlags';
import { useCurrentDAOKey } from '../../../hooks/DAO/useCurrentDAOKey';
import { useValidationAddress } from '../../../hooks/schemas/common/useValidationAddress';
import { useCanUserCreateProposal } from '../../../hooks/utils/useCanUserSubmitProposal';
import { SafeGeneralSettingsPage } from '../../../pages/dao/settings/general/SafeGeneralSettingsPage';
import { useStore } from '../../../providers/App/AppProvider';
import { SettingsNavigation } from '../../SafeSettings/SettingsNavigation';
import {
  MultisigEditGovernanceFormikErrors,
  NewSignerItem,
} from '../../SafeSettings/Signers/SignersContainer';
import Divider from '../utils/Divider';

export type SafeSettingsEdits = {
  multisig?: {
    newSigners?: NewSignerItem[];
    signersToRemove?: string[];
    signerThreshold?: number;
  };
  azorius?: {
    quorumPercentage?: bigint;
    quorumThreshold?: bigint;
    votingPeriod?: bigint;
    timelockPeriod?: bigint;
    executionPeriod?: bigint;
  };
  general?: {
    name?: string;
    snapshot?: string;
    sponsoredVoting?: boolean;
  };
  permissions?: {
    guard?: string;
    modules?: string[];
  };
};

export function SafeSettingsModal({ closeModal }: { closeModal: () => void }) {
  const { daoKey } = useCurrentDAOKey();

  const {
    node: { safe },
  } = useStore({ daoKey });

  const [settingsContent, setSettingsContent] = useState(<SafeGeneralSettingsPage />);

  const handleSettingsNavigationClick = (content: JSX.Element) => {
    setSettingsContent(content);
  };

  const { canUserCreateProposal } = useCanUserCreateProposal();

  const { t } = useTranslation(['modals', 'common']);

  const { validateAddress } = useValidationAddress();

  const settingsV1FeatureEnabled = useFeatureFlag('flag_settings_v1');

  return (
    <Formik<SafeSettingsEdits>
      initialValues={{}}
      validate={async values => {
        if (values.multisig) {
          const errors: MultisigEditGovernanceFormikErrors = {};
          const { newSigners, signerThreshold, signersToRemove } = values.multisig;

          if (newSigners && newSigners.length > 0) {
            const signerErrors = await Promise.all(
              newSigners.map(async signer => {
                if (!signer.inputValue) {
                  return { key: signer.key, error: t('addressRequired', { ns: 'common' }) };
                }

                const validation = await validateAddress({ address: signer.inputValue });
                if (!validation.validation.isValidAddress) {
                  return { key: signer.key, error: t('errorInvalidAddress', { ns: 'common' }) };
                }
                return null;
              }),
            );

            if (signerErrors.some(error => error !== null)) {
              errors.newSigners = signerErrors.filter(error => error !== null);
            }
          }

          if (signerThreshold && signerThreshold < 1) {
            errors.threshold = t('errorLowSignerThreshold', { ns: 'daoCreate' });
          }

          if (signerThreshold) {
            const totalResultingSigners =
              (safe?.owners?.length ?? 0) -
              (signersToRemove?.length ?? 0) +
              (newSigners?.length ?? 0);

            if (signerThreshold > totalResultingSigners) {
              errors.threshold = t('errorHighSignerThreshold', { ns: 'daoCreate' });
            }
          }

          return errors;
        }
      }}
      onSubmit={values => {
        console.log('submit values', values);
        if (settingsV1FeatureEnabled) {
          toast.info(`Submit TBD: ${JSON.stringify(values)}`);
        }
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
                type="submit"
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
