import { Box, Button, Flex, Image, Text, useBreakpointValue } from '@chakra-ui/react';
import { Download } from '@phosphor-icons/react';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Id, toast } from 'react-toastify';
import { Address, encodeFunctionData, getAddress, getContract } from 'viem';
import { usePublicClient, useWalletClient } from 'wagmi';
import HatsAccount1ofNAbi from '../../../assets/abi/HatsAccount1ofN';
import { SablierV2LockupLinearAbi } from '../../../assets/abi/SablierV2LockupLinear';
import { SEXY_BOX_SHADOW_T_T } from '../../../constants/common';
import { convertStreamIdToBigInt } from '../../../hooks/streams/useCreateSablierStream';
import useAvatar from '../../../hooks/utils/useAvatar';
import useDisplayName from '../../../hooks/utils/useDisplayName';
import { useNetworkConfig } from '../../../providers/NetworkConfig/NetworkConfigProvider';
import { formatCoin } from '../../../utils';
import Avatar, { AvatarSize } from '../page/Header/Avatar';

export default function PaymentWithdrawModal({
  paymentAssetLogo,
  paymentAssetSymbol,
  paymentAssetDecimals,
  paymentStreamId,
  paymentContractAddress,
  withdrawInformation,
  onSuccess,
  onClose,
}: {
  paymentAssetLogo?: string;
  paymentAssetSymbol: string;
  paymentStreamId?: string;
  paymentAssetDecimals: number;
  paymentContractAddress?: Address;
  withdrawInformation: {
    roleHatSmartAddress: Address;
    roleHatWearerAddress: Address;
    withdrawableAmount: bigint;
  };
  onSuccess: () => Promise<void>;
  onClose: () => void;
}) {
  console.log('🚀 ~ withdrawInformation:', withdrawInformation);
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { t } = useTranslation(['roles', 'menu', 'common', 'modals']);
  const { displayName: accountDisplayName } = useDisplayName(
    withdrawInformation.roleHatWearerAddress,
  );
  const avatarURL = useAvatar(accountDisplayName);
  const iconSize = useBreakpointValue<AvatarSize>({ base: 'sm', md: 'icon' }) || 'sm';
  const { chain } = useNetworkConfig();

  const handleWithdraw = useCallback(async () => {
    if (
      paymentContractAddress &&
      paymentStreamId &&
      walletClient &&
      publicClient &&
      withdrawInformation.roleHatSmartAddress &&
      withdrawInformation.roleHatWearerAddress
    ) {
      let withdrawToast: Id | undefined = undefined;
      try {
        const hatsAccountContract = getContract({
          abi: HatsAccount1ofNAbi,
          address: withdrawInformation.roleHatSmartAddress,
          client: walletClient,
        });
        const bigIntStreamId = convertStreamIdToBigInt(paymentStreamId);
        let hatsAccountCalldata = encodeFunctionData({
          abi: SablierV2LockupLinearAbi,
          functionName: 'withdrawMax',
          args: [bigIntStreamId, getAddress(withdrawInformation.roleHatWearerAddress)],
        });
        withdrawToast = toast(t('withdrawPendingMessage'), {
          autoClose: false,
          closeOnClick: false,
          draggable: false,
          closeButton: false,
          progress: 1,
        });
        const txHash = await hatsAccountContract.write.execute([
          paymentContractAddress,
          0n,
          hatsAccountCalldata,
          0,
        ]);
        const transaction = await publicClient.waitForTransactionReceipt({ hash: txHash });
        toast.dismiss(withdrawToast);
        if (transaction.status === 'success') {
          await onSuccess();
          toast(t('withdrawSuccessMessage'));
          onClose();
        } else {
          toast(t('withdrawRevertedMessage'));
        }
      } catch (e) {
        if (withdrawToast !== undefined) {
          toast.dismiss(withdrawToast);
        }
        console.error('Error withdrawing from stream', e);
        toast(t('withdrawErrorMessage'));
      }
    }
  }, [
    paymentContractAddress,
    paymentStreamId,
    publicClient,
    walletClient,
    onSuccess,
    onClose,
    withdrawInformation.roleHatSmartAddress,
    withdrawInformation.roleHatWearerAddress,
    t,
  ]);
  console.log(
    '🚀 ~ withdrawInformation.roleHatWearerAddress:',
    withdrawInformation.roleHatWearerAddress,
  );

  return (
    <Flex
      gap="1.5rem"
      flexWrap="wrap"
      px={{ base: '1rem', md: 0 }}
    >
      <Text
        textAlign="center"
        px="1.5rem"
        textStyle="display-lg"
        w="full"
      >
        {t('withdrawPaymentTitle')}
      </Text>
      <Flex
        gap="1rem"
        flexWrap="wrap"
      >
        <Flex
          w="full"
          py="1rem"
          gap="1rem"
          borderRadius="0.5rem"
          boxShadow={SEXY_BOX_SHADOW_T_T}
          bg="neutral-2"
          justifyContent="center"
        >
          <Flex
            gap="0.5rem"
            px="1rem"
            alignItems="center"
            flex="1"
            justifyContent="center"
          >
            <Image
              src={paymentAssetLogo}
              fallbackSrc="/images/coin-icon-default.svg"
              alt={paymentAssetSymbol}
              w="2rem"
              h="2rem"
            />
            <Text textStyle="label-large">{paymentAssetSymbol}</Text>
          </Flex>
          <Flex
            px="1rem"
            flexWrap="wrap"
            alignItems="center"
            flex="1"
          >
            <Text
              textStyle="label-small"
              color="neutral-7"
              w="full"
            >
              {t('available')}
            </Text>
            <Text
              textStyle="display-4xl"
              w="full"
            >
              {formatCoin(
                withdrawInformation.withdrawableAmount,
                true,
                paymentAssetDecimals,
                undefined,
                false,
              )}
            </Text>
          </Flex>
        </Flex>
        <Flex
          gap="1rem"
          flexWrap="wrap"
        >
          <Flex
            gap="0.5rem"
            flexWrap="wrap"
            w="full"
          >
            <Text
              textStyle="label-small"
              color="neutral-7"
              w="100px"
            >
              {t('withdrawTo')}
            </Text>
            <Flex
              alignItems="center"
              gap={{ base: '0.25rem', md: '0.5rem' }}
            >
              <Box>
                <Avatar
                  address={withdrawInformation.roleHatWearerAddress}
                  url={avatarURL}
                  size={iconSize}
                />
              </Box>
              <Text textStyle="label-base">{withdrawInformation.roleHatWearerAddress}</Text>
            </Flex>
          </Flex>
          <Flex
            gap="0.5rem"
            flexWrap="wrap"
            w="full"
          >
            <Text
              textStyle="label-small"
              color="neutral-7"
              w="100px"
            >
              {t('network', { ns: 'menu' })}
            </Text>
            <Text>{chain.name}</Text>
          </Flex>
        </Flex>
      </Flex>
      <Flex
        gap="0.75rem"
        w="full"
      >
        <Button
          variant="secondary"
          onClick={onClose}
          flex="1"
        >
          {t('cancel', { ns: 'common' })}
        </Button>
        <Button
          onClick={handleWithdraw}
          leftIcon={<Download />}
          flex="1"
        >
          {t('withdraw')}
        </Button>
      </Flex>
    </Flex>
  );
}
