import { Button, Flex, Grid, GridItem, Text } from '@chakra-ui/react';
import { Field, FieldArray, FieldAttributes, useFormikContext } from 'formik';
import { useTranslation } from 'react-i18next';
import { SettingsContentBox } from '../../../../components/SafeSettings/SettingsContentBox';
import DurationUnitStepperInput from '../../../../components/ui/forms/DurationUnitStepperInput';
import { AddressInput } from '../../../../components/ui/forms/EthAddressInput';
import { LabelComponent } from '../../../../components/ui/forms/InputComponent';
import { DisplayAddress } from '../../../../components/ui/links/DisplayAddress';
import { BarLoader } from '../../../../components/ui/loaders/BarLoader';
import {
  SafeSettingsEdits,
  SafeSettingsFormikErrors,
} from '../../../../components/ui/modals/SafeSettingsModal';
import { useCurrentDAOKey } from '../../../../hooks/DAO/useCurrentDAOKey';
import { useDAOStore } from '../../../../providers/App/AppProvider';
import { BigIntValuePair } from '../../../../types';

function AddedToken({ address }: { address: string }) {
  return (
    <Grid
      templateColumns="repeat(2, 1fr)"
      gap={4}
    >
      <GridItem p={3}>
        <AddressInput
          value={address}
          isDisabled={true}
          marginTop="-0.25rem"
        />
      </GridItem>
    </Grid>
  );
}

function NewToken({ name }: { name: string }) {
  const { errors } = useFormikContext<SafeSettingsEdits>();
  const stakingErrors = (errors as SafeSettingsFormikErrors | undefined)?.staking;

  return (
    <Grid
      templateColumns="repeat(2, 1fr)"
      gap={4}
    >
      <GridItem p={3}>
        <Field name={name}>
          {({ field }: FieldAttributes<any>) => (
            <AddressInput
              {...field}
              isInvalid={
                !!field.value &&
                stakingErrors?.newRewardTokens !== undefined &&
                stakingErrors.newRewardTokens.findIndex(a => `staking.${a.key}` === name) !== -1
              }
              marginTop="-0.25rem"
            />
          )}
        </Field>
      </GridItem>
    </Grid>
  );
}

function StakingForm() {
  const { t } = useTranslation('staking');
  const { daoKey } = useCurrentDAOKey();
  const {
    governance: { stakedToken },
  } = useDAOStore({ daoKey });
  const { values, setFieldValue } = useFormikContext<SafeSettingsEdits>();

  const { address, minimumStakingPeriod, rewardsTokens } = stakedToken || {};
  const minPeriodValue = Number(
    values.staking?.minimumStakingPeriod?.bigintValue || minimumStakingPeriod || 0n,
  );

  return (
    <>
      {address ? (
        <DisplayAddress
          address={address}
          color="color-charcoal-50"
          textStyle="text-sm-underlined"
          p={0}
        >
          {address}
        </DisplayAddress>
      ) : null}

      <LabelComponent
        label={t('stakingPeriod')}
        isRequired
        gridContainerProps={{
          my: 6,
          templateColumns: '1fr',
          width: { base: '100%', md: '50%' },
        }}
      >
        <DurationUnitStepperInput
          secondsValue={minPeriodValue}
          onSecondsValueChange={val => {
            const notNullVal = val || 0;
            const newMinPeriodValue: BigIntValuePair = {
              bigintValue: BigInt(notNullVal),
              value: notNullVal?.toString(),
            };
            setFieldValue('staking.minimumStakingPeriod', newMinPeriodValue);
          }}
          hideSteppers
        />
      </LabelComponent>

      <FieldArray name="staking.newRewardTokens">
        {({ push }) => {
          return (
            <Flex
              gap={2}
              direction="column"
            >
              <LabelComponent
                label={t('rewardTokensTitle')}
                isRequired={false}
                gridContainerProps={{
                  my: 6,
                  templateColumns: '1fr',
                  width: { base: '100%' },
                }}
                helper={t('rewardTokensHelper')}
              >
                <>
                  {rewardsTokens?.map(token => (
                    <AddedToken
                      key={token}
                      address={token}
                    />
                  ))}

                  {values.staking?.newRewardTokens?.map((_, index) => (
                    <NewToken
                      key={`staking.newRewardTokens.${index}`}
                      name={`staking.newRewardTokens.${index}`}
                    />
                  ))}
                </>
              </LabelComponent>

              <Flex justify="end">
                <Flex>
                  <Button
                    variant="secondary"
                    size="md"
                    px={4}
                    onClick={() => {
                      console.debug('hey');
                      push('');
                    }}
                  >
                    {t('addRewardToken')}
                  </Button>
                </Flex>
              </Flex>
            </Flex>
          );
        }}
      </FieldArray>
    </>
  );
}

export function SafeStakingSettingsPage() {
  const { t } = useTranslation('staking');

  const { daoKey } = useCurrentDAOKey();
  const {
    node: { safe },
    governance: { stakedToken },
  } = useDAOStore({ daoKey });

  const { values, setFieldValue } = useFormikContext<SafeSettingsEdits>();
  const deploying = values.staking?.deploying || false;
  const showForm = stakedToken?.address !== undefined || deploying;

  function NoStakingContract() {
    return (
      <Flex
        flexDirection="column"
        gap="1rem"
      >
        <Text
          textStyle="text-sm-regular"
          color="color-white"
        >
          {t('stakingNull')}
        </Text>
        <Button
          mt={1.5}
          width="fit-content"
          onClick={() => setFieldValue('staking.deploying', true)}
        >
          {t('deployStaking')}
        </Button>
      </Flex>
    );
  }

  return (
    <>
      {!!safe ? (
        <SettingsContentBox
          px={12}
          py={6}
        >
          <Text
            textStyle="text-lg-regular"
            color="color-white"
          >
            {t('stakingTitle')}
          </Text>
          {showForm ? <StakingForm /> : <NoStakingContract />}
        </SettingsContentBox>
      ) : (
        <Flex
          h="8.5rem"
          width="100%"
          alignItems="center"
          justifyContent="center"
        >
          <BarLoader />
        </Flex>
      )}
    </>
  );
}
