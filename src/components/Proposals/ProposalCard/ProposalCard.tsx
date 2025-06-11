import { Box, Flex, Icon as ChakraIcon, Text, Spacer } from '@chakra-ui/react';
import { CalendarBlank } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Address } from 'viem';
import { DAO_ROUTES } from '../../../constants/routes';
import { useDateTimeDisplay } from '../../../helpers/dateTime';
import { findMostConfirmedMultisigRejectionProposal } from '../../../helpers/multisigProposal';
import { useCurrentDAOKey } from '../../../hooks/DAO/useCurrentDAOKey';
import { useNetworkEnsAvatar } from '../../../hooks/useNetworkEnsAvatar';
import { useGetAccountName } from '../../../hooks/utils/useGetAccountName';
import { useDAOStore } from '../../../providers/App/AppProvider';
import { useNetworkConfigStore } from '../../../providers/NetworkConfig/useNetworkConfigStore';
import {
  AzoriusProposal,
  FractalProposal,
  SnapshotProposal,
  GovernanceType,
  MultisigProposal,
  FractalProposalState,
} from '../../../types';
import { ActivityDescription } from '../../Activity/ActivityDescription';
import { ProposalStateBadge } from '../../ui/badges/Badge';
import QuorumBadge from '../../ui/badges/QuorumBadge';
import { SignerThresholdBadge } from '../../ui/badges/SignerThresholdBadge';
import { SnapshotIcon } from '../../ui/badges/Snapshot';
import Avatar from '../../ui/page/Header/Avatar';
import { ProposalCountdown } from '../../ui/proposal/ProposalCountdown';

function ProposalCreatedDate({ date }: { date: Date }) {
  const createdDateLabel = useDateTimeDisplay(date);

  return (
    <Flex
      gap="2"
      alignItems="center"
    >
      <Text
        textStyle="text-xs-medium"
        color="color-neutral-300"
      >
        {createdDateLabel}
      </Text>
      <ChakraIcon as={CalendarBlank} />
    </Flex>
  );
}

function ProposalCreatedBy({ createdBy }: { createdBy: Address }) {
  const { t } = useTranslation('proposal');
  const { displayName } = useGetAccountName(createdBy, true);
  const { data: avatarURL } = useNetworkEnsAvatar({ name: displayName });
  return (
    <Flex
      gap="2"
      alignItems="center"
    >
      <Text
        textStyle="text-xs-medium"
        color="color-neutral-300"
      >
        <Flex gap="1">
          {t('by')}
          <Avatar
            size="sm"
            address={createdBy}
            url={avatarURL}
          />
          {displayName}
        </Flex>
      </Text>
    </Flex>
  );
}

function NonceLabel({ nonce }: { nonce: number | undefined }) {
  const { daoKey } = useCurrentDAOKey();
  const { governance } = useDAOStore({ daoKey });
  const { t } = useTranslation('proposal');
  const isMultisig = governance.type === GovernanceType.MULTISIG;

  if (!isMultisig || nonce === undefined) return null;
  return (
    <Text
      textStyle="text-xs-medium"
      color="color-neutral-300"
    >
      {t('nonceLabel', {
        number: nonce,
      })}
    </Text>
  );
}

function ProposalCard({ proposal, showNonce }: { proposal: FractalProposal; showNonce?: boolean }) {
  const { safeAddress, daoKey } = useCurrentDAOKey();
  const {
    governance: { proposals },
    node: { safe },
  } = useDAOStore({ daoKey });
  const { addressPrefix } = useNetworkConfigStore();

  if (!safeAddress) {
    return null;
  }

  const isSnapshotProposal = !!(proposal as SnapshotProposal).snapshotProposalId;
  const isAzoriusProposal = !!(proposal as AzoriusProposal).votesSummary;

  const rejectionProposal = findMostConfirmedMultisigRejectionProposal(
    safe?.address,
    (proposal as MultisigProposal).nonce,
    proposals,
  );

  return (
    <Link to={DAO_ROUTES.proposal.relative(addressPrefix, safeAddress, proposal.proposalId)}>
      <Box
        minHeight="6.25rem"
        bg="color-neutral-950"
        _hover={{ bg: 'color-neutral-900' }}
        _active={{ bg: 'color-neutral-950', border: '1px solid', borderColor: 'color-neutral-900' }}
        transition="all ease-out 300ms"
        p="1.5rem"
        borderRadius="0.75rem"
      >
        {/* Top Row */}
        <Flex
          justifyContent="space-between"
          flexWrap="wrap"
          gap="1rem"
        >
          <Flex
            gap={2}
            alignItems="center"
            w={{ base: '100%', md: 'auto' }}
          >
            {proposal.state && (
              <ProposalStateBadge
                labelKey={proposal.state}
                rejectionProposalState={rejectionProposal?.state}
                size="sm"
              />
            )}
            <ProposalCountdown
              proposal={proposal}
              rejectionProposal={rejectionProposal}
              showIcon={false}
              textColor="color-neutral-300"
            />
            {isSnapshotProposal && (
              <Box ml={1}>
                <SnapshotIcon />
              </Box>
            )}
          </Flex>
          <Flex
            gap={4}
            alignItems="center"
          >
            {showNonce && <NonceLabel nonce={(proposal as MultisigProposal).nonce} />}
            {isAzoriusProposal && <QuorumBadge proposal={proposal as AzoriusProposal} />}
            <SignerThresholdBadge
              numberOfConfirmedSigners={(proposal as MultisigProposal).confirmations?.length}
              proposalThreshold={(proposal as MultisigProposal).signersThreshold}
              isRejected={proposal.state === FractalProposalState.REJECTED}
            />
          </Flex>
        </Flex>
        <ActivityDescription activity={proposal} />
        <Flex
          justifyContent="space-between"
          alignItems="center"
          mt={4}
        >
          {proposal.proposer && <ProposalCreatedBy createdBy={proposal.proposer} />}
          <Spacer />
          {proposal.eventDate && <ProposalCreatedDate date={proposal.eventDate} />}
        </Flex>
      </Box>
    </Link>
  );
}

export default ProposalCard;
