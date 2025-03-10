import { Box, Button, Flex, Icon, Text } from '@chakra-ui/react';
import { Cardholder, Gauge } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { getContract, keccak256, stringToHex } from 'viem';
import { useAccount } from 'wagmi';
import { SimpleAccountAbi } from '../../../../assets/abi/SimpleAccountAbi';
import { useNetworkWalletClient } from '../../../../hooks/useNetworkWalletClient';
import { useTransaction } from '../../../../hooks/utils/useTransaction';
import { useNetworkConfigStore } from '../../../../providers/NetworkConfig/useNetworkConfigStore';

export function CreateSmartWalletModal({
  close,
  successCallback,
}: {
  close: () => void;
  successCallback: () => void;
}) {
  const { t } = useTranslation('gaslessVoting');
  const {
    contracts: { simpleAccountFactory },
  } = useNetworkConfigStore();
  const { data: walletClient } = useNetworkWalletClient();
  const { chain } = useNetworkConfigStore();

  const { address: EOA } = useAccount();
  const [contractCall] = useTransaction();

  const handleCreateSmartWalletSubmit = async () => {
    if (!EOA || !walletClient) {
      throw new Error('Wallet not connected');
    }

    const contract = getContract({
      address: simpleAccountFactory,
      abi: SimpleAccountAbi,
      client: walletClient,
    });

    const salt = `${EOA}-${chain.id}`;
    const saltHash = keccak256(stringToHex(salt));
    const userSmartWalletSaltBigInt = BigInt(saltHash);

    contractCall({
      contractFn: () => contract.write.createAccount([EOA, userSmartWalletSaltBigInt]),
      pendingMessage: t('createSmartWalletPending'),
      failedMessage: t('createSmartWalletFailed'),
      successMessage: t('createSmartWalletSuccess'),
      successCallback: () => {
        close();
        successCallback();
      },
    });
  };

  return (
    <Box>
      <Flex
        justify="space-between"
        flexDirection="column"
        gap={4}
      >
        <Text textStyle="heading-medium">{t('createSmartWallet')}</Text>
        <Text
          textStyle="labels-large"
          color="neutral-7"
        >
          {t('createSmartWalletDescription')}
        </Text>
      </Flex>

      <Flex
        marginTop="2rem"
        flexDirection="column"
        gap={4}
      >
        <Flex
          alignItems="flex-start"
          gap={4}
        >
          <Icon
            as={Gauge}
            color="lilac-0"
            boxSize="24px"
            mt={0.25}
          />
          <Text
            textStyle="body-small"
            mt={0}
          >
            {t('cancelCreateSmartWalletConsequence')}
          </Text>
        </Flex>
        <Flex
          alignItems="flex-start"
          gap={4}
        >
          <Icon
            as={Cardholder}
            color="lilac-0"
            boxSize="24px"
            mt={0.25}
          />
          <Text textStyle="body-small">{t('createSmartWalletOneTimeGasFeeNotice')}</Text>
        </Flex>
      </Flex>

      <Flex
        justifyContent="flex-end"
        gap={2}
        mt={6}
      >
        <Button
          variant="secondary"
          onClick={close}
        >
          {t('cancelCreateSmartWallet')}
        </Button>
        <Button
          type="submit"
          onClick={handleCreateSmartWalletSubmit}
        >
          {t('proceedCreateSmartWallet')}
        </Button>
      </Flex>
    </Box>
  );
}
