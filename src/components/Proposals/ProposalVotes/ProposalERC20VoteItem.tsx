import { GridItem, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { useAccount } from 'wagmi';
import { useGetAccountName } from '../../../hooks/utils/useGetAccountName';
import { ProposalVote } from '../../../types';
import { formatCoin, formatPercentage } from '../../../utils';
import StatusBox from '../../ui/badges/StatusBox';

export default function ProposalERC20VoteItem({
  vote,
  govTokenTotalSupply,
  govTokenDecimals,
  govTokenSymbol,
}: {
  vote: ProposalVote;
  govTokenTotalSupply: bigint;
  govTokenDecimals: number;
  govTokenSymbol: string;
}) {
  const { t } = useTranslation(['common', 'proposal']);
  const { displayName } = useGetAccountName(vote.voter);
  const user = useAccount();
  return (
    <>
      <GridItem>
        <Text color="neutral-7">
          {displayName}
          {user.address === vote.voter && t('isMeSuffix')}
        </Text>
      </GridItem>
      <GridItem>
        <StatusBox>
          <Text color="neutral-7">{t(vote.choice.label)}</Text>
        </StatusBox>
      </GridItem>
      <GridItem>
        <Text color="neutral-7">{formatPercentage(vote.weight, govTokenTotalSupply)}</Text>
      </GridItem>
      <GridItem>
        <Text color="neutral-7">
          {formatCoin(vote.weight, true, govTokenDecimals, govTokenSymbol)}
        </Text>
      </GridItem>
    </>
  );
}
