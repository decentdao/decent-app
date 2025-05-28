import { Box, Button, Flex, HStack, Icon, Input, Select, Text } from '@chakra-ui/react';
import { WarningCircle, WarningDiamond } from '@phosphor-icons/react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Address } from 'viem';
import { useCurrentDAOKey } from '../../../../hooks/DAO/useCurrentDAOKey';
import { useNetworkEnsName } from '../../../../hooks/useNetworkEnsName';
import { useDAOStore } from '../../../../providers/App/AppProvider';
import { SENTINEL_MODULE } from '../../../../utils/address';
import SupportTooltip from '../../../ui/badges/SupportTooltip';
import { CustomNonceInput } from '../../../ui/forms/CustomNonceInput';
import Divider from '../../../ui/utils/Divider';
import useRemoveSigner from '../hooks/useRemoveSigner';

function RemoveSignerModal({
  close,
  selectedSigner,
  signers,
  currentThreshold,
}: {
  close: () => void;
  selectedSigner: Address;
  signers: Address[];
  currentThreshold: number;
}) {
  const { daoKey } = useCurrentDAOKey();
  const {
    node: { safe },
  } = useDAOStore({ daoKey });
  const [thresholdOptions, setThresholdOptions] = useState<number[]>();
  const [prevSigner, setPrevSigner] = useState<Address>();

  const defaultNewThreshold =
    currentThreshold > signers.length - 1 ? signers.length - 1 : currentThreshold;
  const [threshold, setThreshold] = useState<number>(defaultNewThreshold);

  const [nonce, setNonce] = useState<number | undefined>(safe!.nextNonce);
  const { data: ensName } = useNetworkEnsName({
    address: selectedSigner,
  });
  const { t } = useTranslation(['modals', 'common']);
  const tooltipContainer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setThresholdOptions(Array.from({ length: signers.length - 1 }, (_, i) => i + 1));
  }, [signers]);

  const removeSigner = useRemoveSigner({
    prevSigner: prevSigner,
    signerToRemove: selectedSigner,
    threshold: threshold,
    nonce: nonce,
    safeAddress: safe?.address ?? null,
  });

  const onSubmit = async () => {
    await removeSigner();
    if (close) close();
  };

  useEffect(() => {
    const signerIndex = signers.findIndex(signer => signer === selectedSigner);
    setPrevSigner(signerIndex > 0 ? signers[signerIndex - 1] : SENTINEL_MODULE);
  }, [selectedSigner, signers]);

  return (
    <Box>
      <Text textStyle="text-sm-medium">{t('removeSignerLabel', { ns: 'modals' })}</Text>
      <Input
        value={ensName ? ensName : selectedSigner}
        disabled={true}
        my="0.5rem"
      />
      <HStack>
        <Icon
          weight="fill"
          as={WarningDiamond}
          color="color-error-500"
        />
        <Text
          textStyle="text-sm-medium"
          color="color-error-500"
        >
          {t('removeSignerWarning', { ns: 'modals' })}
        </Text>
      </HStack>

      <Divider
        mt={5}
        mb={4}
      />
      <HStack>
        <Text>{t('updateThreshold', { ns: 'modals' })}</Text>
        <Flex ref={tooltipContainer}>
          <SupportTooltip
            containerRef={tooltipContainer}
            label={t('updateSignersTooltip')}
            color="color-lilac-100"
            mx="2"
            mt="1"
          />
        </Flex>
      </HStack>

      <HStack>
        <Select
          onChange={e => setThreshold(Number(e.target.value))}
          mt={4}
          width="8rem"
          bgColor="color-black"
          borderColor="color-neutral-900"
          rounded="sm"
          cursor="pointer"
        >
          {thresholdOptions?.map(thresholdOption => (
            <option
              key={thresholdOption}
              value={thresholdOption}
            >
              {thresholdOption}
            </option>
          ))}
        </Select>
        <Flex>
          <Text
            mt={3}
            ml={2}
          >{`${t('signersRequired1', { ns: 'modals' })} ${signers.length - 1} ${t(
            'signersRequired2',
            { ns: 'modals' },
          )}`}</Text>
        </Flex>
      </HStack>
      <Flex
        w="fit-full"
        mt={6}
        p="1rem"
        border="1px"
        borderColor="color-yellow-800"
        bg="color-yellow-950"
        borderRadius="0.25rem"
        alignItems="center"
        gap="1rem"
      >
        <Icon
          color="color-yellow-200"
          as={WarningCircle}
          boxSize="1.5rem"
        />
        <Text
          color="color-yellow-200"
          whiteSpace="pre-wrap"
        >
          {t('updateSignerWarning', { ns: 'modals' })}
        </Text>
      </Flex>
      <Divider
        mt={6}
        mb={6}
      />
      <CustomNonceInput
        nonce={nonce}
        onChange={newNonce => setNonce(newNonce !== undefined ? parseInt(newNonce) : undefined)}
      />
      <Button
        isDisabled={!threshold || !nonce || !safe || nonce < safe.nonce}
        mt={6}
        width="100%"
        onClick={onSubmit}
      >
        {t('createProposal', { ns: 'modals' })}
      </Button>
    </Box>
  );
}

export default RemoveSignerModal;
