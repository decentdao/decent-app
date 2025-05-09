import { Box, Flex, Icon, Text } from '@chakra-ui/react';
import { WarningCircle } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { useCurrentDAOKey } from '../../../hooks/DAO/useCurrentDAOKey';
import { useDAOStore } from '../../../providers/App/AppProvider';
import {
  FractalProposalState,
  GovernanceType,
  MultisigProposal,
  SnapshotProposal,
} from '../../../types';
import { AccordionDropdown } from '../../ui/containers/AccordionDropdown';
import { SimpleProposalCard } from '../ProposalCard/SimpleProposalCard';

function RejectionBanner({ rejectionProposal }: { rejectionProposal: MultisigProposal }) {
  const { t } = useTranslation('proposal');
  const activeRejectionLabel = t('nonceLabelBannerActive', {
    confirmations: rejectionProposal.confirmations?.length,
    signersThreshold: rejectionProposal.signersThreshold,
    nonce: rejectionProposal.nonce,
  });
  const rejectedProposalLabel = t('nonceLabelBannerRejected', {
    nonce: rejectionProposal.nonce,
  });
  return (
    <Flex
      mb={2}
      alignItems="center"
      gap={2}
      p="1.5rem"
      bg="red--2"
      color="red-1"
      border="1px solid"
      borderColor="red--1"
      borderRadius="0.75rem"
    >
      <Icon
        as={WarningCircle}
        boxSize={4}
      />
      <Text>
        {rejectionProposal.state === FractalProposalState.EXECUTED
          ? rejectedProposalLabel
          : activeRejectionLabel}
      </Text>
    </Flex>
  );
}

function NonceLabel({ nonce }: { nonce: number | undefined }) {
  const { t } = useTranslation('proposal');

  if (nonce === undefined) return null;
  return (
    <Text
      mb={2}
      textStyle="labels-large"
      color="neutral-7"
    >
      {t('nonceLabel', {
        number: nonce,
      })}
    </Text>
  );
}

export function MultisigConflictingProposals({ proposal }: { proposal: MultisigProposal }) {
  const { daoKey } = useCurrentDAOKey();
  const {
    governance: { proposals, type },
  } = useDAOStore({ daoKey });
  const isMultisigProposal =
    type === GovernanceType.MULTISIG && !(proposal as SnapshotProposal)?.snapshotProposalId;

  if (!isMultisigProposal || !proposals) return null;
  const multisigProposal = proposal as MultisigProposal;
  const proposalNonce = multisigProposal.nonce;

  const conflictingProposals = proposals.filter(
    (p: MultisigProposal) => p.nonce === proposalNonce && p.proposalId !== proposal.proposalId,
  );

  if (conflictingProposals.length === 0) return null;

  const conflictingProposalsOnlyNonRejections = conflictingProposals.filter(
    (p: MultisigProposal) => !p.isMultisigRejectionTx,
  );

  const rejectionProposal = conflictingProposals.find(
    (p: MultisigProposal) => p.isMultisigRejectionTx,
  );

  return (
    <AccordionDropdown
      sectionTitle="Conflicting Proposals"
      // @dev expands if there is a rejection proposal
      defaultExpandedIndecies={rejectionProposal ? [0] : undefined}
      contentCount={conflictingProposals.length}
      content={
        <Box mt={4}>
          <NonceLabel nonce={proposalNonce} />
          {rejectionProposal && <RejectionBanner rejectionProposal={rejectionProposal} />}
          {conflictingProposalsOnlyNonRejections.map((p: MultisigProposal) => (
            <Box
              key={p.proposalId}
              mb={2}
            >
              <SimpleProposalCard proposal={p} />
            </Box>
          ))}
        </Box>
      }
    />
  );
}
