import { Button } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { useCastFreezeVote } from '../../hooks/DAO/useCastFreezeVote';
import { useCurrentDAOKey } from '../../hooks/DAO/useCurrentDAOKey';
import { useDAOStore } from '../../providers/App/AppProvider';

export function FreezeButton() {
  const { t } = useTranslation(['dashboard']);
  const { daoKey } = useCurrentDAOKey();
  const {
    guard: { isFrozen },
    guardAccountData: { userHasFreezeVoted, userHasVotes },
  } = useDAOStore({ daoKey });

  const { castFreezeVote, pending } = useCastFreezeVote();

  const disabled = isFrozen || userHasFreezeVoted || pending || !userHasVotes;

  return (
    <Button
      variant="ghost"
      bgColor={'black.900'}
      border="1px"
      borderColor={'blue.500'}
      textColor={'blue.500'}
      onClick={castFreezeVote}
      isDisabled={disabled}
    >
      {t(
        !userHasVotes ? 'noVotesButton' : userHasFreezeVoted ? 'freezeVotedButton' : 'freezeButton',
      )}
    </Button>
  );
}
