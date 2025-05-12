import { Box, Flex, Input } from '@chakra-ui/react';
import { abis } from '@fractal-framework/fractal-contracts';
import { useFormikContext } from 'formik';
import { useEffect, useState } from 'react';
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
  const [timelockPeriod, setTimelockPeriod] = useState<string>();
  const [executionPeriod, setExecutionPeriod] = useState<string>();

  const { values, setFieldValue } = useFormikContext<SafeSettingsEdits>();

  const governanceAzorius = governance.isAzorius ? (governance as AzoriusGovernance) : null;

  useEffect(() => {
    const setTimelockInfo = async () => {
      const formatBlocks = async (blocks: number): Promise<string | undefined> =>
        getTimeDuration(await blocksToSeconds(blocks, publicClient));

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
            formatBlocks(contractTimelockPeriod),
            formatBlocks(contractExecutionPeriod),
          ]);
          setTimelockPeriod(timelockSeconds);
          setExecutionPeriod(executionPeriodSeconds);
        }
      } else if (governanceAzorius !== null) {
        const timelock = governanceAzorius.votingStrategy?.timeLockPeriod;
        const execution = governanceAzorius.votingStrategy?.executionPeriod;
        if (timelock?.formatted) {
          setTimelockPeriod(timelock.formatted);
        }
        if (execution?.formatted) {
          setExecutionPeriod(execution.formatted);
        }
      }
      return () => {
        setTimelockPeriod(undefined);
        setExecutionPeriod(undefined);
      };
    };

    setTimelockInfo();
  }, [
    executionPeriod,
    getTimeDuration,
    governance,
    freezeGuardContractAddress,
    freezeGuardType,
    timelockPeriod,
    publicClient,
    governanceAzorius,
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
      {governanceAzorius?.votingStrategy?.quorumPercentage && (
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
                  values.azorius?.quorumPercentage?.value ??
                  governanceAzorius.votingStrategy.quorumPercentage.formatted
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

      {governanceAzorius?.votingStrategy?.quorumThreshold && (
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
                  values.azorius?.quorumThreshold?.value ??
                  governanceAzorius.votingStrategy.quorumThreshold.formatted
                }
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
      {governanceAzorius?.votingStrategy?.votingPeriod && (
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
              subLabel={governanceAzorius.votingStrategy.votingPeriod.formatted?.split(' ')[1]}
              gridContainerProps={inputGridContainerProps}
            >
              <Input
                value={
                  values.azorius?.votingPeriod?.value ??
                  governanceAzorius.votingStrategy.votingPeriod.formatted?.split(' ')[0]
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
      {timelockPeriod && (
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
              subLabel={timelockPeriod?.split(' ')[1]}
            >
              <Input
                value={values.azorius?.timelockPeriod?.value ?? timelockPeriod?.split(' ')[0]}
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
      {executionPeriod && (
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
              subLabel={executionPeriod?.split(' ')[1]}
            >
              <Input
                value={values.azorius?.executionPeriod?.value ?? executionPeriod?.split(' ')[0]}
                minWidth="100%"
                onChange={e => {
                  const newValue: BigIntValuePair = {
                    bigintValue: BigInt(e.target.value),
                    value: e.target.value,
                  };
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
