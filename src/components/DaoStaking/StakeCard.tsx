import { Flex, Tab, TabList, Tabs, Text, TabPanel, TabPanels, Button } from '@chakra-ui/react';
import { Formik, useFormikContext } from 'formik';
import { useTranslation } from 'react-i18next';
import { formatUnits } from 'viem';
import * as Yup from 'yup';
import { useCurrentDAOKey } from '../../hooks/DAO/useCurrentDAOKey';
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
            {/* TODO: Add to translations */}
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
    governance: { stakedToken, votesToken },
  } = useDAOStore({ daoKey });

  const stakedTokenSymbol = stakedToken?.symbol || '';
  const maxAvailableToStake = formatUnits(votesToken?.balance || 0n, votesToken?.decimals || 0);

  const unStakedTokenSymbol = votesToken?.symbol || '';
  const maxAvailableToUnstake = formatUnits(stakedToken?.balance || 0n, stakedToken?.decimals || 0);

  // Define validation schema inside component to access translation function
  const validationSchema = Yup.object({
    amount: Yup.object({
      value: Yup.string().required(),
      bigintValue: Yup.mixed<bigint>().required(),
    }),
    mode: Yup.string().required(),
  });

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
            onSubmit={values => {
              console.log('🚀 ~ values:', values);
            }}
          >
            {({ handleSubmit, setFieldValue }) => (
              <form
                onSubmit={e => {
                  // TODO: going to add toast error handling here
                  handleSubmit(e);
                }}
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
                        tokenDecimals={votesToken?.decimals || 0}
                        maxButtonOnClick={() =>
                          setFieldValue('amount', {
                            value: maxAvailableToStake,
                            bigintValue: votesToken?.balance,
                          })
                        }
                        buttonsDisabled={!votesToken?.balance || votesToken?.balance === 0n}
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
