import { Box, Button, Flex, Hide, HStack, Icon, Show, Text } from '@chakra-ui/react';
import { MinusCircle, PlusCircle } from '@phosphor-icons/react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Address, getAddress } from 'viem';
import { useAccount } from 'wagmi';
import { useCurrentDAOKey } from '../../../hooks/DAO/useCurrentDAOKey';
import { useStore } from '../../../providers/App/AppProvider';
import { DisplayAddress } from '../../ui/links/DisplayAddress';
import { ModalType } from '../../ui/modals/ModalProvider';
import { useDecentModal } from '../../ui/modals/useDecentModal';

function Signer({
  signer,
  signers,
  threshold,
  disabled,
}: {
  signer: Address;
  signers: Address[];
  threshold: number | undefined;
  disabled: boolean;
}) {
  const [modalType, props] = useMemo(() => {
    if (!signers || !threshold) {
      return [ModalType.NONE] as const;
    }
    return [
      ModalType.REMOVE_SIGNER,
      {
        selectedSigner: signer,
        signers: signers,
        currentThreshold: threshold,
      },
    ] as const;
  }, [signer, signers, threshold]);

  const removeSigner = useDecentModal(modalType, props);
  return (
    <HStack
      key={signer}
      my="1rem"
      justifyContent="space-between"
    >
      <Show above="md">
        <DisplayAddress
          address={signer}
          truncate={false}
        />
      </Show>
      <Hide above="md">
        <DisplayAddress
          address={signer}
          truncate
        />
      </Hide>
      {!disabled && (
        <Button
          variant="tertiary"
          aria-label="Remove Signer"
          padding="0.5rem"
          h="fit-content"
          onClick={removeSigner}
        >
          <Icon
            as={MinusCircle}
            boxSize="1.25rem"
          />
        </Button>
      )}
    </HStack>
  );
}

export function SignersContainer() {
  const { daoKey } = useCurrentDAOKey();
  const {
    node: { safe },
  } = useStore({ daoKey });
  const [signers, setSigners] = useState<Address[]>();
  const [userIsSigner, setUserIsSigner] = useState<boolean>();

  const [modalType, props] = useMemo(() => {
    if (!signers) {
      return [ModalType.NONE] as const;
    }
    return [ModalType.ADD_SIGNER, { signers, currentThreshold: safe?.threshold }] as const;
  }, [signers, safe?.threshold]);

  const addSigner = useDecentModal(modalType, props);
  const { t } = useTranslation(['common', 'breadcrumbs']);
  const { address: account } = useAccount();
  const enableRemove = userIsSigner && signers && signers?.length > 1;

  useEffect(() => {
    setSigners(safe?.owners.map(owner => getAddress(owner)));
  }, [safe?.owners]);

  useEffect(() => {
    if (!signers) {
      return;
    }

    setUserIsSigner(account && signers.includes(account));
  }, [account, signers]);

  return (
    <Box width="100%">
      <Flex justifyContent="space-between">
        <Text>{t('signers', { ns: 'common' })}</Text>
        {userIsSigner && (
          <Flex gap="0.5rem">
            <Button
              variant="secondary"
              size="sm"
              onClick={addSigner}
              leftIcon={<PlusCircle size="16" />}
              iconSpacing="0"
            >
              <Show above="sm">
                <Text>{t('addOwner')}</Text>
              </Show>
            </Button>
          </Flex>
        )}
      </Flex>
      {signers &&
        signers.map(signer => (
          <Signer
            key={signer}
            signer={signer}
            signers={signers}
            disabled={!enableRemove}
            threshold={safe?.threshold}
          />
        ))}
    </Box>
  );
}
