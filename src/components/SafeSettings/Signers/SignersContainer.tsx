import { Box, Button, Flex, Icon, Input, Show, Text, Image } from '@chakra-ui/react';
import { MinusCircle, PlusCircle } from '@phosphor-icons/react';
import { useFormik } from 'formik';
import { useEffect, useMemo, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Address } from 'viem';
import { useAccount } from 'wagmi';
import useFeatureFlag from '../../../helpers/environmentFeatureFlags';
import { useCurrentDAOKey } from '../../../hooks/DAO/useCurrentDAOKey';
import { useValidationAddress } from '../../../hooks/schemas/common/useValidationAddress';
import { useStore } from '../../../providers/App/AppProvider';
import { NumberStepperInput } from '../../ui/forms/NumberStepperInput';
import { ModalType } from '../../ui/modals/ModalProvider';
import { useDecentModal } from '../../ui/modals/useDecentModal';
import Divider from '../../ui/utils/Divider';

type SignerItem = {
  key: string;
  address?: Address;
  isAdding: boolean;
};

type ExistingSignerItem = SignerItem & {
  address: Address;
  isAdding: false;
};

type NewSignerItem = SignerItem & {
  isAdding: true;
  inputValue: string;
};

type NewSignerFormikErrors = { newSigners?: { key: string; error: string }[] };

function Signer({
  signer,
  onRemove,
  formik,
}: {
  signer: SignerItem;
  onRemove: (() => void) | null;
  formik: any;
}) {
  if (!signer.isAdding && !signer.address) {
    throw new Error('Signer does not have an address');
  }

  const inputRef = useRef<HTMLInputElement>(null);

  const newSigner = signer.isAdding ? (signer as NewSignerItem) : null;
  const isInvalid =
    !!newSigner?.inputValue &&
    (formik.errors as NewSignerFormikErrors).newSigners?.some(error => error.key === signer.key);

  return (
    <Flex
      flexDirection="column"
      alignItems="stretch"
    >
      <Flex
        flexDirection="row"
        alignItems="center"
        gap={4}
        key={signer.key}
        px={6}
        py={2}
      >
        <Input
          ref={inputRef}
          value={!!newSigner ? newSigner.inputValue : signer.address}
          isDisabled={!newSigner}
          color={!!newSigner ? 'white-0' : 'neutral-3'}
          isInvalid={isInvalid}
          onChange={e => {
            // Find and overwrite the address input value of this new signer with the input value
            const newSigners = formik.values.newSigners.map((s: NewSignerItem) =>
              s.key === signer.key
                ? {
                    ...s,
                    inputValue: e.target.value,
                  }
                : s,
            );

            formik.setFieldValue('newSigners', newSigners);

            setTimeout(() => inputRef.current?.focus(), 10);
          }}
        />

        {onRemove && (
          <Button
            variant="tertiary"
            aria-label="Remove Signer"
            h="1.5rem"
            p="0"
            onClick={onRemove}
          >
            <Icon
              as={MinusCircle}
              boxSize="1.5rem"
              color="lilac-0"
            />
          </Button>
        )}
      </Flex>
      <Divider />
    </Flex>
  );
}

export function SignersContainer() {
  const { daoKey } = useCurrentDAOKey();
  const {
    node: { safe },
  } = useStore({ daoKey });
  const [userIsSigner, setUserIsSigner] = useState(false);

  const [signers, setSigners] = useState<ExistingSignerItem[]>([]);

  const { t } = useTranslation(['common', 'breadcrumbs', 'daoEdit']);
  const { validateAddress } = useValidationAddress();

  const formik = useFormik<{ newSigners: NewSignerItem[]; threshold: number }>({
    initialValues: {
      newSigners: [] as NewSignerItem[],
      threshold: safe?.threshold ?? 1,
    },
    validate: async values => {
      const errors: NewSignerFormikErrors = {};

      if (values.newSigners.length > 0) {
        const signerErrors = await Promise.all(
          values.newSigners.map(async signer => {
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
    },
    onSubmit: values => {
      // Handle form submission
      console.log(values);
    },
  });

  const [addSignerModalType, addSignerModalProps] = useMemo(() => {
    if (safe?.threshold === undefined) {
      return [ModalType.NONE] as const;
    }

    return [
      ModalType.ADD_SIGNER,
      { signers: signers.map(s => s.address), currentThreshold: safe.threshold },
    ] as const;
  }, [signers, safe?.threshold]);
  const showAddSignerModal = useDecentModal(addSignerModalType, addSignerModalProps);

  const { address: account } = useAccount();
  const enableRemove = userIsSigner && signers.length > 1;

  const genSignerItemKey = () => Math.random().toString(36).substring(2, 15);

  useEffect(() => {
    if (!safe?.owners) {
      return;
    }

    setSigners(
      safe.owners.map(owner => ({
        key: genSignerItemKey(),
        address: owner,
        isAdding: false,
      })),
    );
  }, [safe?.owners]);

  useEffect(() => {
    setUserIsSigner(
      account !== undefined &&
        signers.some(signer => !signer.isAdding && signer.address === account),
    );
  }, [account, signers]);

  const isSettingsV1FeatureEnabled = useFeatureFlag('flag_settings_v1');

  const [removingSigner, setRemovingSigner] = useState<SignerItem>();

  const [removeSignerModalType, removeSignerModalProps] = useMemo(() => {
    if (!safe?.threshold || !removingSigner?.address) {
      return [ModalType.NONE] as const;
    }

    return [
      ModalType.REMOVE_SIGNER,
      {
        selectedSigner: removingSigner.address,
        signers: signers.map(s => s.address),
        currentThreshold: safe.threshold,
      },
    ] as const;
  }, [removingSigner, signers, safe?.threshold]);
  const showRemoveSignerModal = useDecentModal(removeSignerModalType, removeSignerModalProps);

  useEffect(() => {
    if (removingSigner) {
      showRemoveSignerModal();
      setRemovingSigner(undefined);
    }
  }, [removingSigner, showRemoveSignerModal]);

  return (
    <Box width="100%">
      {/* LAUNCH TOKEN BANNER */}
      {isSettingsV1FeatureEnabled && (
        <Flex
          flexDirection="row"
          bg="cosmic-nebula-5"
          p={4}
          borderRadius="0.75rem"
          mb={12}
          justifyContent="space-between"
          alignItems="center"
        >
          <Flex
            flexDirection="row"
            gap={4}
            alignItems="center"
          >
            <Image
              src="/images/token-banner.svg"
              w="3.52244rem"
              h="3.75rem"
            />
            <Flex
              mt={4}
              flexDirection="column"
            >
              <Text
                textStyle="labels-small"
                color="cosmic-nebula-0"
                fontWeight="bold"
              >
                {t('launchTokenTitle', { ns: 'daoEdit' })}
              </Text>
              <Text
                textStyle="labels-large"
                color="cosmic-nebula-0"
                mb="1rem"
              >
                {t('launchTokenDescription', { ns: 'daoEdit' })}
              </Text>
            </Flex>
          </Flex>
          <Button
            variant="primary"
            bg="white-0"
            size="sm"
            onClick={() => {}}
          >
            {t('launchToken', { ns: 'daoEdit' })}
          </Button>
        </Flex>
      )}

      <Text
        ml={6}
        textStyle="body-large"
        mb={0.5}
      >
        {t('owners', { ns: 'common' })}
      </Text>

      <Box
        border="1px solid"
        borderColor="neutral-3"
        borderRadius="0.75rem"
      >
        {signers.map(signer => (
          <Signer
            key={signer.key}
            signer={signer}
            onRemove={enableRemove ? () => setRemovingSigner(signer) : null}
            formik={null}
          />
        ))}
        {formik.values.newSigners.map(signer => (
          <Signer
            key={signer.key}
            signer={signer}
            onRemove={() => {
              formik.setFieldValue(
                'newSigners',
                formik.values.newSigners.filter(s => s.key !== signer.key),
              );
            }}
            formik={formik}
          />
        ))}

        {userIsSigner && (
          <Flex
            gap="0.5rem"
            justifyContent="flex-end"
            px={6}
            py={2}
          >
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                if (isSettingsV1FeatureEnabled) {
                  const key = genSignerItemKey();
                  formik.setFieldValue('newSigners', [
                    ...formik.values.newSigners,
                    { key, address: '', isAdding: true },
                  ]);
                } else {
                  showAddSignerModal();
                }
              }}
              leftIcon={<PlusCircle size="16" />}
              iconSpacing="0"
            >
              <Show above="sm">
                <Text>{t('addOwner')}</Text>
              </Show>
            </Button>
          </Flex>
        )}
      </Box>

      <Box
        border="1px solid"
        borderColor="neutral-3"
        borderRadius="0.75rem"
        mt={3}
        px={6}
        py={3}
      >
        <Flex
          flexDirection="row"
          gap={3}
          justifyContent="space-between"
          alignItems="center"
        >
          <Flex flexDirection="column">
            <Text
              textStyle="body-large"
              mb={0.5}
            >
              {t('threshold', { ns: 'common' })}
            </Text>
            <Text
              textStyle="body-small"
              color="neutral-7"
            >
              {t('thresholdDescription', { ns: 'common' })}
            </Text>
          </Flex>

          {/* stepper */}
          <Flex w="200px">
            <NumberStepperInput
              onChange={value => formik.setFieldValue('threshold', value)}
              value={formik.values.threshold}
              disabled // @todo: Disabled until ready to propagate edit actions into a final proposal
            />
          </Flex>
        </Flex>
      </Box>
    </Box>
  );
}
