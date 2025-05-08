import { abis } from '@fractal-framework/fractal-contracts';
import { useCallback } from 'react';
import { erc721Abi, getContract, zeroAddress } from 'viem';
import { useDAOStore } from '../../../../providers/App/AppProvider';
import { FractalGovernanceAction } from '../../../../providers/App/governance/action';
import { ERC721TokenData } from '../../../../types';
import useNetworkPublicClient from '../../../useNetworkPublicClient';
import { useCurrentDAOKey } from '../../useCurrentDAOKey';

export default function useERC721Tokens() {
  const { daoKey } = useCurrentDAOKey();
  const {
    governanceContracts: {
      linearVotingErc721Address,
      linearVotingErc721WithHatsWhitelistingAddress,
    },
    action,
  } = useDAOStore({ daoKey });
  const publicClient = useNetworkPublicClient();
  const loadERC721Tokens = useCallback(async () => {
    const linear721VotingAddress =
      linearVotingErc721Address ?? linearVotingErc721WithHatsWhitelistingAddress;

    const linear721VotingAbi = linearVotingErc721Address
      ? abis.LinearERC721Voting
      : abis.LinearERC721VotingWithHatsProposalCreation;

    if (!linear721VotingAddress) {
      return;
    }
    const erc721LinearVotingContract = getContract({
      abi: linear721VotingAbi,
      address: linear721VotingAddress,
      client: publicClient,
    });
    const addresses = await erc721LinearVotingContract.read.getAllTokenAddresses();
    const erc721Tokens: ERC721TokenData[] = await Promise.all(
      addresses.map(async address => {
        const tokenContract = getContract({
          abi: erc721Abi,
          address: address,
          client: publicClient,
        });
        const votingWeight = await erc721LinearVotingContract.read.getTokenWeight([address]);
        const [name, symbol, tokenMintEvents, tokenBurnEvents] = await Promise.all([
          tokenContract.read.name(),
          tokenContract.read.symbol(),
          tokenContract.getEvents.Transfer({ from: zeroAddress }, { fromBlock: 0n }),
          tokenContract.getEvents.Transfer({ to: zeroAddress }, { fromBlock: 0n }),
        ]);
        const totalSupply = BigInt(tokenMintEvents.length - tokenBurnEvents.length);
        return { name, symbol, address: address, votingWeight, totalSupply };
      }),
    );

    action.dispatch({
      type: FractalGovernanceAction.SET_ERC721_TOKENS_DATA,
      payload: erc721Tokens,
    });
  }, [
    action,
    linearVotingErc721Address,
    linearVotingErc721WithHatsWhitelistingAddress,
    publicClient,
  ]);

  return loadERC721Tokens;
}
