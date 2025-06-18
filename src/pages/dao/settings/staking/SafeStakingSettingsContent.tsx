import { Button, Flex, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { Address } from 'viem';
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
          onClick={() => {}}
        >
          {t('deployStaking')}
        </Button>
      </Flex>
    );
  }

  function StakingPeriodForm({ stakingContractAddress }: { stakingContractAddress: Address }) {
    return (
      <>
        <DisplayAddress
          address={stakingContractAddress}
          color="color-charcoal-50"
          textStyle="text-sm-underlined"
          p={0}
        >
          {stakingContractAddress}
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
            onSecondsValueChange={() => {}}
            hideSteppers
          />
        </LabelComponent>

        <Flex
          flexDir="row"
          px={4}
          py={2}
          border="1px solid"
          borderColor="color-layout-border"
          borderRadius="0.75rem"
          mt={6}
        >
          <Flex
            flexDir="column"
            gap={2}
          >
            <Text
              textStyle="text-sm-regular"
              color="color-layout-foreground"
            >
              {t('includeStakingInVoting')}
            </Text>
            <Text
              textStyle="text-sm-regular"
              color="color-secondary-500"
            >
              {t('includeStakingInVotingDesc')}
            </Text>
          </Flex>
        </Flex>
      </>
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
            <StakingPeriodForm stakingContractAddress={stakingAddress} />
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
