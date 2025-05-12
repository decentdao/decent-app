import { Box, Flex, Input } from '@chakra-ui/react';
import { abis } from '@fractal-framework/fractal-contracts';
import { useFormikContext } from 'formik';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getContract } from 'viem';

import { LabelComponent } from '../../../../components/ui/forms/InputComponent';
import { BarLoader } from '../../../../components/ui/loaders/BarLoader';
import { SafeSettingsEdits } from '../../../../components/ui/modals/SafeSettingsModal';
import Divider from '../../../../components/ui/utils/Divider';
import { useCurrentDAOKey } from '../../../../hooks/DAO/useCurrentDAOKey';
import useNetworkPublicClient from '../../../../hooks/useNetworkPublicClient';
import { useTimeHelpers } from '../../../../hooks/utils/useTimeHelpers';
import { useStore } from '../../../../providers/App/AppProvider';
import { AzoriusGovernance, BigIntValuePair, FreezeGuardType } from '../../../../types';
import { blocksToSeconds } from '../../../../utils/contract';

export function GovernanceParams() {
  const { t } = useTranslation(['dashboard', 'daoCreate', 'common']);
  const { daoKey } = useCurrentDAOKey();
  const {
    governance,
    guardContracts: { freezeGuardType, freezeGuardContractAddress },
    node: { safe },
  } = useStore({ daoKey });
  const publicClient = useNetworkPublicClient();
  const { getTimeDuration } = useTimeHelpers();

  const { values, setFieldValue } = useFormikContext<SafeSettingsEdits>();

  const votingStrategy = governance.isAzorius
    ? (governance as AzoriusGovernance).votingStrategy
    : null;

  const existingQuorumPercentage = votingStrategy?.quorumPercentage;
  const existingQuorumThreshold = votingStrategy?.quorumThreshold;
  const existingVotingPeriod = votingStrategy?.votingPeriod;
  const existingTimelockPeriod = votingStrategy?.timeLockPeriod;
  const existingExecutionPeriod = votingStrategy?.executionPeriod;

  useEffect(() => {
    const setTimelockAndExecutionPeriods = async () => {
      if (freezeGuardType == FreezeGuardType.MULTISIG) {
        // @todo: untested freeze paths here
        const formatBlocks = async (blocks: number): Promise<string | undefined> =>
          getTimeDuration(await blocksToSeconds(blocks, publicClient));
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
            formatBlocks(contractTimelockPeriod),
            formatBlocks(contractExecutionPeriod),
          ]);
          setFieldValue('azorius.timelockPeriod', timelockSeconds);
          setFieldValue('azorius.executionPeriod', executionPeriodSeconds);
        }
      } else if (votingStrategy !== null) {
        if (existingTimelockPeriod?.formatted) {
          setFieldValue('azorius.timelockPeriod', {
            bigintValue: existingTimelockPeriod.value,
            value: existingTimelockPeriod.formatted.split(' ')[0],
          });
        }
        if (existingExecutionPeriod?.formatted) {
          setFieldValue('azorius.executionPeriod', {
            bigintValue: existingExecutionPeriod.value,
            value: existingExecutionPeriod.formatted.split(' ')[0],
          });
        }
      }

      return () => {
        setFieldValue('azorius.timelockPeriod', undefined);
        setFieldValue('azorius.executionPeriod', undefined);
      };
    };

    setTimelockAndExecutionPeriods();
  }, [
    getTimeDuration,
    governance,
    freezeGuardContractAddress,
    freezeGuardType,
    publicClient,
    setFieldValue,
    votingStrategy,
    existingTimelockPeriod,
    existingExecutionPeriod,
  ]);

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
      {existingQuorumPercentage && (
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
                  values.azorius?.quorumPercentage?.value ?? existingQuorumPercentage.formatted
                }
                onChange={e => {
                  const newValue: BigIntValuePair = {
                    bigintValue: BigInt(e.target.value),
                    value: e.target.value,
                  };

                  setFieldValue('azorius.quorumPercentage', newValue);
                }}
                minWidth="100%"
              />
            </LabelComponent>
          </Flex>
          <Divider />
        </>
      )}

      {existingQuorumThreshold && (
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
                value={values.azorius?.quorumThreshold?.value ?? existingQuorumThreshold.formatted}
                minWidth="100%"
                onChange={e => {
                  const newValue: BigIntValuePair = {
                    bigintValue: BigInt(e.target.value),
                    value: e.target.value,
                  };
                  setFieldValue('azorius.quorumThreshold', newValue);
                }}
              />
            </LabelComponent>
          </Flex>
          <Divider />
        </>
      )}
      {existingVotingPeriod && (
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
              subLabel={existingVotingPeriod.formatted?.split(' ')[1]}
              gridContainerProps={inputGridContainerProps}
            >
              <Input
                value={
                  values.azorius?.votingPeriod?.value ??
                  existingVotingPeriod.formatted?.split(' ')[0]
                }
                minWidth="100%"
                onChange={e => {
                  const newValue: BigIntValuePair = {
                    bigintValue: BigInt(e.target.value),
                    value: e.target.value,
                  };
                  setFieldValue('azorius.votingPeriod', newValue);
                }}
              />
            </LabelComponent>
          </Flex>
          <Divider />
        </>
      )}
      {existingTimelockPeriod && (
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
              subLabel={existingTimelockPeriod.formatted?.split(' ')[1]}
            >
              <Input
                value={values.azorius?.timelockPeriod?.value}
                minWidth="100%"
                onChange={e => {
                  const newValue: BigIntValuePair = {
                    bigintValue: BigInt(e.target.value),
                    value: e.target.value,
                  };
                  setFieldValue('azorius.timelockPeriod', newValue);
                }}
              />
            </LabelComponent>
          </Flex>
          <Divider />
        </>
      )}
      {existingExecutionPeriod && (
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
              subLabel={existingExecutionPeriod.formatted?.split(' ')[1]}
            >
              <Input
                value={values.azorius?.executionPeriod?.value}
                minWidth="100%"
                onChange={e => {
                  console.log(e.target.value);
                  console.log(existingExecutionPeriod.formatted);

                  const newValue: BigIntValuePair | undefined =
                    e.target.value !== existingExecutionPeriod.formatted
                      ? {
                          bigintValue: BigInt(e.target.value),
                          value: e.target.value,
                        }
                      : undefined;

                  console.log('newValue', newValue);

                  setFieldValue('azorius.executionPeriod', newValue);
                }}
              />
            </LabelComponent>
          </Flex>
        </>
      )}
    </Box>
  );
}
