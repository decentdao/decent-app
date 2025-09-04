import { Flex, Tab, TabList, Tabs, Text, TabPanel, TabPanels, Button } from '@chakra-ui/react';
import { abis } from '@decentdao/decent-contracts';
import { Formik, useFormikContext } from 'formik';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { formatUnits, getContract } from 'viem';
import * as Yup from 'yup';
import { useCurrentDAOKey } from '../../hooks/DAO/useCurrentDAOKey';
import { useNetworkWalletClient } from '../../hooks/useNetworkWalletClient';
import { useTransaction } from '../../hooks/utils/useTransaction';
import { useDAOStore } from '../../providers/App/AppProvider';
import { BigIntValuePair } from '../../types';
import { BigIntInput } from '../ui/forms/BigIntInput';
import { StakingAdditionalInfo, UnstakeAdditionalInfo } from './AdditionalInfo';

const MODES = ['stake', 'unstake'] as const;
type Mode = (typeof MODES)[number];
interface StakeFormProps {
  mode: Mode;
  amount: BigIntValuePair;
}

function StakeFormPanel({
  maxAvailableValue,
  tokenSymbol,
  tokenDecimals,
  maxButtonOnClick,
  buttonsDisabled,
  mode,
  needsApproval,
  onApprove,
}: {
  maxAvailableValue: string;
  tokenSymbol: string;
  tokenDecimals: number;
  maxButtonOnClick: () => void;
  buttonsDisabled: boolean;
  mode: Mode;
  needsApproval?: boolean;
  onApprove?: () => void;
}) {
  const { t } = useTranslation('staking');
  const { values, setFieldValue } = useFormikContext<StakeFormProps>();
  return (
    <Flex
      direction="column"
      alignItems="flex-start"
      gap={2}
      alignSelf="stretch"
    >
      <Flex
        direction="column"
        alignItems="flex-start"
        gap={2}
        alignSelf="stretch"
      >
        <Flex
          alignItems="flex-start"
          alignSelf="stretch"
        >
          <Text
            color="color-content-muted"
            textStyle="text-xs-regular"
          >
            {mode === 'stake' ? t('amountToStake') : t('amountToUnstake')}
          </Text>
        </Flex>

        <BigIntInput
          size="xl"
          placeholder="0.00"
          value={values.amount?.bigintValue}
          decimalPlaces={tokenDecimals}
          parentFormikValue={values.amount}
          onChange={value => {
            setFieldValue('amount', value);
          }}
        />

        <Flex
          justifyContent="space-between"
          alignItems="center"
          alignSelf="stretch"
        >
          <Text
            color="color-content-content1-foreground"
            textStyle="text-xs-regular"
          >
            {t('availableBalance')}
            <Text
              as="span"
              color="color-content-content4-foreground"
            >
              {`${maxAvailableValue} ${tokenSymbol}`}
            </Text>
          </Text>

          <Button
            size="sm"
            variant="secondaryV1"
            onClick={maxButtonOnClick}
            isDisabled={buttonsDisabled}
          >
            {t('maxButton')}
          </Button>
        </Flex>
      </Flex>

      <Flex
        padding="12px 0px"
        justifyContent="flex-end"
        alignItems="flex-start"
        gap={2}
        alignSelf="stretch"
      >
        <Button
          size="lg"
          w="full"
          type={mode === 'stake' && needsApproval ? 'button' : 'submit'}
          isDisabled={buttonsDisabled}
          onClick={mode === 'stake' && needsApproval ? onApprove : undefined}
        >
          {mode === 'stake' && needsApproval
            ? t('approveButton', { symbol: tokenSymbol })
            : mode === 'stake'
              ? t('stakeButton', { symbol: tokenSymbol })
              : t('unstakeButton', { symbol: tokenSymbol })}
        </Button>
      </Flex>
    </Flex>
  );
}

export default function StakeCard() {
  const { t } = useTranslation('staking');
  const { daoKey } = useCurrentDAOKey();
  const {
    governance: { isAzorius, stakedToken, votesToken, erc20Token },
  } = useDAOStore({ daoKey });
  const unstakedToken = useMemo(
    () => (isAzorius ? votesToken : erc20Token),
    [isAzorius, votesToken, erc20Token],
  );

  const { data: walletClient } = useNetworkWalletClient();
  const [contractCall, contractCallPending] = useTransaction();

  const stakedTokenSymbol = stakedToken?.symbol || '';
  const maxAvailableToUnstake = formatUnits(stakedToken?.balance || 0n, stakedToken?.decimals || 0);

  const unStakedTokenSymbol = unstakedToken?.symbol || '';
  const maxAvailableToStake = formatUnits(
    unstakedToken?.balance || 0n,
    unstakedToken?.decimals || 0,
  );

  // Get allowance from store
  const allowance = unstakedToken?.allowance || 0n;

  // Define validation schema inside component to access translation function
  const validationSchema = Yup.object({
    amount: Yup.object({
      value: Yup.string().required(),
      bigintValue: Yup.mixed<bigint>().required(),
    }),
    mode: Yup.string().required(),
  });

  async function handleApprove(amount: bigint) {
    if (!walletClient || !unstakedToken?.address || !stakedToken?.address) return;

    const tokenContract = getContract({
      address: unstakedToken.address,
      abi: abis.deployables.VotesERC20V1,
      client: walletClient,
    });

    const formattedAmount = formatUnits(amount, unstakedToken.decimals || 0);

    contractCall({
      contractFn: () => tokenContract.write.approve([stakedToken.address, amount]),
      pendingMessage: t('approvePending', { amount: formattedAmount, symbol: unStakedTokenSymbol }),
      successMessage: t('approveSuccess', { amount: formattedAmount, symbol: unStakedTokenSymbol }),
      failedMessage: t('approveError'),
      successCallback: () => {
        // Allowance will be updated automatically via event listeners
      },
    });
  }

  async function stakedFormHandler(values: StakeFormProps) {
    if (!walletClient || !stakedToken?.address) return;

    const { mode, amount } = values;

    if (!amount.bigintValue) {
      toast.error(t('requiredField'));
      return;
    }

    // Balance validation with toast notifications
    if (mode === 'stake') {
      if (!unstakedToken?.balance || amount.bigintValue > unstakedToken.balance) {
        toast.error(t('insufficientBalance'));
        return;
      }
    } else {
      if (!stakedToken?.balance || amount.bigintValue > stakedToken.balance) {
        toast.error(t('insufficientBalance'));
        return;
      }
    }

    const stakingContract = getContract({
      address: stakedToken?.address,
      abi: abis.deployables.VotesERC20StakedV1,
      client: walletClient,
    });

    const tokenSymbol = mode === 'stake' ? unStakedTokenSymbol : stakedTokenSymbol;
    const formattedAmount = formatUnits(
      amount.bigintValue,
      mode === 'stake' ? unstakedToken?.decimals || 0 : stakedToken?.decimals || 0,
    );

    contractCall({
      contractFn: () => {
        if (mode === 'stake') {
          return stakingContract.write.stake([amount.bigintValue!]);
        } else {
          return stakingContract.write.unstake([amount.bigintValue!]);
        }
      },
      pendingMessage:
        mode === 'stake'
          ? t('stakingPending', { amount: formattedAmount, symbol: tokenSymbol })
          : t('unstakingPending', { amount: formattedAmount, symbol: tokenSymbol }),
      successMessage:
        mode === 'stake'
          ? t('stakingSuccess', { amount: formattedAmount, symbol: tokenSymbol })
          : t('unstakingSuccess', { amount: formattedAmount, symbol: tokenSymbol }),
      failedMessage: mode === 'stake' ? t('stakingError') : t('unstakingError'),
    });
  }

  return (
    <Flex
      direction="column"
      alignItems="flex-start"
      gap="16px"
    >
      <Flex
        alignItems="flex-start"
        gap={3}
        alignSelf="stretch"
        sx={{ '& form': { width: 'full' } }}
      >
        <Formik<StakeFormProps>
          initialValues={{
            amount: { value: '', bigintValue: undefined },
            mode: MODES[0],
          }}
          validationSchema={validationSchema}
          onSubmit={stakedFormHandler}
        >
          {({ handleSubmit, setFieldValue, values }) => {
            const needsApproval =
              values.mode === 'stake' &&
              values.amount.bigintValue &&
              values.amount.bigintValue > allowance;

            return (
              <form onSubmit={handleSubmit}>
                <Tabs
                  variant="solid"
                  size="md"
                  w="full"
                  // ensure tabs are unmounted; this is to prevent memory leaks
                  isLazy
                  lazyBehavior="unmount"
                  onChange={index => {
                    setFieldValue('mode', MODES[index]);
                    setFieldValue('amount', { value: '', bigintValue: undefined });
                  }}
                >
                  <TabList w="fit-content">
                    <Tab>{t('stakeTab')}</Tab>
                    <Tab>{t('unstakeTab')}</Tab>
                  </TabList>

                  <TabPanels>
                    <TabPanel w="full">
                      <StakeFormPanel
                        maxAvailableValue={maxAvailableToStake}
                        tokenSymbol={unStakedTokenSymbol}
                        tokenDecimals={unstakedToken?.decimals || 0}
                        maxButtonOnClick={() =>
                          setFieldValue('amount', {
                            value: maxAvailableToStake,
                            bigintValue: unstakedToken?.balance,
                          })
                        }
                        buttonsDisabled={
                          !unstakedToken?.balance ||
                          unstakedToken?.balance === 0n ||
                          contractCallPending
                        }
                        mode="stake"
                        needsApproval={!!needsApproval}
                        onApprove={() =>
                          values.amount.bigintValue && handleApprove(values.amount.bigintValue)
                        }
                      />
                      <StakingAdditionalInfo />
                    </TabPanel>
                    <TabPanel w="full">
                      <StakeFormPanel
                        maxAvailableValue={maxAvailableToUnstake}
                        tokenSymbol={stakedTokenSymbol}
                        tokenDecimals={stakedToken?.decimals || 0}
                        maxButtonOnClick={() =>
                          setFieldValue('amount', {
                            value: maxAvailableToUnstake,
                            bigintValue: stakedToken?.balance,
                          })
                        }
                        buttonsDisabled={
                          !stakedToken?.balance ||
                          stakedToken?.balance === 0n ||
                          contractCallPending
                        }
                        mode="unstake"
                      />
                      <UnstakeAdditionalInfo />
                    </TabPanel>
                  </TabPanels>
                </Tabs>
              </form>
            );
          }}
        </Formik>
      </Flex>
    </Flex>
  );
}
