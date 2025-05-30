import { Box, Flex, Icon, Text } from '@chakra-ui/react';
import { WarningCircle } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { COLOR_YELLOW_1, COLOR_YELLOW_2 } from '../../../constants/common';
import { useCurrentDAOKey } from '../../../hooks/DAO/useCurrentDAOKey';
import { useDAOStore } from '../../../providers/App/AppProvider';
import {
  FractalProposalState,
  GovernanceType,
  MultisigProposal,
  SnapshotProposal,
} from '../../../types';
import { AccordionDropdown } from '../../ui/containers/AccordionDropdown';
import Divider from '../../ui/utils/Divider';
import { SimpleProposalCard } from '../ProposalCard/SimpleProposalCard';

function RejectionBanner({ rejectionProposal }: { rejectionProposal: MultisigProposal }) {
  const { t } = useTranslation('proposal');

  const hasRejectionExecuted = rejectionProposal.state === FractalProposalState.EXECUTED;
  const rejectedProposalLabel = t('nonceLabelBannerRejected', {
    nonce: rejectionProposal.nonce,
  });

  const hasPassedThreshold = rejectionProposal.state === FractalProposalState.EXECUTABLE;
  const rejectedProposalPassedThresholdLabel = t('nonceLabelBannerPassedThreshold');

  const activeRejectionLabel = t('nonceLabelBannerActive', {
    confirmations: rejectionProposal.confirmations?.length,
    signersThreshold: rejectionProposal.signersThreshold,
    nonce: rejectionProposal.nonce,
  });
  const containerColors = hasPassedThreshold
    ? {
        bg: COLOR_YELLOW_2,
        color: COLOR_YELLOW_1,
        borderColor: COLOR_YELLOW_1,
      }
    : {
        bg: 'color-error-900',
        color: 'color-error-400',
        borderColor: 'color-error-800',
      };
  return (
    <Flex
      mb={2}
      alignItems="center"
      gap={2}
      p="1rem"
      border="1px solid"
      borderRadius="0.75rem"
      {...containerColors}
    >
      <Icon
        as={WarningCircle}
        boxSize="1.5rem"
      />
      <Text textStyle="text-sm-medium">
        {hasRejectionExecuted
          ? rejectedProposalLabel
          : hasPassedThreshold
            ? rejectedProposalPassedThresholdLabel
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
      textStyle="text-sm-medium"
      color="color-neutral-300"
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
  const { t } = useTranslation('proposal');

  if (!isMultisigProposal || !proposals || proposal.state === FractalProposalState.EXECUTED)
    return null;
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
    <>
      <Divider
        variant="dark"
        my={4}
      />
      <AccordionDropdown
        sectionTitle={t('conflictingProposals')}
        // @dev expands if there is a rejection proposal
        defaultExpandedIndices={rejectionProposal ? [0] : undefined}
        contentCount={conflictingProposalsOnlyNonRejections.length}
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
    </>
  );
}
