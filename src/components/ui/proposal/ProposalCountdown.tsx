import { ComponentWithAs, Flex, IconProps, Text } from '@chakra-ui/react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Execute } from '../../../assets/theme/custom/icons/Execute';
import { Lock } from '../../../assets/theme/custom/icons/Lock';
import { Vote } from '../../../assets/theme/custom/icons/Vote';
import useSnapshotProposal from '../../../hooks/DAO/loaders/useSnapshotProposal';
import { Proposal, ProposalState } from '../../../types';
import { DecentTooltip } from '../DecentTooltip';
import { useProposalCountdown } from './useProposalCountdown';

/** pads a zero to the start of a number so that it is always 2 characters, e.g. '03' */
const zeroPad = (num: number) => String(num).padStart(2, '0');

/**
 * Displays a countdown timer for the provided proposal, based on its current state.
 *
 * ACTIVE state, for proposals that can currently be voted on (all Azorius)
 * TIMELOCKED state, for proposals that are waiting to be executed (all Azorius OR mulsig subDAOs)
 * EXECUTABLE state, for proposals that have a executionPeriod (all Azorius OR multisig subDAOs)
 *
 * For all other states this component will simply return null.
 */
export function ProposalCountdown({
  proposal,
  showIcon = true,
  textColor = 'white-0',
}: {
  proposal: Proposal;
  showIcon?: boolean;
  // custom text color and style
  textColor?: string;
}) {
  const totalSecondsLeft = useProposalCountdown(proposal);
  const { t } = useTranslation('proposal');

  const state: ProposalState | null = useMemo(() => proposal.state, [proposal]);

  const { snapshotProposal } = useSnapshotProposal(proposal);
  const showCountdown =
    !!totalSecondsLeft &&
    totalSecondsLeft > 0 &&
    (state === ProposalState.ACTIVE ||
      state === ProposalState.TIMELOCKED ||
      state === ProposalState.EXECUTABLE ||
      !!snapshotProposal);

  if (!showCountdown) return null;

  const tooltipLabel = t(
    state === ProposalState.ACTIVE
      ? 'votingTooltip'
      : state === ProposalState.TIMELOCKED
        ? 'timeLockedTooltip'
        : state === ProposalState.EXECUTABLE
          ? 'executableTooltip'
          : '',
  );

  const Icon: ComponentWithAs<'svg', IconProps> | null =
    state === ProposalState.ACTIVE || !!snapshotProposal
      ? Vote
      : state === ProposalState.TIMELOCKED
        ? Lock
        : state === ProposalState.EXECUTABLE
          ? Execute
          : null;

  const daysLeft = Math.floor(totalSecondsLeft / (60 * 60 * 24));
  const hoursLeft = Math.floor((totalSecondsLeft / (60 * 60)) % 24);
  const minutesLeft = Math.floor((totalSecondsLeft / 60) % 60);
  const secondsLeft = Math.floor(totalSecondsLeft % 60);

  const showDays = daysLeft > 0;
  const showHours = showDays || hoursLeft > 0;
  const showMinutes = showHours || minutesLeft > 0;
  const showSeconds = secondsLeft >= 0;

  return (
    <DecentTooltip
      label={tooltipLabel}
      placement="top"
    >
      <Flex
        justifyContent="flex-end"
        alignItems="center"
      >
        {showIcon && Icon && <Icon />}
        <Flex
          px={2}
          gap={1}
        >
          <Text
            color={textColor}
            textStyle="labels-large"
          >
            {showDays && `${zeroPad(daysLeft)}:`}
            {showHours && `${zeroPad(hoursLeft)}:`}
            {showMinutes ? `${zeroPad(minutesLeft)}:` : '00:'}
            {showSeconds && `${zeroPad(secondsLeft)}`}
          </Text>
        </Flex>
      </Flex>
    </DecentTooltip>
  );
}
