import { Box, Grid, GridItem, Text } from '@chakra-ui/react';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { BACKGROUND_SEMI_TRANSPARENT } from '../../../constants/common';
import { useFractal } from '../../../providers/App/AppProvider';
import { MultisigProposal } from '../../../types';
import { DEFAULT_DATE_TIME_FORMAT } from '../../../utils/numberFormats';
import { ActivityAddress } from '../../Activity/ActivityAddress';
import { Badge } from '../../ui/badges/Badge';
import ContentBox from '../../ui/containers/ContentBox';
import Divider from '../../ui/utils/Divider';

function OwnerInfoRow({
  owner,
  proposal,
  isMe,
}: {
  owner: string;
  proposal: MultisigProposal;
  isMe: boolean;
}) {
  const ownerConfirmed = proposal.confirmations.find(confirmInfo => confirmInfo.owner === owner);

  return (
    <Grid
      templateColumns="1fr auto 1fr"
      my="0.75rem"
    >
      <GridItem colSpan={1}>
        <ActivityAddress
          address={owner}
          isMe={isMe}
        />
      </GridItem>
      <GridItem colSpan={1}>
        {ownerConfirmed && (
          <Badge
            labelKey={'ownerApproved'}
            size="sm"
          />
        )}
      </GridItem>
      <GridItem
        colSpan={1}
        placeSelf="end"
      >
        {ownerConfirmed && (
          <Text>{format(new Date(ownerConfirmed.submissionDate), DEFAULT_DATE_TIME_FORMAT)}</Text>
        )}
      </GridItem>
    </Grid>
  );
}

export function SignerDetails({ proposal }: { proposal: MultisigProposal }) {
  const {
    readOnly: { user },
    node: { safe },
  } = useFractal();
  const { t } = useTranslation('proposal');
  if (!safe?.owners) {
    return null;
  }
  return (
    <ContentBox containerBoxProps={{ bg: BACKGROUND_SEMI_TRANSPARENT }}>
      <Text textStyle="text-lg-mono-medium">{t('signers')}</Text>
      <Box marginTop={4}>
        <Divider />
        <Box marginTop={4}>
          {safe.owners.map(owner => (
            <OwnerInfoRow
              key={owner}
              owner={owner}
              proposal={proposal}
              isMe={user.address === owner}
            />
          ))}
        </Box>
      </Box>
    </ContentBox>
  );
}
