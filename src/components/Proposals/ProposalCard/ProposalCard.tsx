import { Box, Flex, Icon as ChakraIcon, Text, Spacer } from '@chakra-ui/react';
import { CalendarBlank } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Address } from 'viem';
import { DAO_ROUTES } from '../../../constants/routes';
import { useDateTimeDisplay } from '../../../helpers/dateTime';
import { useGetAccountName } from '../../../hooks/utils/useGetAccountName';
import { useNetworkConfigStore } from '../../../providers/NetworkConfig/useNetworkConfigStore';
import { useDaoInfoStore } from '../../../store/daoInfo/useDaoInfoStore';
import { AzoriusProposal, FractalProposal, SnapshotProposal } from '../../../types';
import { ActivityDescription } from '../../Activity/ActivityDescription';
import { Badge } from '../../ui/badges/Badge';
import QuorumBadge from '../../ui/badges/QuorumBadge';
import { SnapshotIcon } from '../../ui/badges/Snapshot';
import { ProposalCountdown } from '../../ui/proposal/ProposalCountdown';

function ProposalCreatedDate({ date }: { date: Date }) {
  const createdDateLabel = useDateTimeDisplay(date);

  return (
    <Flex
      gap="2"
      alignItems="center"
    >
      <Text
        textStyle="labels-small"
        color="neutral-7"
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
  return (
    <Flex
      gap="2"
      alignItems="center"
    >
      <Text
        textStyle="labels-small"
        color="neutral-7"
      >
        {t('createdBy', { createdBy: displayName })}
      </Text>
    </Flex>
  );
}

function ProposalCard({ proposal }: { proposal: FractalProposal }) {
  const { safe } = useDaoInfoStore();
  const { addressPrefix } = useNetworkConfigStore();
  if (!safe?.address) {
    return null;
  }

  const isSnapshotProposal = !!(proposal as SnapshotProposal).snapshotProposalId;
  const isAzoriusProposal = !!(proposal as AzoriusProposal).votesSummary;

  return (
    <Link to={DAO_ROUTES.proposal.relative(addressPrefix, safe.address, proposal.proposalId)}>
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
