import { Flex, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { useDateTimeDisplay } from '../../../helpers/dateTime';
import { useCurrentDAOKey } from '../../../hooks/DAO/useCurrentDAOKey';
import { useDAOStore } from '../../../providers/App/AppProvider';
import { DAOState } from '../../../types';
import { ActivityCard } from '../../Activity/ActivityCard';
import { FreezeButton } from '../../Activity/FreezeButton';
import { DecentTooltip } from '../../ui/DecentTooltip';
import { Badge } from '../../ui/badges/Badge';

export function FreezeDescription({ isFrozen }: { isFrozen: boolean }) {
  const { t } = useTranslation('dashboard');
  return (
    <Text
      color="color-neutral-300"
      gap="0.5rem"
    >
      {t(isFrozen ? 'frozenDescription' : 'freezeDescription')}
    </Text>
  );
}

export function ActivityFreeze() {
  const { daoKey } = useCurrentDAOKey();
  const {
    guard: {
      isFrozen,
      freezeProposalCreatedTime,
      freezeProposalPeriod,
      freezePeriod,
      freezeVotesThreshold,
      freezeProposalVoteCount,
    },
  } = useDAOStore({ daoKey });
  const { t } = useTranslation('dashboard');
  const freezeProposalDeadlineDate = new Date(
    Number(((freezeProposalCreatedTime || 0n) + (freezeProposalPeriod || 0n)) * 1000n),
  );
  const freezeDeadlineDate = new Date(
    Number(((freezeProposalCreatedTime || 0n) + (freezePeriod || 0n)) * 1000n),
  );
  const now = new Date();

  const freezeProposalPeriodDiffReadable = useDateTimeDisplay(freezeProposalDeadlineDate);
  const freezePeriodDiffReadable = useDateTimeDisplay(freezeDeadlineDate);
  const isFreezeProposalDeadlinePassed = now.getTime() > freezeProposalDeadlineDate.getTime();
  const isFreezeDeadlinePassed = now.getTime() > freezeDeadlineDate.getTime();

  if (isFreezeProposalDeadlinePassed && isFreezeDeadlinePassed) {
    return null;
  }

  const voteToThreshold =
    freezeProposalVoteCount!.toString() + ' / ' + freezeVotesThreshold!.toString();

  return (
    <ActivityCard
      Badge={
        <Badge
          labelKey={isFrozen ? DAOState.frozen : DAOState.freezeInit}
          size="base"
        />
      }
      description={<FreezeDescription isFrozen={isFrozen} />}
      RightElement={
        <Flex
          color="blue.500"
          alignItems="center"
          gap="2rem"
        >
          <Text>
            {!isFrozen && freezeVotesThreshold !== null && freezeVotesThreshold > 0n && (
              <DecentTooltip
                label={t('tipFreeze', { amount: voteToThreshold })}
                placement="bottom"
              >
                {voteToThreshold}
              </DecentTooltip>
            )}
          </Text>
          {!isFreezeProposalDeadlinePassed && !isFreezeDeadlinePassed && (
            <Text>{isFrozen ? freezePeriodDiffReadable : freezeProposalPeriodDiffReadable}</Text>
          )}
          {!isFrozen && <FreezeButton />}
        </Flex>
      }
      boxBorderColor={'blue.500'}
    />
  );
}
