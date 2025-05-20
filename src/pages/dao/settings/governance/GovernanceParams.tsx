import { Box, Flex, InputGroup, InputRightElement } from '@chakra-ui/react';
import { abis } from '@fractal-framework/fractal-contracts';
import { useFormikContext } from 'formik';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { getContract } from 'viem';
import { BigIntInput } from '../../../../components/ui/forms/BigIntInput';
import DurationUnitStepperInput from '../../../../components/ui/forms/DurationUnitStepperInput';
import { LabelComponent } from '../../../../components/ui/forms/InputComponent';
import { BarLoader } from '../../../../components/ui/loaders/BarLoader';
import { SafeSettingsEdits } from '../../../../components/ui/modals/SafeSettingsModal';
import Divider from '../../../../components/ui/utils/Divider';
import { useCurrentDAOKey } from '../../../../hooks/DAO/useCurrentDAOKey';
import useNetworkPublicClient from '../../../../hooks/useNetworkPublicClient';
import { useTimeHelpers } from '../../../../hooks/utils/useTimeHelpers';
import { useStore } from '../../../../providers/App/AppProvider';
import { AzoriusGovernance, FreezeGuardType } from '../../../../types';
import { blocksToSeconds } from '../../../../utils/contract';

export function GovernanceParams() {
  const { t } = useTranslation(['dashboard', 'daoCreate', 'common']);
  const { daoKey } = useCurrentDAOKey();
  const {
    governance,
    guardContracts: { freezeGuardType, freezeGuardContractAddress },
    node: { safe },
  } = useStore({ daoKey });

  const { values, setFieldValue } = useFormikContext<SafeSettingsEdits>();
  const publicClient = useNetworkPublicClient();
  const { getTimeDuration } = useTimeHelpers();

  const votingStrategy = governance.isAzorius
    ? (governance as AzoriusGovernance).votingStrategy
    : null;

  const existingQuorumPercentage = votingStrategy?.quorumPercentage?.value;
  const existingQuorumThreshold = votingStrategy?.quorumThreshold?.value;
  const existingVotingPeriod = votingStrategy?.votingPeriod?.value;

  const [existingTimelockPeriod, setExistingTimelockPeriod] = useState<bigint>();
  const [existingExecutionPeriod, setExistingExecutionPeriod] = useState<bigint>();

  useEffect(() => {
    const setTimelockAndExecutionInfo = async () => {
      if (freezeGuardType == FreezeGuardType.MULTISIG) {
        if (freezeGuardContractAddress && publicClient) {
          const freezeGuardContract = getContract({
            abi: abis.MultisigFreezeGuard,
            address: freezeGuardContractAddress,
            client: publicClient,
          });
          const [contractTimelockPeriod, contractExecutionPeriod] = await Promise.all([
            freezeGuardContract.read.timelockPeriod(),
            freezeGuardContract.read.executionPeriod(),
          ]);
          const [timelockSeconds, executionPeriodSeconds] = await Promise.all([
            blocksToSeconds(contractTimelockPeriod, publicClient),
            blocksToSeconds(contractExecutionPeriod, publicClient),
          ]);

          if (timelockSeconds !== undefined) {
            setExistingTimelockPeriod(BigInt(timelockSeconds / 60));
          }

          if (executionPeriodSeconds !== undefined) {
            setExistingExecutionPeriod(BigInt(executionPeriodSeconds));
          }
        }
      }

      const timelockPeriodSeconds = votingStrategy?.timeLockPeriod?.value;

      if (timelockPeriodSeconds) {
        setExistingTimelockPeriod(timelockPeriodSeconds / 60n);
      }

      const executionPeriodSeconds = votingStrategy?.executionPeriod?.value;
      console.log({ executionPeriodSeconds, ex: (executionPeriodSeconds ?? 1n) / 60n });
      if (executionPeriodSeconds) {
        setExistingExecutionPeriod(executionPeriodSeconds);
      }
    };

    setTimelockAndExecutionInfo();
  }, [
    freezeGuardType,
    freezeGuardContractAddress,
    getTimeDuration,
    publicClient,
    votingStrategy?.timeLockPeriod?.value,
    votingStrategy?.executionPeriod?.value,
  ]);

  const handleInputChange = useCallback(
    (
      field: string,
      inputValue: bigint | undefined,
      existingValue: bigint | undefined,
      otherInputValues: (bigint | undefined)[],
    ) => {
      const newValue = inputValue !== existingValue ? inputValue : undefined;

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
                <BigIntInput
                  value={values.azorius?.quorumPercentage ?? existingQuorumPercentage}
                  color={values.azorius?.quorumPercentage === undefined ? 'neutral-7' : 'white-0'}
                  decimalPlaces={0}
                  onChange={e =>
                    handleInputChange(
                      'azorius.quorumPercentage',
                      e.bigintValue,
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
              <BigIntInput
                value={values.azorius?.quorumThreshold ?? existingQuorumThreshold}
                minWidth="100%"
                decimalPlaces={0}
                color={values.azorius?.quorumThreshold === undefined ? 'neutral-7' : 'white-0'}
                onChange={e =>
                  handleInputChange(
                    'azorius.quorumThreshold',
                    e.bigintValue,
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
              <DurationUnitStepperInput
                secondsValue={Number(values.azorius?.votingPeriod ?? existingVotingPeriod)}
                color={values.azorius?.votingPeriod === undefined ? 'neutral-7' : 'white-0'}
                onSecondsValueChange={valInSeconds => {
                  handleInputChange(
                    'azorius.votingPeriod',
                    BigInt(valInSeconds),
                    existingVotingPeriod,
                    [
                      values.azorius?.quorumPercentage,
                      values.azorius?.quorumThreshold,
                      values.azorius?.timelockPeriod,
                      values.azorius?.executionPeriod,
                    ],
                  );
                }}
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
                <BigIntInput
                  value={values.azorius?.timelockPeriod ?? existingTimelockPeriod}
                  minWidth="100%"
                  color={values.azorius?.timelockPeriod === undefined ? 'neutral-7' : 'white-0'}
                  decimalPlaces={0}
                  onChange={e =>
                    handleInputChange(
                      'azorius.timelockPeriod',
                      e.bigintValue,
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
              <DurationUnitStepperInput
                secondsValue={Number(values.azorius?.executionPeriod ?? existingExecutionPeriod)}
                color={values.azorius?.executionPeriod === undefined ? 'neutral-7' : 'white-0'}
                onSecondsValueChange={valInSeconds =>
                  handleInputChange(
                    'azorius.executionPeriod',
                    BigInt(valInSeconds),
                    existingExecutionPeriod,
                    [
                      values.azorius?.quorumPercentage,
                      values.azorius?.quorumThreshold,
                      values.azorius?.timelockPeriod,
                      values.azorius?.votingPeriod,
                    ],
                  )
                }
              />
            </LabelComponent>
          </Flex>
        </>
      )}
    </Box>
  );
}
