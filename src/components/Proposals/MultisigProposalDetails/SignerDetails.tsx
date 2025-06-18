import { Box, Grid, GridItem, Text } from '@chakra-ui/react';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { Address, getAddress } from 'viem';
import { useAccount } from 'wagmi';
import { findMostConfirmedMultisigRejectionProposal } from '../../../helpers/multisigProposal';
import { useCurrentDAOKey } from '../../../hooks/DAO/useCurrentDAOKey';
import { useDAOStore } from '../../../providers/App/AppProvider';
import { MultisigProposal } from '../../../types';
import { DEFAULT_DATE_TIME_FORMAT } from '../../../utils/numberFormats';
import { ActivityAddress } from '../../Activity/ActivityAddress';
import { Badge } from '../../ui/badges/Badge';
import ContentBox from '../../ui/containers/ContentBox';
import Divider from '../../ui/utils/Divider';

function OwnerInfoRow({
  owner,
  proposal,
  rejectProposal,
  isMe,
}: {
  owner: Address;
  proposal: MultisigProposal;
  rejectProposal: MultisigProposal | undefined;
  isMe: boolean;
}) {
  const ownerApproved = proposal.confirmations?.find(c => c.owner === owner);
  const ownerRejected = rejectProposal?.confirmations?.find(c => c.owner === owner);

  const confirmations = [
    ownerApproved && { type: 'approved', date: new Date(ownerApproved.submissionDate) },
    ownerRejected && { type: 'rejected', date: new Date(ownerRejected.submissionDate) },
  ].filter(Boolean) as { type: 'approved' | 'rejected'; date: Date }[];

  const latestConfirmation = confirmations.reduce(
    (prev, curr) => (curr.date > prev.date ? curr : prev),
    confirmations[0],
  );

  return (
    <>
      <GridItem my="auto">
        <ActivityAddress
          address={owner}
          isMe={isMe}
        />
      </GridItem>
      <GridItem my="auto">
        {latestConfirmation?.type === 'approved' && (
          <Badge
            labelKey="ownerApproved"
            size="sm"
          />
        )}
        {latestConfirmation?.type === 'rejected' && (
          <Badge
            labelKey="ownerRejected"
            size="sm"
          />
        )}
      </GridItem>
      <GridItem my="auto">
        {latestConfirmation && (
          <Text color="color-neutral-300">
            {format(latestConfirmation.date, DEFAULT_DATE_TIME_FORMAT)}
          </Text>
        )}
      </GridItem>
    </>
  );
}

export function SignerDetails({ proposal }: { proposal: MultisigProposal }) {
  const { t } = useTranslation('proposal');
  const user = useAccount();
  const { daoKey } = useCurrentDAOKey();
  const {
    governance: { proposals },
    node: { safe },
  } = useDAOStore({ daoKey });

  const rejectionProposal = findMostConfirmedMultisigRejectionProposal(
    safe?.address,
    proposal.nonce,
    proposals,
  );

  if (!safe?.owners) {
    return null;
  }
  return (
    <ContentBox
      containerBoxProps={{
        bg: 'transparent',
        border: '1px solid',
        borderColor: 'color-neutral-900',
        borderRadius: '0.5rem',
      }}
    >
      <Text textStyle="text-xl-regular">{t('signers')}</Text>
      <Box marginTop={4}>
        <Divider
          width="calc(100% + 4rem)"
          mx="-2rem"
        />
        <Grid
          templateColumns="repeat(3, auto)"
          rowGap={4}
          columnGap={5}
          overflowX="auto"
          whiteSpace="nowrap"
        >
          {safe.owners.map(owner => (
            <OwnerInfoRow
              key={owner}
              owner={getAddress(owner)}
              proposal={proposal}
              rejectProposal={rejectionProposal}
              isMe={user.address === owner}
            />
          ))}
        </Grid>
      </Box>
    </ContentBox>
  );
}
