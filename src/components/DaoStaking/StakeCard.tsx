import { Flex, Tab, TabList, Tabs, Text, TabPanel, TabPanels, Button } from '@chakra-ui/react';
import { abis } from '@decentdao/decent-contracts';
import { Formik, useFormikContext } from 'formik';
import { useTranslation } from 'react-i18next';
import { formatUnits, getContract } from 'viem';
import * as Yup from 'yup';
import { useCurrentDAOKey } from '../../hooks/DAO/useCurrentDAOKey';
import { useNetworkWalletClient } from '../../hooks/useNetworkWalletClient';
import { useDAOStore } from '../../providers/App/AppProvider';
import { BigIntValuePair } from '../../types';
import { BigIntInput } from '../ui/forms/BigIntInput';
import { StakingAdditionalInfo } from './StakingAdditionalInfo';

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
    governance: { stakedToken, votesToken, erc20Token },
  } = useDAOStore({ daoKey });
  const unstakedToken = erc20Token ?? votesToken;

  const { data: walletClient } = useNetworkWalletClient()

  const stakedTokenSymbol = stakedToken?.symbol || '';
  const maxAvailableToUnstake = formatUnits(stakedToken?.balance || 0n, stakedToken?.decimals || 0);
  
  const unStakedTokenSymbol = unstakedToken?.symbol || '';
  const maxAvailableToStake = formatUnits(unstakedToken?.balance || 0n, unstakedToken?.decimals || 0);

  // Define validation schema inside component to access translation function
  const validationSchema = Yup.object({
    amount: Yup.object({
      value: Yup.string().required(),
      bigintValue: Yup.mixed<bigint>().required().test('is-positive', 'Amount must be positive', value => value > 0n),
    }),
    mode: Yup.string().required(),
  });

  async function stakedFormHandler(values: StakeFormProps) {
    if(!walletClient || !stakedToken?.address ) return;

    const { mode, amount } = values;
    const stakingContract = getContract({
      address: stakedToken?.address,
      abi: abis.deployables.VotesERC20StakedV1,
      client: walletClient,
    });

    if(!amount.bigintValue) {
      throw new Error('Amount is required');
    }

    if(mode === 'stake') {
      await stakingContract.write.stake([amount.bigintValue]);
    } else {
      await stakingContract.write.unstake([amount.bigintValue]);
    }
  }

  return (
    <Flex
      direction="column"
      alignItems="flex-start"
      gap="16px"
    >
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
            {({ handleSubmit, setFieldValue }) => (
              <form
                onSubmit={handleSubmit}
              >
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
                        buttonsDisabled={!unstakedToken?.balance || unstakedToken?.balance === 0n}
                        mode="stake"
                      />
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
                        buttonsDisabled={!stakedToken?.balance || stakedToken?.balance === 0n}
                        mode="unstake"
                      />
                    </TabPanel>
                  </TabPanels>
                </Tabs>
              </form>
            )}
          </Formik>
        </Flex>
        <StakingAdditionalInfo />
      </Flex>
    </Flex>
  );
}
