import { Box, Flex, Icon as ChakraIcon, Text, Spacer } from '@chakra-ui/react';
import { CalendarBlank } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Address } from 'viem';
import { DAO_ROUTES } from '../../../constants/routes';
import { useDateTimeDisplay } from '../../../helpers/dateTime';
import { useCurrentDAOKey } from '../../../hooks/DAO/useCurrentDAOKey';
import { useNetworkEnsAvatar } from '../../../hooks/useNetworkEnsAvatar';
import { useGetAccountName } from '../../../hooks/utils/useGetAccountName';
import { useNetworkConfigStore } from '../../../providers/NetworkConfig/useNetworkConfigStore';
import { FractalProposal, MultisigProposal } from '../../../types';
import { ProposalTitle } from '../../Activity/ActivityDescriptionGovernance';
import { SignerThresholdBadge } from '../../ui/badges/SignerThresholdBadge';
import Avatar from '../../ui/page/Header/Avatar';

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

export function SimpleProposalCard({ proposal }: { proposal: FractalProposal }) {
  const { safeAddress } = useCurrentDAOKey();
  const { addressPrefix } = useNetworkConfigStore();

  if (!safeAddress) {
    return null;
  }

  return (
    <Link to={DAO_ROUTES.proposal.relative(addressPrefix, safeAddress, proposal.proposalId)}>
      <Box
        minHeight="6.25rem"
        bg="color-neutral-900"
        _hover={{ bg: 'color-neutral-800' }}
        _active={{ bg: 'color-neutral-800', border: '1px solid', borderColor: 'color-neutral-800' }}
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
          <ProposalTitle activity={proposal} />
          <SignerThresholdBadge
            numberOfConfirmedSigners={(proposal as MultisigProposal).confirmations?.length}
            proposalThreshold={(proposal as MultisigProposal).signersThreshold}
          />
        </Flex>
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
