import { abis } from '@fractal-framework/fractal-contracts';
import { toLightSmartAccount } from 'permissionless/accounts';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Address, getContract, http } from 'viem';
import { createBundlerClient } from 'viem/account-abstraction';
import useFeatureFlag from '../../../helpers/environmentFeatureFlags';
import { useStore } from '../../../providers/App/AppProvider';
import { useNetworkConfigStore } from '../../../providers/NetworkConfig/useNetworkConfigStore';
import { useDaoInfoStore } from '../../../store/daoInfo/useDaoInfoStore';
import { FractalTokenType } from '../../../types/fractal';
import { fetchMaxPriorityFeePerGas } from '../../../utils/gaslessVoting';
import useNetworkPublicClient from '../../useNetworkPublicClient';
import { useNetworkWalletClient } from '../../useNetworkWalletClient';
import { useTransaction } from '../../utils/useTransaction';
import { useDepositInfo } from '../accountAbstraction/useDepositInfo';
import { usePaymasterValidatorStatus } from '../accountAbstraction/usePaymasterValidatorStatus';
import { useCurrentDAOKey } from '../useCurrentDAOKey';
import useUserERC721VotingTokens from './useUserERC721VotingTokens';

const useCastVote = (proposalId: string, strategyAddress: Address) => {
  const { daoKey } = useCurrentDAOKey();
  const { governanceContracts } = useStore({ daoKey });
  const { rpcEndpoint, getConfigByChainId, bundlerMinimumStake } = useNetworkConfigStore();
  const { paymasterAddress } = useDaoInfoStore();
  const { isValidatorSet, isLoading: isLoadingValidator } = usePaymasterValidatorStatus();
  const { depositInfo } = useDepositInfo(paymasterAddress);
  const gaslessFeatureEnabled = useFeatureFlag('flag_gasless_voting');

  const isStakingRequired = useMemo(
    () => bundlerMinimumStake !== undefined && bundlerMinimumStake > 0n,
    [bundlerMinimumStake],
  );

  const [contractCall, castVotePending] = useTransaction();
  const [castGaslessVotePending, setCastGaslessVotePending] = useState(false);
  const [canCastGaslessVote, setCanCastGaslessVote] = useState(false);
  const [gasEstimationError, setGasEstimationError] = useState<string | null>(null);

  const { remainingTokenIds, remainingTokenAddresses } = useUserERC721VotingTokens(
    null,
    proposalId,
  );

  const { data: walletClient } = useNetworkWalletClient();
  const publicClient = useNetworkPublicClient();
  const { t } = useTranslation(['transaction', 'gaslessVoting']);

  const strategy = useMemo(() => {
    return governanceContracts.strategies.find(s => s.address === strategyAddress);
  }, [governanceContracts.strategies, strategyAddress]);

  const prepareCastVoteCall = useCallback(
    (vote: number) => {
      if (!strategy) {
        throw new Error('Voting strategy not found for proposal');
      }

      type Erc20VoteArgs = [proposalId: number, vote: number];
      type Erc721VoteArgs = [
        proposalId: number,
        vote: number,
        tokenAddresses: Address[],
        tokenIds: bigint[],
      ];

      let voteArgs: Erc20VoteArgs | Erc721VoteArgs;
      let abi;
      let functionName: 'vote';

      if (strategy.type === FractalTokenType.erc20) {
        abi = abis.LinearERC20VotingV1;
        voteArgs = [Number(proposalId), vote];
        functionName = 'vote';
      } else if (strategy.type === FractalTokenType.erc721) {
        abi = abis.LinearERC721VotingV1;
        voteArgs = [
          Number(proposalId),
          vote,
          remainingTokenAddresses,
          remainingTokenIds.map(i => BigInt(i)),
        ];
        functionName = 'vote';
      } else {
        throw new Error('Invalid strategy type');
      }

      return {
        to: strategy.address,
        abi,
        functionName,
        args: voteArgs,
      } as const;
    },
    [proposalId, remainingTokenAddresses, remainingTokenIds, strategy],
  );

  const castVote = useCallback(
    async (vote: number) => {
      if (!walletClient || !strategy) {
        return;
      }

      const { abi, functionName, args } = prepareCastVoteCall(vote);
      const contract = getContract({
        abi,
        address: strategy.address,
        client: walletClient,
      });

      contractCall({
        // @ts-ignore args type validation is tricky here
        contractFn: () => contract.write[functionName](args),
        pendingMessage: t('pendingCastVote'),
        failedMessage: t('failedCastVote'),
        successMessage: t('successCastVote'),
      });
    },
    [walletClient, strategy, prepareCastVoteCall, contractCall, t],
  );

  const prepareGaslessVoteOperation = useCallback(
    async (vote: number) => {
      if (!publicClient || !paymasterAddress || !walletClient || !strategy) {
        return null;
      }

      const networkConfig = getConfigByChainId(publicClient.chain.id);
      const smartWallet = await toLightSmartAccount({
        client: publicClient,
        owner: walletClient,
        version: '2.0.0',
        index: 0n,
      });
      const bundlerClient = createBundlerClient({
        account: smartWallet,
        client: publicClient,
        transport: http(rpcEndpoint),
      });

      const minimumMaxPriorityFeePerGas = await fetchMaxPriorityFeePerGas(networkConfig);
      const { maxPriorityFeePerGas: maxPriorityFeePerGasEstimate } =
        await publicClient.estimateFeesPerGas();

      const maxPriorityFeePerGas =
        maxPriorityFeePerGasEstimate > (minimumMaxPriorityFeePerGas ?? 0n)
          ? maxPriorityFeePerGasEstimate
          : minimumMaxPriorityFeePerGas;

      const userOpBase = {
        paymaster: paymasterAddress,
        maxPriorityFeePerGas,
      };

      const callData = prepareCastVoteCall(vote);

      return {
        userOpBase,
        callData,
        bundlerClient,
      };
    },
    [
      publicClient,
      paymasterAddress,
      walletClient,
      strategy,
      getConfigByChainId,
      rpcEndpoint,
      prepareCastVoteCall,
    ],
  );

  useEffect(() => {
    const checkEligibility = async () => {
      setGasEstimationError(null);
      setCanCastGaslessVote(false);

      if (!gaslessFeatureEnabled) return;
      if (!paymasterAddress) return;

      if (isLoadingValidator) return;

      if (!isValidatorSet) return;
      if (!depositInfo) return;

      if (isStakingRequired) {
        const minStake = bundlerMinimumStake || 0n;
        if (depositInfo.stake < minStake || depositInfo.withdrawTime !== 0) {
          return;
        }
      }

      try {
        const preparedOp = await prepareGaslessVoteOperation(0);
        if (!preparedOp) {
          throw new Error('Failed to prepare gasless operation for estimation.');
        }

        const {
          preVerificationGas,
          verificationGasLimit,
          callGasLimit,
          paymasterVerificationGasLimit,
          paymasterPostOpGasLimit,
        } = await preparedOp.bundlerClient.estimateUserOperationGas({
          ...preparedOp.userOpBase,
          calls: [preparedOp.callData],
        });

        const { maxFeePerGas: maxFeePerGasEstimate } = await publicClient.estimateFeesPerGas();
        const gasUsed =
          preVerificationGas +
          verificationGasLimit +
          callGasLimit +
          (paymasterVerificationGasLimit ?? 0n) +
          (paymasterPostOpGasLimit ?? 0n);
        const estimatedGasCost = maxFeePerGasEstimate * gasUsed;

        if (depositInfo.balance >= estimatedGasCost) {
          setCanCastGaslessVote(true);
        } else {
          setGasEstimationError(t('insufficientPaymasterBalance', { ns: 'gaslessVoting' }));
        }
      } catch (e: any) {
        setGasEstimationError(t('gasEstimationFailed'));
      }
    };

    checkEligibility();
  }, [
    gaslessFeatureEnabled,
    paymasterAddress,
    isValidatorSet,
    isLoadingValidator,
    depositInfo,
    isStakingRequired,
    bundlerMinimumStake,
    prepareGaslessVoteOperation,
    publicClient,
    t,
  ]);

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
      try {
        setCastGaslessVotePending(true);

        const preparedOp = await prepareGaslessVoteOperation(selectedVoteChoice);
        if (!preparedOp) {
          throw new Error('Failed to prepare gasless operation for sending.');
        }

        const hash = await preparedOp.bundlerClient.sendUserOperation({
          ...preparedOp.userOpBase,
          calls: [preparedOp.callData],
        });

        preparedOp.bundlerClient.waitForUserOperationReceipt({ hash }).then(() => {
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
    [prepareGaslessVoteOperation, t],
  );

  return {
    castVote,
    castGaslessVote,
    castVotePending,
    castGaslessVotePending,
    canCastGaslessVote,
    isLoadingEligibility: isLoadingValidator,
    gasEstimationError,
  };
};

export default useCastVote;
