import { useMemo } from 'react';
import { useDAOStore } from '../../providers/App/AppProvider';
import { useCurrentDAOKey } from './useCurrentDAOKey';

export const useGetStakeToken = () => {
  const { daoKey } = useCurrentDAOKey();
  const {
    governance: { stakedToken, isAzorius, votesToken, erc20Token },
  } = useDAOStore({ daoKey });

  const isVotesTokenStakeToken = useMemo(
    () => stakedToken?.address === votesToken?.address,
    [stakedToken?.address, votesToken?.address],
  );

  const unstakedToken = useMemo(() => {
    if (!isAzorius) {
      return erc20Token;
    }

    if (isVotesTokenStakeToken) {
      return erc20Token;
    }

    return votesToken;
  }, [isAzorius, isVotesTokenStakeToken, votesToken, erc20Token]);

  return { stakedToken, unstakedToken };
};
