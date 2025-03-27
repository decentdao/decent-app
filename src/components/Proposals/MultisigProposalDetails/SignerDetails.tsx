import { Box, Grid, GridItem, Text } from '@chakra-ui/react';
import { format, max } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { Address, getAddress } from 'viem';
import { useAccount } from 'wagmi';
import { findMostConfirmedMultisigRejectionProposal } from '../../../helpers/multisigProposal';
import { useFractal } from '../../../providers/App/AppProvider';
import { useDaoInfoStore } from '../../../store/daoInfo/useDaoInfoStore';
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
  const ownerApproved = proposal.confirmations?.find(confirmInfo => confirmInfo.owner === owner);
  const ownerRejected = rejectProposal?.confirmations?.find(
    confirmInfo => confirmInfo.owner === owner,
  );
  const confirmedOnce = ownerApproved || ownerRejected;
  const lastConfirmationDate = confirmedOnce
    ? max([
        new Date(ownerApproved?.submissionDate ?? 0),
        new Date(ownerRejected?.submissionDate ?? 0),
      ])
    : undefined;

  return (
    <>
      <GridItem my="auto">
        <ActivityAddress
          address={owner}
          isMe={isMe}
        />
      </GridItem>
      <GridItem my="auto">
        {ownerApproved && (
          <Badge
            labelKey={'ownerApproved'}
            size="sm"
          />
        )}
        {ownerRejected && (
          <Badge
            labelKey={'ownerRejected'}
            size="sm"
          />
        )}
      </GridItem>
      <GridItem my="auto">
        {lastConfirmationDate && (
          <Text color="neutral-7">{format(lastConfirmationDate, DEFAULT_DATE_TIME_FORMAT)}</Text>
        )}
      </GridItem>
    </>
  );
}

export function SignerDetails({ proposal }: { proposal: MultisigProposal }) {
  const { t } = useTranslation('proposal');
  const user = useAccount();
  const { safe } = useDaoInfoStore();
  const {
    governance: { proposals },
  } = useFractal();

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
        borderColor: 'neutral-3',
        borderRadius: '0.5rem',
      }}
    >
      <Text textStyle="heading-small">{t('signers')}</Text>
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
