import { Box, Button, Flex, Hide, HStack, Icon, Show, Text, Image } from '@chakra-ui/react';
import { MinusCircle, PlusCircle } from '@phosphor-icons/react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Address, getAddress } from 'viem';
import { useAccount } from 'wagmi';
import useFeatureFlag from '../../../helpers/environmentFeatureFlags';
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
  const { t } = useTranslation(['common', 'breadcrumbs', 'daoEdit']);
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

  const isSettingsV1FeatureEnabled = useFeatureFlag('flag_settings_v1');

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
      >
        {t('owners', { ns: 'common' })}
      </Text>
      <Flex justifyContent="space-between">
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
