import { Box, Button, Flex } from '@chakra-ui/react';
import { Formik, Form, useFormikContext } from 'formik';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useCurrentDAOKey } from '../../../hooks/DAO/useCurrentDAOKey';
import { useValidationAddress } from '../../../hooks/schemas/common/useValidationAddress';
import { useCanUserCreateProposal } from '../../../hooks/utils/useCanUserSubmitProposal';
import { SafeGeneralSettingsPage } from '../../../pages/dao/settings/general/SafeGeneralSettingsPage';
import { useStore } from '../../../providers/App/AppProvider';
import { BigIntValuePair } from '../../../types';
import { bigintSerializer } from '../../../utils/bigintSerializer';
import { validateENSName } from '../../../utils/url';
import { SettingsNavigation } from '../../SafeSettings/SettingsNavigation';
import { NewSignerItem } from '../../SafeSettings/Signers/SignersContainer';
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
    proposerThreshold?: BigIntValuePair;
  };
};

type MultisigEditGovernanceFormikErrors = {
  newSigners: { key: string; error: string }[];
  threshold: string;
};

type GeneralEditFormikErrors = {
  name: string;
  snapshot: string;
};

export type SafeSettingsFormikErrors = {
  multisig: MultisigEditGovernanceFormikErrors;
  general: GeneralEditFormikErrors;
};

export function SafeSettingsModal({
  closeModal,
  closeAllModals,
}: {
  closeModal: () => void;
  closeAllModals: () => void;
}) {
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

  function ActionButtons() {
    const { values } = useFormikContext<SafeSettingsEdits>();
    const { errors } = useFormikContext<SafeSettingsFormikErrors>();

    const hasEdits = Object.values(values).some(Boolean);
    const hasErrors =
      (errors.general && Object.values(errors.general).some(Boolean)) ||
      (errors.multisig && Object.values(errors.multisig).some(Boolean));

    return (
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
            isDisabled={!hasEdits || hasErrors}
          >
            {t('createProposal')}
          </Button>
        )}
      </Flex>
    );
  }

  return (
    <Formik<SafeSettingsEdits>
      initialValues={{}}
      validate={async values => {
        const errors: SafeSettingsFormikErrors = {
          multisig: {
            newSigners: [],
            threshold: '',
          },
          general: {
            name: '',
            snapshot: '',
          },
        };

        if (values.multisig) {
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
              errors.multisig.newSigners = signerErrors.filter(error => error !== null);
            }
          }

          if (signerThreshold && signerThreshold < 1) {
            errors.multisig.threshold = t('errorLowSignerThreshold', { ns: 'daoCreate' });
          }

          if (signerThreshold) {
            const totalResultingSigners =
              (safe?.owners?.length ?? 0) -
              (signersToRemove?.length ?? 0) +
              (newSigners?.length ?? 0);

            if (signerThreshold > totalResultingSigners) {
              errors.multisig.threshold = t('errorHighSignerThreshold', { ns: 'daoCreate' });
            }
          }
        }

        if (values.general) {
          const { snapshot } = values.general;
          if (snapshot && !validateENSName(snapshot)) {
            errors.general.snapshot = t('errorInvalidENSName', { ns: 'common' });
          }
        }

        return errors;
      }}
      onSubmit={values => {
        toast.info(`Submit TBD: ${JSON.stringify(values, bigintSerializer)}`);
        closeAllModals();
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
          <ActionButtons />
        </Box>
      </Form>
    </Formik>
  );
}
