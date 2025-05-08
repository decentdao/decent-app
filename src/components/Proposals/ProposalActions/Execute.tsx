import { Button } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import useExecuteProposal from '../../../hooks/DAO/proposal/useExecuteProposal';
import { Proposal, ProposalState } from '../../../types';

export function Execute({ proposal }: { proposal: Proposal }) {
  const { t } = useTranslation(['proposal', 'common']);
  const { executeProposal, pending } = useExecuteProposal();

  const disabled = proposal.state !== ProposalState.EXECUTABLE || pending;

  return (
    <Button
      onClick={() => executeProposal(proposal)}
      width="full"
      isDisabled={disabled}
      marginTop={5}
      padding="1.5rem 6rem"
      height="auto"
    >
      {t('execute', { ns: 'common' })}
    </Button>
  );
}
