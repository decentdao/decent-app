import { Box, Button, Flex, Icon, Input, Show, Text, Image } from '@chakra-ui/react';
import { MinusCircle, PlusCircle } from '@phosphor-icons/react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Address, getAddress } from 'viem';
import { useAccount } from 'wagmi';
import useFeatureFlag from '../../../helpers/environmentFeatureFlags';
import { useCurrentDAOKey } from '../../../hooks/DAO/useCurrentDAOKey';
import { useStore } from '../../../providers/App/AppProvider';
import { ModalType } from '../../ui/modals/ModalProvider';
import { useDecentModal } from '../../ui/modals/useDecentModal';
import Divider from '../../ui/utils/Divider';

function Signer({
  signer,
  signers,
  threshold,
  enableRemove,
}: {
  signer: Address;
  signers: Address[];
  threshold: number | undefined;
  enableRemove: boolean;
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
    <Flex
      flexDirection="column"
      alignItems="stretch"
    >
      <Flex
        flexDirection="row"
        alignItems="center"
        gap={4}
        key={signer}
        px={6}
        py={2}
      >
        <Input
          value={signer}
          isDisabled
          color="neutral-7"
        />

        {enableRemove && (
          <Button
            variant="tertiary"
            aria-label="Remove Signer"
            h="1.5rem"
            p="0"
            onClick={removeSigner}
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
  const [signers, setSigners] = useState<Address[]>();
  const [userIsSigner, setUserIsSigner] = useState(false);

  const [modalType, props] = useMemo(() => {
    if (!signers) {
      return [ModalType.NONE] as const;
    }
    return [ModalType.ADD_SIGNER, { signers, currentThreshold: safe?.threshold }] as const;
  }, [signers, safe?.threshold]);

  const addSigner = useDecentModal(modalType, props);
  const { t } = useTranslation(['common', 'breadcrumbs', 'daoEdit']);
  const { address: account } = useAccount();
  const enableRemove = userIsSigner && !!signers && signers?.length > 1;

  useEffect(() => {
    setSigners(safe?.owners.map(owner => getAddress(owner)));
  }, [safe?.owners]);

  useEffect(() => {
    if (!signers) {
      return;
    }

    setUserIsSigner(account !== undefined && signers.includes(account));
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

      <Box
        border="1px solid"
        borderColor="neutral-3"
        borderRadius="0.75rem"
      >
        {signers &&
          signers.map(signer => (
            <Signer
              key={signer}
              signer={signer}
              signers={signers}
              enableRemove={enableRemove}
              threshold={safe?.threshold}
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
      </Box>
    </Box>
  );
}
