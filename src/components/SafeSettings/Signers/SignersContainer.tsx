import { Box, Button, Flex, Icon, Input, Show, Text, Image } from '@chakra-ui/react';
import { MinusCircle, PlusCircle } from '@phosphor-icons/react';
import { useFormikContext } from 'formik';
import { useEffect, useMemo, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Address } from 'viem';
import { useAccount } from 'wagmi';
import useFeatureFlag from '../../../helpers/environmentFeatureFlags';
import { useCurrentDAOKey } from '../../../hooks/DAO/useCurrentDAOKey';
import { useDAOStore } from '../../../providers/App/AppProvider';
import { NumberStepperInput } from '../../ui/forms/NumberStepperInput';
import { ModalType } from '../../ui/modals/ModalProvider';
import { SafeSettingsEdits, SafeSettingsFormikErrors } from '../../ui/modals/SafeSettingsModal';
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

export type NewSignerItem = SignerItem & {
  isAdding: true;
  inputValue: string;
};

function Signer({
  signer,
  onRemove,
  markedForRemoval,
  canRemove,
}: {
  signer: SignerItem;
  onRemove: (() => void) | null;
  markedForRemoval?: boolean;
  canRemove: boolean;
}) {
  if (!signer.isAdding && !signer.address) {
    throw new Error('Signer does not have an address');
  }

  const inputRef = useRef<HTMLInputElement>(null);
  const { values, setFieldValue } = useFormikContext<SafeSettingsEdits>();
  const { errors } = useFormikContext<SafeSettingsFormikErrors>();

  const multisigEditFormikErrors = (errors as SafeSettingsFormikErrors).multisig;

  const newSigner = signer.isAdding ? (signer as NewSignerItem) : null;
  const isInvalid =
    !!newSigner?.inputValue &&
    multisigEditFormikErrors?.newSigners?.some(error => error.key === signer.key);

  const showRemoveButton = onRemove && !markedForRemoval && canRemove;

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
          textDecoration={markedForRemoval ? 'line-through' : 'none'}
          color={!!newSigner ? 'white-0' : 'neutral-3'}
          isInvalid={isInvalid}
          onChange={e => {
            // Find and overwrite the address input value of this new signer with the input value
            const newSigners = values.multisig?.newSigners?.map((s: NewSignerItem) =>
              s.key === signer.key
                ? {
                    ...s,
                    inputValue: e.target.value,
                  }
                : s,
            );

            setFieldValue('multisig.newSigners', newSigners);

            setTimeout(() => inputRef.current?.focus(), 10);
          }}
        />

        {!markedForRemoval && (
          <Button
            variant="tertiary"
            aria-label="Remove Signer"
            h="1.5rem"
            p="0"
            isDisabled={!showRemoveButton}
            onClick={onRemove ?? (() => {})}
          >
            <Icon
              as={MinusCircle}
              boxSize="1.5rem"
              color={showRemoveButton ? 'lilac-0' : 'neutral-5'}
            />
          </Button>
        )}

        {markedForRemoval && (
          <Button
            variant="tertiary"
            aria-label="Remove Signer"
            h="1.5rem"
            p="0"
            onClick={() => {
              setFieldValue('multisig.signersToRemove', [
                ...(values.multisig?.signersToRemove ?? []).filter(
                  (s: string) => s !== signer.address,
                ),
              ]);
            }}
          >
            <Icon
              as={PlusCircle}
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
  } = useDAOStore({ daoKey });
  const [userIsSigner, setUserIsSigner] = useState(false);

  const [signers, setSigners] = useState<ExistingSignerItem[]>([]);

  const { t } = useTranslation(['common', 'breadcrumbs', 'daoEdit']);

  const { setFieldValue, values } = useFormikContext<SafeSettingsEdits>();
  const { errors } = useFormikContext<SafeSettingsFormikErrors>();

  const multisigEditFormikErrors = (errors as SafeSettingsFormikErrors).multisig;

  useEffect(() => {
    if (
      values.multisig &&
      !values.multisig.newSigners?.length &&
      !values.multisig.signersToRemove?.length &&
      !values.multisig.signerThreshold
    ) {
      setFieldValue('multisig', undefined);
    }
  }, [setFieldValue, values.multisig]);

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

  const handleModifyGovernance = useDecentModal(ModalType.CONFIRM_MODIFY_GOVERNANCE);

  // Calculate if we can remove more signers
  const canRemoveMoreSigners = useMemo(() => {
    const activeSigners = signers.filter(
      signer => !values.multisig?.signersToRemove?.includes(signer.address),
    ).length;
    const newSignersCount = values.multisig?.newSigners?.length ?? 0;
    return activeSigners + newSignersCount > 1;
  }, [signers, values.multisig?.signersToRemove, values.multisig?.newSigners]);

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
            bg="white-0"
            _hover={{ bg: 'white-0' }}
            size="sm"
            onClick={handleModifyGovernance}
          >
            {t('launchToken', { ns: 'daoEdit' })}
          </Button>
        </Flex>
      )}

      <Text
        ml={6}
        textStyle="text-lg-regular"
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
            markedForRemoval={values.multisig?.signersToRemove?.includes(signer.address) ?? false}
            onRemove={
              enableRemove
                ? () => {
                    setFieldValue('multisig.signersToRemove', [
                      ...(values.multisig?.signersToRemove ?? []),
                      signer.address,
                    ]);
                  }
                : null
            }
            canRemove={canRemoveMoreSigners}
          />
        ))}
        {values.multisig?.newSigners?.map(signer => (
          <Signer
            key={signer.key}
            signer={signer}
            onRemove={() => {
              setFieldValue(
                'multisig.newSigners',
                values.multisig?.newSigners?.filter(s => s.key !== signer.key),
              );
            }}
            canRemove={canRemoveMoreSigners}
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
                  setFieldValue('multisig.newSigners', [
                    ...(values.multisig?.newSigners ?? []),
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

      {isSettingsV1FeatureEnabled && (
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
                textStyle="text-lg-regular"
                mb={0.5}
              >
                {t('threshold', { ns: 'common' })}
              </Text>
              <Text
                textStyle="text-base-regular"
                color="neutral-7"
              >
                {t('thresholdDescription', { ns: 'common' })}
              </Text>
            </Flex>

            {/* stepper */}
            <Flex w="200px">
              <NumberStepperInput
                onChange={value => {
                  let updatedValue;
                  if (value !== `${safe?.threshold}`) {
                    updatedValue = value;
                  }
                  setFieldValue('multisig.signerThreshold', updatedValue);
                }}
                color={values.multisig?.signerThreshold === undefined ? 'neutral-7' : 'white-0'}
                value={values.multisig?.signerThreshold ?? safe?.threshold}
                isInvalid={!!multisigEditFormikErrors?.threshold}
              />
            </Flex>
          </Flex>
        </Box>
      )}
    </Box>
  );
}
