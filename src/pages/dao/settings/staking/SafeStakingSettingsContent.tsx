import { Button, Flex, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { SettingsContentBox } from '../../../../components/SafeSettings/SettingsContentBox';
import DurationUnitStepperInput from '../../../../components/ui/forms/DurationUnitStepperInput';
import { LabelComponent } from '../../../../components/ui/forms/InputComponent';
import { DisplayAddress } from '../../../../components/ui/links/DisplayAddress';
import { BarLoader } from '../../../../components/ui/loaders/BarLoader';
import { useCurrentDAOKey } from '../../../../hooks/DAO/useCurrentDAOKey';
import { useDAOStore } from '../../../../providers/App/AppProvider';

export function SafeStakingSettingsContent() {
  const { t } = useTranslation('staking');

  const { daoKey } = useCurrentDAOKey();
  const {
    node: { safe },
    governance: { stakingAddress },
  } = useDAOStore({ daoKey });

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
          {stakingAddress ? (
            <>
              <DisplayAddress
                address={stakingAddress}
                color="color-charcoal-50"
                textStyle="text-sm-underlined"
                p={0}
              >
                {stakingAddress}
              </DisplayAddress>
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
                  secondsValue={0}
                  onSecondsValueChange={(val: number) => {
                    console.log(val);
                  }}
                  hideSteppers
                />
              </LabelComponent>
            </>
          ) : (
            <NoStakingContract />
          )}
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
