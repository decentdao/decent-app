import { Center } from '@chakra-ui/react';
import { ProposalBuilder } from '../../../../../components/ProposalBuilder';
import { DEFAULT_PROPOSAL } from '../../../../../components/ProposalBuilder/constants';
import { BarLoader } from '../../../../../components/ui/loaders/BarLoader';
import { useHeaderHeight } from '../../../../../constants/common';
import { usePrepareProposal } from '../../../../../hooks/DAO/proposal/usePrepareProposal';
import { useFractal } from '../../../../../providers/App/AppProvider';
import { ProposalBuilderMode } from '../../../../../types';

export default function CreateProposalPage() {
  const {
    node: { daoAddress, safe },
    governance: { type },
  } = useFractal();
  const { prepareProposal } = usePrepareProposal();

  const HEADER_HEIGHT = useHeaderHeight();

  if (!type || !daoAddress || !safe) {
    return (
      <Center minH={`calc(100vh - ${HEADER_HEIGHT})`}>
        <BarLoader />
      </Center>
    );
  }

  return (
    <ProposalBuilder
      initialValues={{ ...DEFAULT_PROPOSAL, nonce: safe.nextNonce }}
      mode={ProposalBuilderMode.PROPOSAL}
      prepareProposalData={prepareProposal}
    />
  );
}
