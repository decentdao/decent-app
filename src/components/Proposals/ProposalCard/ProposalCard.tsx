import { Box, Flex, Text } from '@chakra-ui/react';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { DAO_ROUTES } from '../../../constants/routes';
import { useCurrentDAOKey } from '../../../hooks/DAO/useCurrentDAOKey';
import { useNetworkConfigStore } from '../../../providers/NetworkConfig/useNetworkConfigStore';
import {
  AzoriusProposal,
  FractalProposal,
  MultisigProposal,
  SnapshotProposal,
} from '../../../types';
import { DEFAULT_DATE_FORMAT } from '../../../utils';
import { ActivityDescription } from '../../Activity/ActivityDescription';
import { Badge } from '../../ui/badges/Badge';
import QuorumBadge from '../../ui/badges/QuorumBadge';
import { SignerThresholdBadge } from '../../ui/badges/SignerThresholdBadge';
import { SnapshotIcon } from '../../ui/badges/Snapshot';
import { ProposalCountdown } from '../../ui/proposal/ProposalCountdown';

function ProposalCard({ proposal }: { proposal: FractalProposal }) {
  const { safeAddress } = useCurrentDAOKey();
  const { addressPrefix } = useNetworkConfigStore();
  const { t } = useTranslation('common');

  if (!safeAddress) {
    return null;
  }

  const isSnapshotProposal = !!(proposal as SnapshotProposal).snapshotProposalId;
  const isAzoriusProposal = !!(proposal as AzoriusProposal).votesSummary;

  return (
    <Link to={DAO_ROUTES.proposal.relative(addressPrefix, safeAddress, proposal.proposalId)}>
      <Box
        minHeight="6.25rem"
        bg="neutral-2"
        _hover={{ bg: 'neutral-3' }}
        _active={{ bg: 'neutral-2', border: '1px solid', borderColor: 'neutral-3' }}
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
            <Badge
              labelKey={proposal.state!}
              size="sm"
            />
            <ProposalCountdown
              proposal={proposal}
              showIcon={false}
              textColor="neutral-7"
            />
            {isSnapshotProposal && (
              <Box ml={1}>
                <SnapshotIcon />
              </Box>
            )}
          </Flex>
          {isAzoriusProposal && <QuorumBadge proposal={proposal as AzoriusProposal} />}
          <SignerThresholdBadge
            numberOfConfirmedSigners={(proposal as MultisigProposal).confirmations?.length}
            proposalThreshold={(proposal as MultisigProposal).signersThreshold}
          />
        </Flex>
        <ActivityDescription activity={proposal} />
        <Box>
          {proposal.eventDate && (
            <Text
              mt={2}
              textStyle="labels-large"
              color="neutral-6"
            >
              {t('created')} {format(proposal.eventDate, DEFAULT_DATE_FORMAT)}
            </Text>
          )}
        </Box>
      </Box>
    </Link>
  );
}

export default ProposalCard;
