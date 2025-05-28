import { Box, Button, Flex, HStack, Image, Switch, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { getContract } from 'viem';
import { EntryPoint07Abi } from '../../assets/abi/EntryPoint07Abi';
import { DAO_ROUTES } from '../../constants/routes';
import useFeatureFlag from '../../helpers/environmentFeatureFlags';
import { usePaymasterDepositInfo } from '../../hooks/DAO/accountAbstraction/usePaymasterDepositInfo';
import { useCurrentDAOKey } from '../../hooks/DAO/useCurrentDAOKey';
import useNetworkPublicClient from '../../hooks/useNetworkPublicClient';
import { useNetworkWalletClient } from '../../hooks/useNetworkWalletClient';
import { useCanUserCreateProposal } from '../../hooks/utils/useCanUserSubmitProposal';
import { useDAOStore } from '../../providers/App/AppProvider';
import { useNetworkConfigStore } from '../../providers/NetworkConfig/useNetworkConfigStore';
import { useProposalActionsStore } from '../../store/actions/useProposalActionsStore';
import { formatCoin } from '../../utils';
import { prepareRefillPaymasterAction } from '../../utils/dao/prepareRefillPaymasterActionData';
import { prepareWithdrawPaymasterAction } from '../../utils/dao/prepareWithdrawPaymasterActionData';
import { RefillGasData } from '../ui/modals/GaslessVoting/RefillGasTankModal';
import { WithdrawGasData } from '../ui/modals/GaslessVoting/WithdrawGasTankModal';
import { ModalType } from '../ui/modals/ModalProvider';
import { useDecentModal } from '../ui/modals/useDecentModal';
import Divider from '../ui/utils/Divider';

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
  const { bundlerMinimumStake } = useNetworkConfigStore();
  const { canUserCreateProposal } = useCanUserCreateProposal();

  const publicClient = useNetworkPublicClient();
  const nativeCurrency = publicClient.chain.nativeCurrency;
  const formattedMinStakeAmount = formatCoin(
    bundlerMinimumStake || 0n,
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
      px={6}
      py={2}
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
          <Text
            color="neutral-7"
            textStyle={isSettings ? 'labels-large' : 'helper-text'}
          >
            {isSettings ? t('gaslessVotingLabelSettings') : t('gaslessVotingLabel')}
          </Text>
          <Text textStyle={isSettings ? 'labels-large' : 'helper-text'}>
            {isSettings ? t('gaslessVotingDescriptionSettings') : t('gaslessVotingDescription')}
          </Text>
          {displayNeedStakingLabel && (
            <Text
              textStyle={isSettings ? 'labels-small' : 'helper-text'}
              color="neutral-7"
            >
              {t('gaslessStakingRequirement', {
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

export function GaslessVotingToggleDAOSettings(props: GaslessVotingToggleProps) {
  const { t } = useTranslation('gaslessVoting');
  const {
    addressPrefix,
    contracts: { accountAbstraction },
    bundlerMinimumStake,
    nativeTokenIcon,
  } = useNetworkConfigStore();

  const navigate = useNavigate();
  const publicClient = useNetworkPublicClient();
  const nativeCurrency = publicClient.chain.nativeCurrency;

  const { daoKey } = useCurrentDAOKey();
  const {
    node: { safe },
    governance: { gaslessVotingEnabled, paymasterAddress },
  } = useDAOStore({ daoKey });
  const { depositInfo } = usePaymasterDepositInfo();

  const { addAction, resetActions } = useProposalActionsStore();
  const { data: walletClient } = useNetworkWalletClient();

  const withdrawGas = useDecentModal(ModalType.WITHDRAW_GAS, {
    onWithdraw: async (withdrawGasData: WithdrawGasData) => {
      if (!safe?.address || !paymasterAddress) {
        return;
      }

      const action = prepareWithdrawPaymasterAction({
        withdrawData: withdrawGasData,
        paymasterAddress,
      });
      const formattedWithdrawAmount = formatCoin(
        withdrawGasData.withdrawAmount,
        true,
        nativeCurrency.decimals,
        nativeCurrency.symbol,
        false,
      );

      resetActions();
      addAction({
        ...action,
        content: (
          <Box>
            <Text>
              {t('withdrawGasAction', {
                amount: formattedWithdrawAmount,
                symbol: nativeCurrency.symbol,
              })}
            </Text>
          </Box>
        ),
      });

      navigate(DAO_ROUTES.proposalWithActionsNew.relative(addressPrefix, safe.address));
    },
  });

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
      resetActions();
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
  const gaslessStakingEnabled = gaslessFeatureEnabled && bundlerMinimumStake !== undefined;
  if (!gaslessFeatureEnabled) return null;

  const paymasterBalance = depositInfo?.balance || 0n;
  const stakedAmount = depositInfo?.stake || 0n;
  const minStakeAmount = bundlerMinimumStake || 0n;
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
    <Flex
      display="flex"
      flexDirection="column"
      border="1px solid"
      borderColor="neutral-3"
      borderRadius="0.75rem"
      mb={2}
    >
      <GaslessVotingToggleContent
        {...props}
        isSettings
        displayNeedStakingLabel={gaslessStakingEnabled && stakedAmount < minStakeAmount}
      />

      {gaslessVotingEnabled && (
        <>
          <Divider />
          <Flex
            px={6}
            py={2}
            justifyContent="space-between"
          >
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
                  src={nativeTokenIcon}
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

            <Flex gap="0.5rem">
              <Button
                variant="secondary"
                size="sm"
                onClick={withdrawGas}
              >
                {t('withdrawGas')}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={refillGas}
              >
                {t('addGas')}
              </Button>
            </Flex>
          </Flex>
        </>
      )}

      {gaslessStakingEnabled && (
        <>
          <Divider />
          <Flex
            px={6}
            py={2}
            justifyContent="space-between"
          >
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
                  src={nativeTokenIcon}
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
        </>
      )}
    </Flex>
  );
}
