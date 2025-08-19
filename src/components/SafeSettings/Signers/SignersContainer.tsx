import { Box, Button, Flex, Icon, Input, Show, Text, Image } from '@chakra-ui/react';
import { MinusCircle, PlusCircle } from '@phosphor-icons/react';
import { useFormikContext } from 'formik';
import { useEffect, useMemo, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Address } from 'viem';
import { useAccount } from 'wagmi';
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
  const { values, setFieldValue, errors } = useFormikContext<SafeSettingsEdits>();

  const multisigEditFormikErrors = (errors as SafeSettingsFormikErrors | undefined)?.multisig;

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
          color={!!newSigner ? 'color-white' : 'color-neutral-900'}
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
              color={showRemoveButton ? 'color-lilac-100' : 'color-neutral-700'}
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
              color="color-lilac-100"
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

  const { setFieldValue, values, errors, status: { readOnly } = {} } = useFormikContext<SafeSettingsEdits>();

  const multisigEditFormikErrors = (errors as SafeSettingsFormikErrors | undefined)?.multisig;

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

  const { open: handleModifyGovernance } = useDecentModal(ModalType.CONFIRM_MODIFY_GOVERNANCE);

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
      <Flex
        flexDirection="row"
        bg="color-lilac-200"
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
              textStyle="text-xs-medium"
              color="color-lilac-700"
              fontWeight="bold"
            >
              {t('launchTokenTitle', { ns: 'daoEdit' })}
            </Text>
            <Text
              textStyle="text-sm-medium"
              color="color-lilac-700"
              mb="1rem"
            >
              {t('launchTokenDescription', { ns: 'daoEdit' })}
            </Text>
          </Flex>
        </Flex>
        <Button
          bg="color-white"
          _hover={{ bg: 'color-white' }}
          size="sm"
          onClick={handleModifyGovernance}
        >
          {t('launchToken', { ns: 'daoEdit' })}
        </Button>
      </Flex>

      <Text
        textStyle="text-lg-regular"
        color="color-white"
        mb={0.5}
      >
        {t('owners', { ns: 'common' })}
      </Text>

      <Box
        border="1px solid"
        borderColor="color-neutral-900"
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
            canRemove={canRemoveMoreSigners && !readOnly}
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
            canRemove={canRemoveMoreSigners && !readOnly}
          />
        ))}

        {!readOnly && (
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
                const key = genSignerItemKey();
                setFieldValue('multisig.newSigners', [
                  ...(values.multisig?.newSigners ?? []),
                  { key, address: '', isAdding: true },
                ]);
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
        borderColor="color-neutral-900"
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
              color="color-neutral-300"
            >
              {t('thresholdDescription', { ns: 'common' })}
            </Text>
          </Flex>

          {/* stepper */}
          <Flex w="200px">
            <NumberStepperInput
              disabled={readOnly}
              onChange={value => {
                let updatedValue;
                if (value !== `${safe?.threshold}`) {
                  updatedValue = value;
                }
                setFieldValue('multisig.signerThreshold', updatedValue);
              }}
              color={
                values.multisig?.signerThreshold === undefined ? 'color-neutral-300' : 'color-white'
              }
              value={values.multisig?.signerThreshold ?? safe?.threshold}
              isInvalid={!!multisigEditFormikErrors?.threshold}
            />
          </Flex>
        </Flex>
      </Box>
    </Box>
  );
}
