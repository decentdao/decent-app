import { Button, Flex, Text } from '@chakra-ui/react';
import { useFormikContext } from 'formik';
import { useTranslation } from 'react-i18next';
import { SettingsContentBox } from '../../../../components/SafeSettings/SettingsContentBox';
import DurationUnitStepperInput from '../../../../components/ui/forms/DurationUnitStepperInput';
import { LabelComponent } from '../../../../components/ui/forms/InputComponent';
import { DisplayAddress } from '../../../../components/ui/links/DisplayAddress';
import { BarLoader } from '../../../../components/ui/loaders/BarLoader';
import { SafeSettingsEdits } from '../../../../components/ui/modals/SafeSettingsModal';
import { AssetSelector } from '../../../../components/ui/utils/AssetSelector';
import { useCurrentDAOKey } from '../../../../hooks/DAO/useCurrentDAOKey';
import { useDAOStore } from '../../../../providers/App/AppProvider';
import { BigIntValuePair } from '../../../../types';

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
          my: 2,
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

      <LabelComponent
        label={t('rewardTokensTitle')}
        isRequired={false}
        gridContainerProps={{
          templateColumns: '1fr',
          width: { base: '100%' },
        }}
        helper={t('rewardTokensHelper')}
      >
        <AssetSelector
          includeNativeToken
          canSelectMultiple
          defaultSelectedAddresses={rewardsTokens}
          onSelect={addresses => {
            setFieldValue('staking.newRewardTokens', addresses);
          }}
        />
      </LabelComponent>
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
