import { Flex, Text, Tooltip } from '@chakra-ui/react';
import { VetoGuard } from '@fractal-framework/fractal-contracts';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getTxQueuedTimestamp } from '../../../hooks/utils/useSafeActivitiesWithState';
import useTokenData from '../../../providers/Fractal/governance/hooks/useGovernanceTokenData';
import { useFractal } from '../../../providers/Fractal/hooks/useFractal';
import {
  TxProposal,
  UsulProposal,
  TxProposalState,
  VetoGuardType,
} from '../../../providers/Fractal/types';
import Execute from '../svg/Execute';
import Lock from '../svg/Lock';
import Vote from '../svg/Vote';

const ICONS_MAP = {
  vote: Vote,
  lock: Lock,
  execute: Execute,
};

function ProposalTime({ proposal }: { proposal: TxProposal }) {
  const [countdown, setCountdown] = useState<number>();
  const [countdownInterval, setCountdownInterval] = useState<NodeJS.Timer>();
  const { t } = useTranslation('proposal');
  const {
    governance: { contracts },
    gnosis: {
      guardContracts: { vetoGuardContract, vetoGuardType },
    },
  } = useFractal();
  const { timeLockPeriod } = useTokenData(contracts);
  const isActive = proposal.state === TxProposalState.Active;
  const isTimeLocked = proposal.state === TxProposalState.TimeLocked;
  const isQueued = proposal.state === TxProposalState.Queued;
  const isExecutable = proposal.state === TxProposalState.Executing;
  const showCountdown = isActive || isTimeLocked || isExecutable || isQueued;

  const usulProposal = proposal as UsulProposal;

  useEffect(() => {
    async function getCountdown() {
      const vetoGuard =
        vetoGuardType === VetoGuardType.MULTISIG
          ? (vetoGuardContract?.asSigner as VetoGuard)
          : undefined;

      if (isActive && usulProposal.deadline) {
        const interval = setInterval(() => {
          const now = new Date();
          setCountdown(usulProposal.deadline * 1000 - now.getTime());
        }, 1000);
        setCountdownInterval(interval);
      } else if (isTimeLocked && usulProposal.deadline && timeLockPeriod) {
        const interval = setInterval(() => {
          const now = new Date();
          setCountdown(
            (usulProposal.deadline + Number(timeLockPeriod.value)) * 1000 - now.getTime()
          );
        }, 1000);
        setCountdownInterval(interval);
      } else if (isQueued && vetoGuard) {
        const queuedTimestamp = await getTxQueuedTimestamp(proposal, vetoGuard);
        const guardTimeLockPeriod = (await vetoGuard.timelockPeriod()).toNumber();
        const interval = setInterval(() => {
          const now = new Date();
          setCountdown(queuedTimestamp + guardTimeLockPeriod - now.getTime());
        }, 1000);
        setCountdownInterval(interval);
      } else if (isExecutable && vetoGuard) {
        const queuedTimestamp = await getTxQueuedTimestamp(proposal, vetoGuard);
        const guardTimeLockPeriod = (await vetoGuard.timelockPeriod()).toNumber();
        const guardExecutionPeriod = (await vetoGuard.executionPeriod()).toNumber();

        const interval = setInterval(() => {
          const now = new Date();
          setCountdown(
            queuedTimestamp + guardTimeLockPeriod + guardExecutionPeriod - now.getTime()
          );
        }, 1000);
        setCountdownInterval(interval);
      }
    }

    getCountdown();

    return () => {
      if (countdownInterval) {
        clearInterval(countdownInterval);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    usulProposal.deadline,
    isActive,
    isTimeLocked,
    isQueued,
    isExecutable,
    proposal.transaction,
    timeLockPeriod,
    vetoGuardContract,
    vetoGuardType,
    proposal,
  ]);

  const tooltipLabel = t(
    isActive
      ? 'votingTooltip'
      : isTimeLocked || isQueued
      ? 'timeLockedTooltip'
      : isExecutable
      ? 'executableTooltip'
      : ''
  );
  const iconName = isActive
    ? 'vote'
    : isTimeLocked || isQueued
    ? 'lock'
    : isExecutable
    ? 'execute'
    : undefined;

  let Icon = null;

  if (iconName) {
    Icon = ICONS_MAP[iconName];
  }

  if (!countdown || !showCountdown) {
    return null;
  }

  // Unfortunately, date-fns don't have anything handy for our countdown display format
  // So, have to do it manually
  const zeroPad = (num: number, places: number) => String(num).padStart(places, '0');
  const hoursLeft = Math.floor(countdown / (1000 * 60 * 60));
  const minutesLeft = Math.floor((countdown / (60 * 1000)) % 60);
  const secondsLeft = Math.floor((countdown / 1000) % 60);

  return (
    <Tooltip
      label={tooltipLabel}
      placement="top"
    >
      <Flex
        className="flex"
        justifyContent="flex-end"
        alignItems="center"
      >
        {Icon && <Icon />}
        <Flex
          px={2}
          gap={1}
        >
          <Text color="chocolate.200">
            {zeroPad(hoursLeft, 2)}:{zeroPad(minutesLeft, 2)}:{zeroPad(secondsLeft, 2)}
          </Text>
        </Flex>
      </Flex>
    </Tooltip>
  );
}

export default ProposalTime;
