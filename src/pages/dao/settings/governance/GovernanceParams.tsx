import { Box, Flex, Input, InputGroup, InputRightElement, Text } from '@chakra-ui/react';
import { useFormikContext } from 'formik';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { LabelComponent } from '../../../../components/ui/forms/InputComponent';
import { NumberStepperInput } from '../../../../components/ui/forms/NumberStepperInput';
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
    (
      field: string,
      inputVal: string | undefined,
      existingValue: bigint | undefined,
      otherInputValues: (bigint | undefined)[],
    ) => {
      let newValue: bigint | undefined;

      if (inputVal && /^[+-]?\d+$/.test(inputVal)) {
        const inputValue: bigint = BigInt(inputVal);
        newValue = inputValue !== existingValue ? inputValue : undefined;
      } else if (inputVal) {
        console.warn(`Invalid input for BigInt conversion: ${inputVal}`);
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
      {existingQuorumPercentage !== undefined && (
        <>
          <Flex alignItems="center">
            <LabelComponent
              isRequired={false}
              label={t('titleQuorum')}
              helper={t('helperQuorumERC20', { ns: 'daoCreate' })}
              gridContainerProps={inputGridContainerProps}
            >
              <InputGroup>
                <Input
                  value={
                    values.azorius?.quorumPercentage?.toString() ??
                    existingQuorumPercentage.toString()
                  }
                  color={values.azorius?.quorumPercentage === undefined ? 'neutral-7' : 'white-0'}
                  onChange={e =>
                    handleInputChange(
                      'azorius.quorumPercentage',
                      e.target.value,
                      existingQuorumPercentage,
                      [
                        values.azorius?.quorumThreshold,
                        values.azorius?.votingPeriod,
                        values.azorius?.timelockPeriod,
                        values.azorius?.executionPeriod,
                      ],
                    )
                  }
                  minWidth="100%"
                />
                <InputRightElement color="neutral-5">%</InputRightElement>
              </InputGroup>
            </LabelComponent>
          </Flex>
          <Divider />
        </>
      )}

      {existingQuorumThreshold !== undefined && (
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
                color={values.azorius?.quorumThreshold === undefined ? 'neutral-7' : 'white-0'}
                onChange={e =>
                  handleInputChange(
                    'azorius.quorumThreshold',
                    e.target.value,
                    existingQuorumThreshold,
                    [
                      values.azorius?.quorumPercentage,
                      values.azorius?.votingPeriod,
                      values.azorius?.timelockPeriod,
                      values.azorius?.executionPeriod,
                    ],
                  )
                }
              />
            </LabelComponent>
          </Flex>
          <Divider />
        </>
      )}
      {existingVotingPeriod !== undefined && (
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
              <NumberStepperInput
                value={values.azorius?.votingPeriod?.toString() ?? existingVotingPeriod.toString()}
                color={values.azorius?.votingPeriod === undefined ? 'neutral-7' : 'white-0'}
                rightElement={<Text color="neutral-5">{t('minutesShort', { ns: 'common' })}</Text>}
                onChange={e =>
                  handleInputChange('azorius.votingPeriod', e, existingVotingPeriod, [
                    values.azorius?.quorumPercentage,
                    values.azorius?.quorumThreshold,
                    values.azorius?.timelockPeriod,
                    values.azorius?.executionPeriod,
                  ])
                }
              />
            </LabelComponent>
          </Flex>
          <Divider />
        </>
      )}
      {existingTimelockPeriod !== undefined && (
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
              <InputGroup>
                <Input
                  value={
                    values.azorius?.timelockPeriod?.toString() ?? existingTimelockPeriod.toString()
                  }
                  minWidth="100%"
                  color={values.azorius?.timelockPeriod === undefined ? 'neutral-7' : 'white-0'}
                  onChange={e =>
                    handleInputChange(
                      'azorius.timelockPeriod',
                      e.target.value,
                      existingTimelockPeriod,
                      [
                        values.azorius?.quorumPercentage,
                        values.azorius?.quorumThreshold,
                        values.azorius?.votingPeriod,
                        values.azorius?.executionPeriod,
                      ],
                    )
                  }
                />
                <InputRightElement color="neutral-5">
                  {t('minutesShort', { ns: 'common' })}
                </InputRightElement>
              </InputGroup>
            </LabelComponent>
          </Flex>
          <Divider />
        </>
      )}
      {existingExecutionPeriod !== undefined && (
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
              <NumberStepperInput
                value={
                  values.azorius?.executionPeriod?.toString() ?? existingExecutionPeriod.toString()
                }
                color={values.azorius?.executionPeriod === undefined ? 'neutral-7' : 'white-0'}
                rightElement={<Text color="neutral-5">{t('minutesShort', { ns: 'common' })}</Text>}
                onChange={e =>
                  handleInputChange('azorius.executionPeriod', e, existingExecutionPeriod, [
                    values.azorius?.quorumPercentage,
                    values.azorius?.quorumThreshold,
                    values.azorius?.timelockPeriod,
                    values.azorius?.votingPeriod,
                  ])
                }
              />
            </LabelComponent>
          </Flex>
        </>
      )}
    </Box>
  );
}
