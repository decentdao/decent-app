import { Box, Button, Flex, HStack, IconButton, Image, Switch, Text } from '@chakra-ui/react';
import { TrashSimple } from '@phosphor-icons/react';
import { useFormikContext } from 'formik';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { isAddress } from 'viem';
import useFeatureFlag from '../../helpers/environmentFeatureFlags';
import { usePaymasterDepositInfo } from '../../hooks/DAO/accountAbstraction/usePaymasterDepositInfo';
import { useCurrentDAOKey } from '../../hooks/DAO/useCurrentDAOKey';
import useNetworkPublicClient from '../../hooks/useNetworkPublicClient';
import { useCanUserCreateProposal } from '../../hooks/utils/useCanUserSubmitProposal';
import { createAccountSubstring } from '../../hooks/utils/useGetAccountName';
import { useDAOStore } from '../../providers/App/AppProvider';
import { useNetworkConfigStore } from '../../providers/NetworkConfig/useNetworkConfigStore';
import { formatCoin } from '../../utils';
import { ModalType } from '../ui/modals/ModalProvider';
import { SafeSettingsEdits, SafeSettingsFormikErrors } from '../ui/modals/SafeSettingsModal';
import { useDecentModal } from '../ui/modals/useDecentModal';
import Divider from '../ui/utils/Divider';

interface GaslessVotingToggleProps {
  isEnabled: boolean;
  onToggle: () => void;
}

function WithdrawingGasComponent() {
  const { t } = useTranslation('gaslessVoting');
  const { values, setFieldValue, errors: formErrors } = useFormikContext<SafeSettingsEdits>();
  const paymasterGasTankWithdrawError = (formErrors as SafeSettingsFormikErrors)?.paymasterGasTank
    ?.withdraw;

  const withdrawingGasAmount = values?.paymasterGasTank?.withdraw?.amount?.value;
  const nativeCurrency = useNetworkPublicClient().chain.nativeCurrency;

  if (!withdrawingGasAmount || paymasterGasTankWithdrawError !== undefined) return null;

  const recipientInput = values?.paymasterGasTank?.withdraw?.recipientAddress;
  const recipient =
    recipientInput !== undefined && isAddress(recipientInput)
      ? createAccountSubstring(recipientInput)
      : recipientInput;

  return (
    <Flex
      gap="0.5rem"
      alignItems="center"
    >
      <Text>
        {t('withdrawingGas', {
          amount: withdrawingGasAmount,
          symbol: nativeCurrency.symbol,
          recipient,
        })}
      </Text>
      <IconButton
        aria-label="Remove gas withdrawal action"
        icon={<TrashSimple />}
        variant="unstyled"
        minWidth="auto"
        color="color-error-500"
        sx={{ '&:disabled:hover': { color: 'inherit', opacity: 0.4 } }}
        type="button"
        data-testid="gasless-voting-withdraw-remove"
        onClick={() => setFieldValue('paymasterGasTank.withdraw', undefined)}
      />
    </Flex>
  );
}

function DepositingGasComponent() {
  const { t } = useTranslation('gaslessVoting');
  const { values, setFieldValue, errors: formErrors } = useFormikContext<SafeSettingsEdits>();

  const paymasterGasTankDepositError = (formErrors as SafeSettingsFormikErrors)?.paymasterGasTank
    ?.deposit?.amount;

  const depositingGasAmount = values?.paymasterGasTank?.deposit?.amount?.value;
  const nativeCurrency = useNetworkPublicClient().chain.nativeCurrency;

  if (
    values?.paymasterGasTank?.deposit?.isDirectDeposit ||
    !depositingGasAmount ||
    paymasterGasTankDepositError !== undefined
  )
    return null;

  return (
    <Flex
      gap="0.75rem"
      alignItems="center"
    >
      <Text>
        {t('depositingGas', {
          amount: depositingGasAmount,
          symbol: nativeCurrency.symbol,
        })}
      </Text>
      <IconButton
        aria-label="Remove gas deposit action"
        icon={<TrashSimple />}
        variant="unstyled"
        minWidth="auto"
        color="color-red-500"
        sx={{ '&:disabled:hover': { color: 'inherit', opacity: 0.4 } }}
        type="button"
        data-testid="gasless-voting-deposit-remove"
        onClick={() => setFieldValue('paymasterGasTank.deposit', undefined)}
      />
    </Flex>
  );
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
            color="color-neutral-300"
            textStyle={isSettings ? 'text-sm-medium' : 'helper-text'}
          >
            {isSettings ? t('gaslessVotingLabelSettings') : t('gaslessVotingLabel')}
          </Text>
          <Text textStyle={isSettings ? 'text-sm-medium' : 'helper-text'}>
            {isSettings ? t('gaslessVotingDescriptionSettings') : t('gaslessVotingDescription')}
          </Text>
          {displayNeedStakingLabel && (
            <Text
              textStyle={isSettings ? 'text-sm-medium' : 'helper-text'}
              color="color-neutral-300"
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
          data-testid="gasless-voting-toggle"
        />
      </HStack>
    </Box>
  );
}

export function GaslessVotingToggleDAOSettings(props: GaslessVotingToggleProps) {
  const { t } = useTranslation('gaslessVoting');
  const { bundlerMinimumStake, nativeTokenIcon } = useNetworkConfigStore();
  const settingsModalFormikContext = useFormikContext<SafeSettingsEdits>();

  const publicClient = useNetworkPublicClient();
  const nativeCurrency = publicClient.chain.nativeCurrency;

  const { daoKey } = useCurrentDAOKey();
  const {
    governance: { gaslessVotingEnabled },
  } = useDAOStore({ daoKey });
  const { depositInfo } = usePaymasterDepositInfo();

  const { open: openWithdrawGasModal } = useDecentModal(ModalType.WITHDRAW_GAS);
  const { open: openRefillGasModal } = useDecentModal(ModalType.REFILL_GAS);

  const gaslessFeatureEnabled = useFeatureFlag('flag_gasless_voting');
  const gaslessStakingEnabled = gaslessFeatureEnabled && bundlerMinimumStake !== undefined;

  const { values, setFieldValue } = settingsModalFormikContext;

  const paymasterGasTankEdits = values?.paymasterGasTank;
  useEffect(() => {
    if (
      paymasterGasTankEdits !== undefined &&
      paymasterGasTankEdits.withdraw === undefined &&
      paymasterGasTankEdits.deposit === undefined
    ) {
      setFieldValue('paymasterGasTank', undefined);
    }
  }, [paymasterGasTankEdits, setFieldValue]);

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

  const showWithdrawAndDepositButtons =
    paymasterGasTankEdits?.deposit?.isDirectDeposit ||
    (paymasterGasTankEdits?.withdraw === undefined && paymasterGasTankEdits?.deposit === undefined);

  return (
    <Flex
      display="flex"
      flexDirection="column"
      border="1px solid"
      borderColor="color-neutral-900"
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
                textStyle="text-xs-medium"
                color="color-neutral-300"
                mb="0.25rem"
              >
                {t('paymasterBalance')}
              </Text>
              <Text
                textStyle="text-sm-medium"
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
              <WithdrawingGasComponent />
              <DepositingGasComponent />
              {showWithdrawAndDepositButtons && (
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={openWithdrawGasModal}
                    data-testid="gasless-voting-withdraw-button"
                  >
                    {t('withdrawGas')}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={openRefillGasModal}
                    data-testid="gasless-voting-refill-button"
                  >
                    {t('addGas')}
                  </Button>
                </>
              )}
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
                textStyle="text-xs-medium"
                color="color-neutral-300"
                mb="0.25rem"
              >
                {t('paymasterStakedAmount')}
              </Text>
              <Text
                textStyle="text-sm-medium"
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
