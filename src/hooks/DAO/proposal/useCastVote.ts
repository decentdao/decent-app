import { abis } from '@fractal-framework/fractal-contracts';
import { toLightSmartAccount } from 'permissionless/accounts';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Address, getContract, http } from 'viem';
import { createBundlerClient } from 'viem/account-abstraction';
import { useAccount } from 'wagmi';
import { EntryPoint07Abi } from '../../../assets/abi/EntryPoint07Abi';
import { useStore } from '../../../providers/App/AppProvider';
import { useNetworkConfigStore } from '../../../providers/NetworkConfig/useNetworkConfigStore';
import { useDaoInfoStore } from '../../../store/daoInfo/useDaoInfoStore';
import useNetworkPublicClient from '../../useNetworkPublicClient';
import { useNetworkWalletClient } from '../../useNetworkWalletClient';
import { useTransaction } from '../../utils/useTransaction';
import { useCurrentDAOKey } from '../useCurrentDAOKey';
import useUserERC721VotingTokens from './useUserERC721VotingTokens';

const useCastVote = (proposalId: string, strategy: Address) => {
  const { daoKey } = useCurrentDAOKey();
  const {
    governanceContracts: {
      linearVotingErc20Address,
      linearVotingErc20WithHatsWhitelistingAddress,
      linearVotingErc721Address,
      linearVotingErc721WithHatsWhitelistingAddress,
    },
  } = useStore({ daoKey });
  const {
    contracts: { accountAbstraction },
    rpcEndpoint,
    gaslessVoting,
  } = useNetworkConfigStore();

  const [contractCall, castVotePending] = useTransaction();
  const [castGaslessVotePending, setCastGaslessVotePending] = useState(false);
  const [canCastGaslessVote, setCanCastGaslessVote] = useState(false);

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

  const prepareGaslessVoteOperation = useCallback(async () => {
    if (!publicClient || !paymasterAddress || !walletClient || !accountAbstraction) {
      return;
    }

    const {
      maxFeePerGas: maxFeePerGasEstimate,
      maxPriorityFeePerGas: maxPriorityFeePerGasEstimate,
    } = await publicClient.estimateFeesPerGas();
    const castVoteCallData = prepareCastVoteData(0);

    if (!gaslessVoting?.maxPriorityFeePerGasMultiplier) {
      return;
    }

    // `maxPriorityFeePerGas` returned from `estimateFeesPerGas` needs to be multiplied by this value to match minimum requirement here https://docs.alchemy.com/reference/rundler-maxpriorityfeepergas
    const maxPriorityFeePerGasMultiplier = gaslessVoting.maxPriorityFeePerGasMultiplier;

    // Adds buffer to maxFeePerGasEstimate to ensure transaction gets included
    const maxFeePerGasMultiplier = 50n;

    const maxPriorityFeePerGas = maxPriorityFeePerGasEstimate * maxPriorityFeePerGasMultiplier;
    const maxFeePerGas = maxFeePerGasEstimate * maxFeePerGasMultiplier;

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

    const userOpWithoutCallData = {
      paymaster: paymasterAddress,
      maxPriorityFeePerGas,
      maxFeePerGas,
    };

    const {
      preVerificationGas,
      verificationGasLimit,
      callGasLimit,
      paymasterVerificationGasLimit,
      paymasterPostOpGasLimit,
    } = await bundlerClient.estimateUserOperationGas({
      ...userOpWithoutCallData,
      calls: [castVoteCallData],
    });

    // Calculate gas
    // check algorithm at https://github.com/alchemyplatform/rundler/blob/fae8909b34e5874c0cae2d06aa841a8a112d22a0/crates/types/src/user_operation/v0_7.rs#L206-L215
    const gasUsed =
      preVerificationGas +
      verificationGasLimit +
      callGasLimit +
      (paymasterVerificationGasLimit ?? 0n) +
      (paymasterPostOpGasLimit ?? 0n);
    const gasCost = maxFeePerGas * gasUsed;

    const userOp = {
      ...userOpWithoutCallData,
      maxPriorityFeePerGas: (maxPriorityFeePerGasEstimate * 13n) / 10n,
      maxFeePerGas: (maxFeePerGasEstimate * 13n) / 10n,
    };

    return {
      gasCost,
      userOp,
      bundlerClient,
    };
  }, [
    accountAbstraction,
    gaslessVoting?.maxPriorityFeePerGasMultiplier,
    paymasterAddress,
    prepareCastVoteData,
    publicClient,
    rpcEndpoint,
    walletClient,
  ]);

  // Check if the paymaster has enough balance to cover the gas cost of the vote
  useEffect(() => {
    const estimateGaslessVoteGas = async () => {
      if (!paymasterAddress || !publicClient || !accountAbstraction) {
        return;
      }

      const entryPoint = getContract({
        address: accountAbstraction.entryPointv07,
        abi: EntryPoint07Abi,
        client: publicClient,
      });
      const paymasterBalance = await entryPoint.read.balanceOf([paymasterAddress]);

      const gaslessVoteData = await prepareGaslessVoteOperation();
      if (!gaslessVoteData) {
        return;
      }
      const { gasCost } = gaslessVoteData;

      setCanCastGaslessVote(paymasterBalance >= gasCost);
    };

    estimateGaslessVoteGas().catch(() => {
      setCanCastGaslessVote(false);
    });
  }, [accountAbstraction, paymasterAddress, prepareGaslessVoteOperation, publicClient]);

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

        const gaslessVoteData = await prepareGaslessVoteOperation();
        if (!gaslessVoteData) {
          return;
        }
        const { userOp, bundlerClient } = gaslessVoteData;

        const castVoteCallData = prepareCastVoteData(selectedVoteChoice);

        // Sign and send UserOperation to bundler
        const hash = await bundlerClient.sendUserOperation({
          ...userOp,
          calls: [castVoteCallData],
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
    [
      address,
      prepareGaslessVoteOperation,
      paymasterAddress,
      prepareCastVoteData,
      publicClient,
      t,
      walletClient,
    ],
  );

  return {
    castVote,
    castGaslessVote,
    castVotePending,
    castGaslessVotePending,
    canCastGaslessVote,
  };
};

export default useCastVote;
