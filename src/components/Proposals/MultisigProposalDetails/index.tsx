import { GridItem, Box } from '@chakra-ui/react';
import { BACKGROUND_SEMI_TRANSPARENT } from '../../../constants/common';
import { useFractal } from '../../../providers/App/AppProvider';
import { FractalProposal, MultisigProposal } from '../../../types';
import ContentBox from '../../ui/containers/ContentBox';
import { ProposalDetailsGrid } from '../../ui/containers/ProposalDetailsGrid';
import ProposalCreatedBy from '../../ui/proposal/ProposalCreatedBy';
import { ProposalInfo } from '../ProposalInfo';
import { SignerDetails } from './SignerDetails';
import { TxActions } from './TxActions';
import { TxDetails } from './TxDetails';

export function MultisigProposalDetails({ proposal }: { proposal: FractalProposal }) {
  const txProposal = proposal as MultisigProposal;
  const {
    readOnly: { user },
  } = useFractal();
  return (
    <ProposalDetailsGrid>
      <GridItem colSpan={2}>
        <ContentBox containerBoxProps={{ bg: BACKGROUND_SEMI_TRANSPARENT }}>
          <ProposalInfo proposal={proposal} />
          <Box mt={4}>
            <ProposalCreatedBy proposer={txProposal.confirmations[0].owner} />
          </Box>
        </ContentBox>
        <SignerDetails proposal={txProposal} />
      </GridItem>
      <GridItem colSpan={1}>
        <TxDetails proposal={txProposal} />
        {user.address && <TxActions proposal={txProposal} />}
      </GridItem>
    </ProposalDetailsGrid>
  );
}
