import { GridItem, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { useAccount } from 'wagmi';
import { useCurrentDAOKey } from '../../../hooks/DAO/useCurrentDAOKey';
import { useGetAccountName } from '../../../hooks/utils/useGetAccountName';
import { useDAOStore } from '../../../providers/App/AppProvider';
import { AzoriusGovernance, ERC721ProposalVote } from '../../../types';
import StatusBox from '../../ui/badges/StatusBox';

export default function ProposalERC721VoteItem({
  vote: { voter, choice, tokenAddresses },
}: {
  vote: ERC721ProposalVote;
  proposalId: string;
}) {
  const { t } = useTranslation(['common', 'proposal']);
  const { displayName } = useGetAccountName(voter);
  const { daoKey } = useCurrentDAOKey();
  const { governance } = useDAOStore({ daoKey });
  const user = useAccount();

  const azoriusGovernance = governance as AzoriusGovernance;
  const { erc721Tokens } = azoriusGovernance;
  const votedTokens = erc721Tokens?.filter(token => tokenAddresses.includes(token.address));
  const weight = tokenAddresses
    .map(address => {
      const votingToken = erc721Tokens!.find(token => token.address === address);
      return votingToken!.votingWeight;
    })
    .reduce((a, b) => a + b);

  return (
    <>
      <GridItem colSpan={1}>
        <Text>
          {displayName}
          {user.address === voter && t('isMeSuffix')}
        </Text>
      </GridItem>
      <GridItem colSpan={1}>
        <StatusBox>
          <Text>{t(choice.label)}</Text>
        </StatusBox>
      </GridItem>
      {votedTokens && (
        <GridItem colSpan={1}>
          <Text>
            {t('nftVotes', {
              count: Number(weight),
              ns: 'proposal',
            })}
          </Text>
        </GridItem>
      )}
    </>
  );
}
