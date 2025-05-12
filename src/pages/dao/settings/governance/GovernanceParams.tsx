import { Box, Flex, Input } from '@chakra-ui/react';
import { useFormikContext } from 'formik';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { LabelComponent } from '../../../../components/ui/forms/InputComponent';
import { BarLoader } from '../../../../components/ui/loaders/BarLoader';
import { SafeSettingsEdits } from '../../../../components/ui/modals/SafeSettingsModal';
import Divider from '../../../../components/ui/utils/Divider';
import { useCurrentDAOKey } from '../../../../hooks/DAO/useCurrentDAOKey';
import { useStore } from '../../../../providers/App/AppProvider';
import { AzoriusGovernance } from '../../../../types';

export function GovernanceParams() {
  const { t } = useTranslation(['dashboard', 'daoCreate', 'common']);
  const { daoKey } = useCurrentDAOKey();
  const {
    governance,
    node: { safe },
  } = useStore({ daoKey });

  const { values, setFieldValue } = useFormikContext<SafeSettingsEdits>();

  const votingStrategy = governance.isAzorius
    ? (governance as AzoriusGovernance).votingStrategy
    : null;

  const existingQuorumPercentage = votingStrategy?.quorumPercentage?.value;
  const existingQuorumThreshold = votingStrategy?.quorumThreshold?.value;
  const existingVotingPeriod = votingStrategy?.votingPeriod?.value;
  const existingTimelockPeriod = votingStrategy?.timeLockPeriod?.value;
  const existingExecutionPeriod = votingStrategy?.executionPeriod?.value;

  const handleInputChange = useCallback(
    (field: string, existingValue: bigint | undefined, otherInputValues: (bigint | undefined)[]) =>
      (e: React.ChangeEvent<HTMLInputElement>) => {
        let newValue: bigint | undefined;

        if (e.target.value) {
          const inputValue: bigint = BigInt(e.target.value);
          newValue = inputValue !== existingValue ? inputValue : undefined;
        }

        setFieldValue(field, newValue);

        // if this chnage results in NONE of the existing values being changed, clear `azorius` field
        if (newValue === undefined && otherInputValues.every(value => value === undefined)) {
          setFieldValue('azorius', undefined);
        }
      },
    [setFieldValue],
  );

  if (!safe?.address || !governance.type) {
    return (
      <Flex
        h="8.5rem"
        width="100%"
        alignItems="center"
        justifyContent="center"
      >
        <BarLoader />
      </Flex>
    );
  }

  const inputGridContainerProps = {
    width: '100%',
    px: 6,
    mt: 2,
    templateColumns: { base: '1fr', md: '2fr 1fr' },
  };

  return (
    <Box data-testid="dashboard-daoGovernance">
      {!!existingQuorumPercentage && (
        <>
          <Flex alignItems="center">
            <LabelComponent
              isRequired={false}
              label={t('titleQuorum')}
              helper={t('helperQuorumERC20', { ns: 'daoCreate' })}
              gridContainerProps={inputGridContainerProps}
            >
              <Input
                value={
                  values.azorius?.quorumPercentage?.toString() ??
                  existingQuorumPercentage.toString()
                }
                onChange={handleInputChange('azorius.quorumPercentage', existingQuorumPercentage, [
                  values.azorius?.quorumThreshold,
                  values.azorius?.votingPeriod,
                  values.azorius?.timelockPeriod,
                  values.azorius?.executionPeriod,
                ])}
                minWidth="100%"
              />
            </LabelComponent>
          </Flex>
          <Divider />
        </>
      )}

      {!!existingQuorumThreshold && (
        <>
          <Flex
            alignItems="center"
            justifyContent="space-between"
            mb="0.25rem"
            gap="0.5rem"
          >
            <LabelComponent
              isRequired={false}
              label={t('titleQuorum')}
              helper={t('helperQuorumERC721', { ns: 'daoCreate' })}
              gridContainerProps={inputGridContainerProps}
            >
              <Input
                value={
                  values.azorius?.quorumThreshold?.toString() ?? existingQuorumThreshold.toString()
                }
                minWidth="100%"
                onChange={handleInputChange('azorius.quorumThreshold', existingQuorumThreshold, [
                  values.azorius?.quorumPercentage,
                  values.azorius?.votingPeriod,
                  values.azorius?.timelockPeriod,
                  values.azorius?.executionPeriod,
                ])}
              />
            </LabelComponent>
          </Flex>
          <Divider />
        </>
      )}
      {!!existingVotingPeriod && (
        <>
          <Flex
            alignItems="center"
            justifyContent="space-between"
            mb="0.25rem"
            gap="0.5rem"
          >
            <LabelComponent
              isRequired={false}
              label={t('titleVotingPeriod')}
              helper={t('helperVotingPeriod', { ns: 'daoCreate' })}
              gridContainerProps={inputGridContainerProps}
            >
              <Input
                value={values.azorius?.votingPeriod?.toString() ?? existingVotingPeriod.toString()}
                minWidth="100%"
                onChange={handleInputChange('azorius.votingPeriod', existingVotingPeriod, [
                  values.azorius?.quorumPercentage,
                  values.azorius?.quorumThreshold,
                  values.azorius?.timelockPeriod,
                  values.azorius?.executionPeriod,
                ])}
              />
            </LabelComponent>
          </Flex>
          <Divider />
        </>
      )}
      {!!existingTimelockPeriod && (
        <>
          <Flex
            alignItems="center"
            justifyContent="space-between"
            mb="0.25rem"
            gap="0.5rem"
          >
            <LabelComponent
              isRequired={false}
              label={t('titleTimelockPeriod')}
              helper={t('helperTimelockPeriod', { ns: 'daoCreate' })}
              gridContainerProps={inputGridContainerProps}
            >
              <Input
                value={
                  values.azorius?.timelockPeriod?.toString() ?? existingTimelockPeriod.toString()
                }
                minWidth="100%"
                onChange={handleInputChange('azorius.timelockPeriod', existingTimelockPeriod, [
                  values.azorius?.quorumPercentage,
                  values.azorius?.quorumThreshold,
                  values.azorius?.votingPeriod,
                  values.azorius?.executionPeriod,
                ])}
              />
            </LabelComponent>
          </Flex>
          <Divider />
        </>
      )}
      {!!existingExecutionPeriod && (
        <>
          <Flex
            alignItems="center"
            justifyContent="space-between"
            mb="0.25rem"
            gap="0.5rem"
          >
            <LabelComponent
              isRequired={false}
              label={t('titleExecutionPeriod')}
              helper={t('helperExecutionPeriod', { ns: 'daoCreate' })}
              gridContainerProps={inputGridContainerProps}
            >
              <Input
                value={
                  values.azorius?.executionPeriod?.toString() ?? existingExecutionPeriod.toString()
                }
                minWidth="100%"
                onChange={handleInputChange('azorius.executionPeriod', existingExecutionPeriod, [
                  values.azorius?.quorumPercentage,
                  values.azorius?.quorumThreshold,
                  values.azorius?.votingPeriod,
                  values.azorius?.timelockPeriod,
                ])}
              />
            </LabelComponent>
          </Flex>
        </>
      )}
    </Box>
  );
}
