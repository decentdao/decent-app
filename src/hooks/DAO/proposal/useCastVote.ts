import { abis } from '@fractal-framework/fractal-contracts';
import { toLightSmartAccount } from 'permissionless/accounts';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Address, getContract, http } from 'viem';
import { createBundlerClient } from 'viem/account-abstraction';
import { useAccount } from 'wagmi';
import { useFractal } from '../../../providers/App/AppProvider';
import { useNetworkConfigStore } from '../../../providers/NetworkConfig/useNetworkConfigStore';
import { useDaoInfoStore } from '../../../store/daoInfo/useDaoInfoStore';
import useNetworkPublicClient from '../../useNetworkPublicClient';
import { useNetworkWalletClient } from '../../useNetworkWalletClient';
import { useTransaction } from '../../utils/useTransaction';
import useUserERC721VotingTokens from './useUserERC721VotingTokens';

const useCastVote = (proposalId: string, strategy: Address) => {
  const {
    governanceContracts: {
      linearVotingErc20Address,
      linearVotingErc20WithHatsWhitelistingAddress,
      linearVotingErc721Address,
      linearVotingErc721WithHatsWhitelistingAddress,
    },
  } = useFractal();

  const [contractCall, castVotePending] = useTransaction();
  const [castGaslessVotePending, setCastGaslessVotePending] = useState(false);
  const [gaslessVoteEstimateGas, setGaslessVoteEstimateGas] = useState(0n);

  const { remainingTokenIds, remainingTokenAddresses } = useUserERC721VotingTokens(
    null,
    proposalId,
  );

  const { data: walletClient } = useNetworkWalletClient();

  const { t } = useTranslation('transaction');

  const prepareCastVoteData = useCallback(
    (vote: number) => {
      type Erc20VoteArgs = [proposalId: number, vote: number];
      type Erc721VoteArgs = [
        proposalId: number,
        vote: number,
        tokenAddresses: Address[],
        tokenIds: bigint[],
      ];

      let voteArgs: Erc20VoteArgs | Erc721VoteArgs;
      let abi: typeof abis.LinearERC20Voting | typeof abis.LinearERC721Voting;

      const isErc20 =
        strategy === linearVotingErc20Address ||
        strategy === linearVotingErc20WithHatsWhitelistingAddress;
      const isErc721 =
        strategy === linearVotingErc721Address ||
        strategy === linearVotingErc721WithHatsWhitelistingAddress;

      if (isErc20) {
        abi = abis.LinearERC20Voting;
        voteArgs = [Number(proposalId), vote];
      } else if (isErc721) {
        abi = abis.LinearERC721Voting;
        voteArgs = [
          Number(proposalId),
          vote,
          remainingTokenAddresses,
          remainingTokenIds.map(i => BigInt(i)),
        ];
      } else {
        throw new Error('Invalid strategy');
      }

      return {
        to: strategy,
        abi,
        functionName: 'vote',
        args: voteArgs,
      } as const;
    },
    [
      linearVotingErc721Address,
      linearVotingErc721WithHatsWhitelistingAddress,
      linearVotingErc20Address,
      linearVotingErc20WithHatsWhitelistingAddress,
      proposalId,
      remainingTokenAddresses,
      remainingTokenIds,
      strategy,
    ],
  );

  const castVote = useCallback(
    async (vote: number) => {
      if (!walletClient) {
        return;
      }

      if (
        strategy === linearVotingErc20Address ||
        strategy === linearVotingErc20WithHatsWhitelistingAddress
      ) {
        const ozLinearVotingContract = getContract({
          abi: abis.LinearERC20Voting,
          address: strategy,
          client: walletClient,
        });
        contractCall({
          contractFn: () => ozLinearVotingContract.write.vote([Number(proposalId), vote]),
          pendingMessage: t('pendingCastVote'),
          failedMessage: t('failedCastVote'),
          successMessage: t('successCastVote'),
        });
      } else if (
        strategy === linearVotingErc721Address ||
        strategy === linearVotingErc721WithHatsWhitelistingAddress
      ) {
        const erc721LinearVotingContract = getContract({
          abi: abis.LinearERC721Voting,
          address: strategy,
          client: walletClient,
        });
        contractCall({
          contractFn: () =>
            erc721LinearVotingContract.write.vote([
              Number(proposalId),
              vote,
              remainingTokenAddresses,
              remainingTokenIds.map(i => BigInt(i)),
            ]),
          pendingMessage: t('pendingCastVote'),
          failedMessage: t('failedCastVote'),
          successMessage: t('successCastVote'),
        });
      }
    },
    [
      contractCall,
      linearVotingErc721Address,
      linearVotingErc721WithHatsWhitelistingAddress,
      linearVotingErc20Address,
      linearVotingErc20WithHatsWhitelistingAddress,
      proposalId,
      remainingTokenAddresses,
      remainingTokenIds,
      t,
      walletClient,
      strategy,
    ],
  );

  const { address } = useAccount();
  const { paymasterAddress } = useDaoInfoStore();
  const publicClient = useNetworkPublicClient();
  const { rpcEndpoint } = useNetworkConfigStore();

  useEffect(() => {
    const estimateGaslessVoteGas = async () => {
      if (!address || !paymasterAddress || !walletClient || !publicClient) {
        throw new Error('Invalid state');
      }

      const smartWallet = await toLightSmartAccount({
        client: publicClient,
        owner: walletClient,
        version: '2.0.0',
      });

      const bundlerClient = createBundlerClient({
        account: smartWallet,
        client: publicClient,
        transport: http(rpcEndpoint),
      });

      const { maxFeePerGas, maxPriorityFeePerGas } = await publicClient.estimateFeesPerGas();

      const castVoteCallData = prepareCastVoteData(0);

      // Sign and send UserOperation to bundler
      const { preVerificationGas, verificationGasLimit, callGasLimit } =
        await bundlerClient.estimateUserOperationGas({
          paymaster: paymasterAddress,
          calls: [castVoteCallData],

          // i don't really know why we need to do this, but we do
          maxPriorityFeePerGas: maxPriorityFeePerGas * 100n,
          maxFeePerGas: maxFeePerGas * 100n,
        });

      const block = await publicClient.getBlock();
      const gasFee = maxPriorityFeePerGas + (block.baseFeePerGas || 0n);
      const gasUsed = preVerificationGas + verificationGasLimit + callGasLimit;
      const gasCost = gasFee * gasUsed;
      console.debug('estimate!', { gasFee, gasUsed, gasCost });

      setGaslessVoteEstimateGas(gasCost);
    };

    estimateGaslessVoteGas().catch(console.error);
  }, [address, paymasterAddress, prepareCastVoteData, publicClient, rpcEndpoint, walletClient]);

  const castGaslessVote = useCallback(
    async ({
      selectedVoteChoice,
      onError,
      onSuccess,
    }: {
      selectedVoteChoice: number;
      onError: (error: any) => void;
      onSuccess: () => void;
    }) => {
      if (!address || !paymasterAddress || !walletClient || !publicClient) {
        throw new Error('Invalid state');
      }

      try {
        setCastGaslessVotePending(true);
        const smartWallet = await toLightSmartAccount({
          client: publicClient,
          owner: walletClient,
          version: '2.0.0',
        });

        const bundlerClient = createBundlerClient({
          account: smartWallet,
          client: publicClient,
          transport: http(rpcEndpoint),
        });

        // Get current network conditions
        const { maxFeePerGas, maxPriorityFeePerGas } = await publicClient.estimateFeesPerGas();

        const castVoteCallData = prepareCastVoteData(selectedVoteChoice);

        // Sign and send UserOperation to bundler
        const hash = await bundlerClient.sendUserOperation({
          paymaster: paymasterAddress,
          calls: [castVoteCallData],

          // i don't really know why we need to do this, but we do
          maxPriorityFeePerGas: maxPriorityFeePerGas * 100n,
          maxFeePerGas: maxFeePerGas * 100n,
        });

        bundlerClient.waitForUserOperationReceipt({ hash }).then(() => {
          setCastGaslessVotePending(false);
          onSuccess();
        });
      } catch (error: any) {
        setCastGaslessVotePending(false);

        if (error.name === 'UserRejectedRequestError') {
          toast.error(t('userRejectedSignature', { ns: 'gaslessVoting' }));
          return;
        }

        onError(error);
      }
    },
    [address, paymasterAddress, prepareCastVoteData, publicClient, rpcEndpoint, t, walletClient],
  );

  return {
    castVote,
    castGaslessVote,
    castVotePending,
    castGaslessVotePending,
    gaslessVoteEstimateGas,
  };
};

export default useCastVote;
