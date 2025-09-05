import { Flex, Tab, TabList, Tabs, Text, TabPanel, TabPanels, Button } from '@chakra-ui/react';
import { abis } from '@decentdao/decent-contracts';
import { Formik, FormikHelpers, useFormikContext } from 'formik';
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
}: {
  maxAvailableValue: string;
  tokenSymbol: string;
  tokenDecimals: number;
  maxButtonOnClick: () => void;
  buttonsDisabled: boolean;
  mode: Mode;
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
            textStyle="text-sm-regular"
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
          type="submit"
          isDisabled={buttonsDisabled}
        >
          {mode === 'stake'
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
    () =>
      !isAzorius
        ? // if not azorius, return erc20 token as unstaked token
          erc20Token
        : stakedToken?.address === votesToken?.address
          ? // if staked token is the same as votes token, return erc20 token as unstaked token
            erc20Token
          : // else return votes token as unstaked token
            votesToken,
    [isAzorius, votesToken, erc20Token, stakedToken?.address],
  );

  const { data: walletClient } = useNetworkWalletClient();
  const [approveCall, approveCallPending] = useTransaction();
  const [stakeCall, stakeCallPending] = useTransaction();
  const [unstakeCall, unstakeCallPending] = useTransaction();

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

  async function stakedFormHandler(
    values: StakeFormProps,
    formikHelpers: FormikHelpers<StakeFormProps>,
  ) {
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

    // For staking, check if approval is needed and use multicall if necessary
    if (mode === 'stake' && unstakedToken?.address) {
      const needsApproval = amount.bigintValue > allowance;

      if (needsApproval) {
        const tokenContract = getContract({
          address: unstakedToken.address,
          abi: abis.deployables.VotesERC20V1,
          client: walletClient,
        });
        // Approve token transfer to staking contract
        approveCall({
          contractFn: () => tokenContract.write.approve([stakedToken.address, amount.bigintValue!]),
          pendingMessage: t('approvePending', { amount: formattedAmount, symbol: tokenSymbol }),
          successMessage: t('approveSuccess', { amount: formattedAmount, symbol: tokenSymbol }),
          failedMessage: t('approveError'),
          successCallback: async () => {
            // Stake after approval is successful
            stakeCall({
              contractFn: () => stakingContract.write.stake([amount.bigintValue!]),
              pendingMessage: t('stakingPending', {
                amount: formattedAmount,
                symbol: tokenSymbol,
              }),
              successMessage: t('stakingSuccess', {
                amount: formattedAmount,
                symbol: tokenSymbol,
              }),
              failedMessage: t('stakingError'),
              successCallback: () => {
                formikHelpers.resetForm();
              },
            });
          },
        });
      } else {
        // Just stake without approval
        stakeCall({
          contractFn: () => stakingContract.write.stake([amount.bigintValue!]),
          pendingMessage: t('stakingPending', { amount: formattedAmount, symbol: tokenSymbol }),
          successMessage: t('stakingSuccess', { amount: formattedAmount, symbol: tokenSymbol }),
          failedMessage: t('stakingError'),
          successCallback: () => {
            formikHelpers.resetForm();
          },
        });
      }
    } else {
      // Unstaking
      unstakeCall({
        contractFn: () => stakingContract.write.unstake([amount.bigintValue!]),
        pendingMessage: t('unstakingPending', { amount: formattedAmount, symbol: tokenSymbol }),
        successMessage: t('unstakingSuccess', { amount: formattedAmount, symbol: tokenSymbol }),
        failedMessage: t('unstakingError'),
        successCallback: () => {
          formikHelpers.resetForm();
        },
      });
    }
  }

  const pending = approveCallPending || stakeCallPending || unstakeCallPending;
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
            mode: MODES[0],
            amount: { value: '', bigintValue: undefined },
          }}
          validationSchema={validationSchema}
          onSubmit={stakedFormHandler}
        >
          {({ handleSubmit, setFieldValue }) => {
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
                          !unstakedToken?.balance || unstakedToken?.balance === 0n || pending
                        }
                        mode="stake"
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
                          !stakedToken?.balance || stakedToken?.balance === 0n || pending
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
