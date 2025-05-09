import { Box, Flex, Input } from '@chakra-ui/react';
import { abis } from '@fractal-framework/fractal-contracts';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getContract } from 'viem';

import { LabelComponent } from '../../../../components/ui/forms/InputComponent';
import { BarLoader } from '../../../../components/ui/loaders/BarLoader';
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
  const publicClient = useNetworkPublicClient();
  const { getTimeDuration } = useTimeHelpers();
  const [timelockPeriod, setTimelockPeriod] = useState<string>();
  const [executionPeriod, setExecutionPeriod] = useState<string>();

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

  return (
    <Box data-testid="dashboard-daoGovernance">
      {governanceAzorius?.votingStrategy?.quorumPercentage && (
        <Flex
          alignItems="center"
          justifyContent="space-between"
        >
          <LabelComponent
            isRequired={false}
            label={t('titleQuorum')}
          >
            <Input
              value={governanceAzorius.votingStrategy.quorumPercentage.formatted}
              minWidth="100%"
            />
          </LabelComponent>
        </Flex>
      )}
      {governanceAzorius?.votingStrategy?.votingPeriod && (
        <Flex
          alignItems="center"
          justifyContent="space-between"
          mb="0.25rem"
          gap="0.5rem"
        >
          <LabelComponent
            isRequired={false}
            label={t('titleVotingPeriod')}
          >
            <Input
              value={governanceAzorius.votingStrategy.votingPeriod.formatted}
              minWidth="100%"
            />
          </LabelComponent>
        </Flex>
      )}
      {governanceAzorius?.votingStrategy?.quorumThreshold && (
        <Flex
          alignItems="center"
          justifyContent="space-between"
          mb="0.25rem"
          gap="0.5rem"
        >
          <LabelComponent
            isRequired={false}
            label={t('titleQuorum')}
          >
            <Input
              value={governanceAzorius.votingStrategy.quorumThreshold.formatted}
              minWidth="100%"
            />
          </LabelComponent>
        </Flex>
      )}
      {timelockPeriod && (
        <Flex
          alignItems="center"
          justifyContent="space-between"
          mb="0.25rem"
          gap="0.5rem"
        >
          <LabelComponent
            isRequired={false}
            label={t('timelock', { ns: 'common' })}
          >
            <Input
              value={timelockPeriod}
              minWidth="100%"
            />
          </LabelComponent>
        </Flex>
      )}
      {executionPeriod && (
        <Flex
          alignItems="center"
          justifyContent="space-between"
          mb="0.25rem"
          gap="0.5rem"
        >
          <LabelComponent
            isRequired={false}
            label={t('execution', { ns: 'common' })}
          >
            <Input
              value={executionPeriod}
              minWidth="100%"
            />
          </LabelComponent>
        </Flex>
      )}
    </Box>
  );
}
