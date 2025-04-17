import { Box, Button, Flex, HStack, Image, Switch, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { getContract } from 'viem';
import { EntryPoint07Abi } from '../../assets/abi/EntryPoint07Abi';
import { DETAILS_BOX_SHADOW } from '../../constants/common';
import { DAO_ROUTES } from '../../constants/routes';
import useFeatureFlag from '../../helpers/environmentFeatureFlags';
import { useDepositInfo } from '../../hooks/DAO/accountAbstraction/useDepositInfo';
import useNetworkPublicClient from '../../hooks/useNetworkPublicClient';
import { useNetworkWalletClient } from '../../hooks/useNetworkWalletClient';
import { useCanUserCreateProposal } from '../../hooks/utils/useCanUserSubmitProposal';
import { useNetworkConfigStore } from '../../providers/NetworkConfig/useNetworkConfigStore';
import { useProposalActionsStore } from '../../store/actions/useProposalActionsStore';
import { useDaoInfoStore } from '../../store/daoInfo/useDaoInfoStore';
import { formatCoin } from '../../utils';
import { prepareRefillPaymasterAction } from '../../utils/dao/prepareRefillPaymasterActionData';
import { RefillGasData } from '../ui/modals/GaslessVoting/RefillGasTankModal';
import { ModalType } from '../ui/modals/ModalProvider';
import { useDecentModal } from '../ui/modals/useDecentModal';
import Divider from '../ui/utils/Divider';
import { StarterPromoBanner } from './StarterPromoBanner';

interface GaslessVotingToggleProps {
  isEnabled: boolean;
  onToggle: () => void;
}

function GaslessVotingToggleContent({
  isEnabled,
  onToggle,
  isSettings,
  displayNeedStakingLabel,
}: GaslessVotingToggleProps & { isSettings?: boolean; displayNeedStakingLabel?: boolean }) {
  const { t } = useTranslation('gaslessVoting');
  const { gaslessVoting } = useNetworkConfigStore();
  const { canUserCreateProposal } = useCanUserCreateProposal();

  const publicClient = useNetworkPublicClient();
  const nativeCurrency = publicClient.chain.nativeCurrency;
  const formattedMinStakeAmount = formatCoin(
    gaslessVoting?.bundlerMinimumStake || 0n,
    true,
    nativeCurrency.decimals,
    nativeCurrency.symbol,
    false,
  );

  return (
    <Box
      display="flex"
      flexDirection="column"
      gap="1.5rem"
      w="100%"
    >
      <HStack
        justify="space-between"
        width="100%"
        alignItems="flex-start"
      >
        <Flex
          flexDirection="column"
          gap="0.25rem"
        >
          <Text textStyle={isSettings ? 'body-small' : 'helper-text'}>
            {isSettings ? t('gaslessVotingLabelSettings') : t('gaslessVotingLabel')}
          </Text>
          <Text
            textStyle={isSettings ? 'labels-large' : 'helper-text'}
            color="neutral-7"
          >
            {isSettings ? t('gaslessVotingDescriptionSettings') : t('gaslessVotingDescription')}
          </Text>
          {displayNeedStakingLabel && (
            <Text
              textStyle={isSettings ? 'labels-large' : 'helper-text'}
              color="neutral-7"
            >
              {t('gaslessStakingDescription', {
                amount: formattedMinStakeAmount,
                symbol: nativeCurrency.symbol,
              })}
            </Text>
          )}
        </Flex>
        <Switch
          size="md"
          isDisabled={isSettings && !canUserCreateProposal}
          isChecked={isEnabled}
          onChange={() => onToggle()}
          variant="secondary"
        />
      </HStack>
    </Box>
  );
}

export function GaslessVotingToggleDAOCreate(props: GaslessVotingToggleProps) {
  const gaslessFeatureEnabled = useFeatureFlag('flag_gasless_voting');
  if (!gaslessFeatureEnabled) return null;

  return (
    <Flex
      direction="column"
      gap="0.5rem"
    >
      <Box
        borderRadius="0.75rem"
        bg="neutral-2"
        p="1.5rem"
        display="flex"
        flexDirection="column"
        gap="1.5rem"
        boxShadow={DETAILS_BOX_SHADOW}
        mt={2}
      >
        <Box
          borderRadius="0.5rem"
          border="1px solid"
          borderColor="neutral-3"
          px="1.5rem"
          py="1rem"
          display="flex"
          flexDirection="column"
          alignItems="flex-start"
          mt={2}
        >
          <GaslessVotingToggleContent {...props} />
        </Box>
      </Box>
      <StarterPromoBanner />
    </Flex>
  );
}

export function GaslessVotingToggleDAOSettings(props: GaslessVotingToggleProps) {
  const { t } = useTranslation('gaslessVoting');
  const {
    addressPrefix,
    contracts: { accountAbstraction },
    gaslessVoting,
  } = useNetworkConfigStore();

  const navigate = useNavigate();
  const publicClient = useNetworkPublicClient();
  const nativeCurrency = publicClient.chain.nativeCurrency;

  const { safe, gaslessVotingEnabled, paymasterAddress } = useDaoInfoStore();
  const { depositInfo } = useDepositInfo(paymasterAddress);

  const { addAction } = useProposalActionsStore();
  const { data: walletClient } = useNetworkWalletClient();

  const refillGas = useDecentModal(ModalType.REFILL_GAS, {
    onSubmit: async (refillGasData: RefillGasData) => {
      if (!safe?.address || !paymasterAddress || !accountAbstraction) {
        return;
      }

      if (refillGasData.isDirectDeposit) {
        if (!walletClient) {
          throw new Error('Wallet client not found');
        }

        const entryPoint = getContract({
          address: accountAbstraction.entryPointv07,
          abi: EntryPoint07Abi,
          client: walletClient,
        });

        entryPoint.write.depositTo([paymasterAddress], {
          value: refillGasData.transferAmount,
        });
        return;
      }

      const action = prepareRefillPaymasterAction({
        refillAmount: refillGasData.transferAmount,
        paymasterAddress,
        nativeToken: nativeCurrency,
        entryPointAddress: accountAbstraction.entryPointv07,
      });
      const formattedRefillAmount = formatCoin(
        refillGasData.transferAmount,
        true,
        nativeCurrency.decimals,
        nativeCurrency.symbol,
        false,
      );

      addAction({
        ...action,
        content: (
          <Box>
            <Text>
              {t('refillPaymasterAction', {
                amount: formattedRefillAmount,
                symbol: nativeCurrency.symbol,
              })}
            </Text>
          </Box>
        ),
      });

      navigate(DAO_ROUTES.proposalWithActionsNew.relative(addressPrefix, safe.address));
    },
  });

  const gaslessFeatureEnabled = useFeatureFlag('flag_gasless_voting');
  const gaslessStakingFeatureEnabled = useFeatureFlag('flag_gasless_staking');
  const gaslessStakingEnabled =
    gaslessVotingEnabled &&
    gaslessStakingFeatureEnabled &&
    gaslessVoting?.bundlerMinimumStake !== undefined;
  if (!gaslessFeatureEnabled) return null;

  const paymasterBalance = depositInfo?.balance || 0n;
  const stakedAmount = depositInfo?.stake || 0n;
  const minStakeAmount = gaslessVoting?.bundlerMinimumStake || 0n;
  const formattedPaymasterBalance = formatCoin(
    paymasterBalance,
    true,
    nativeCurrency.decimals,
    nativeCurrency.symbol,
    false,
  );
  const formattedPaymasterStakedAmount = formatCoin(
    stakedAmount,
    true,
    nativeCurrency.decimals,
    nativeCurrency.symbol,
    false,
  );

  return (
    <Box
      gap="1.5rem"
      display="flex"
      flexDirection="column"
    >
      <Divider
        mt="1rem"
        w={{ base: 'calc(100% + 1.5rem)', md: 'calc(100% + 3rem)' }}
        mx={{ base: '-0.75rem', md: '-1.5rem' }}
      />

      <GaslessVotingToggleContent
        {...props}
        isSettings
        displayNeedStakingLabel={gaslessStakingEnabled && stakedAmount < minStakeAmount}
      />

      {!gaslessVotingEnabled && <StarterPromoBanner />}

      {gaslessVotingEnabled && (
        <Flex justifyContent="space-between">
          <Flex
            direction="column"
            justifyContent="space-between"
          >
            <Text
              textStyle="labels-small"
              color="neutral-7"
              mb="0.25rem"
            >
              {t('paymasterBalance')}
            </Text>
            <Text
              textStyle="labels-large"
              display="flex"
              alignItems="center"
            >
              {formattedPaymasterBalance}
              <Image
                src={'/images/coin-icon-default.svg'} // @todo: (gv) Use the correct image for the token.
                fallbackSrc={'/images/coin-icon-default.svg'}
                alt={nativeCurrency.symbol}
                w="1.25rem"
                h="1.25rem"
                ml="0.5rem"
                mr="0.25rem"
              />
              {nativeCurrency.symbol}
            </Text>
          </Flex>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              refillGas();
            }}
          >
            {t('addGas')}
          </Button>
        </Flex>
      )}

      {gaslessStakingEnabled && (
        <Flex justifyContent="space-between">
          <Flex
            direction="column"
            justifyContent="space-between"
          >
            <Text
              textStyle="labels-small"
              color="neutral-7"
              mb="0.25rem"
            >
              {t('paymasterStakedAmount')}
            </Text>
            <Text
              textStyle="labels-large"
              display="flex"
              alignItems="center"
            >
              {formattedPaymasterStakedAmount}
              <Image
                src={'/images/coin-icon-default.svg'} // @todo: (gv) Use the correct image for the token.
                fallbackSrc={'/images/coin-icon-default.svg'}
                alt={nativeCurrency.symbol}
                w="1.25rem"
                h="1.25rem"
                ml="0.5rem"
                mr="0.25rem"
              />
              {nativeCurrency.symbol}
            </Text>
          </Flex>
        </Flex>
      )}
    </Box>
  );
}
