import { GridItem } from '@chakra-ui/react';
import { MultisigProposal } from '../../../types';
import { ProposalDetailsGrid } from '../../ui/containers/ProposalDetailsGrid';
import { ProposalInfo } from '../ProposalInfo';
import { ExecutionSection } from './ExecutionSection';
import { SignatureSection } from './SignatureSection';
import { SignerDetails } from './SignerDetails';
import { TxDetails } from './TxDetails';

export function MultisigProposalDetails({ proposal }: { proposal: MultisigProposal }) {
  return (
    <ProposalDetailsGrid>
      <GridItem colSpan={2}>
        <ProposalInfo proposal={proposal} />
        <SignerDetails proposal={proposal} />
      </GridItem>
      <GridItem colSpan={1}>
        <TxDetails proposal={proposal} />
        <SignatureSection proposal={proposal} />
        <ExecutionSection proposal={proposal} />
      </GridItem>
    </ProposalDetailsGrid>
  );
}
