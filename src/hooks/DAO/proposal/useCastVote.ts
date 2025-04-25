import { abis } from '@fractal-framework/fractal-contracts';
import { toLightSmartAccount } from 'permissionless/accounts';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Address, getContract, http } from 'viem';
import { createBundlerClient } from 'viem/account-abstraction';
import { EntryPoint07Abi } from '../../../assets/abi/EntryPoint07Abi';
import { ModalType } from '../../../components/ui/modals/ModalProvider';
import { useDecentModal } from '../../../components/ui/modals/useDecentModal';
import { useStore } from '../../../providers/App/AppProvider';
import { useNetworkConfigStore } from '../../../providers/NetworkConfig/useNetworkConfigStore';
import { useDaoInfoStore } from '../../../store/daoInfo/useDaoInfoStore';
import { fetchMaxPriorityFeePerGas } from '../../../utils/gaslessVoting';
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
    getConfigByChainId,
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

  const { paymasterAddress } = useDaoInfoStore();
  const publicClient = useNetworkPublicClient();

  const prepareGaslessVoteOperation = useCallback(async () => {
    if (!publicClient || !paymasterAddress || !walletClient) {
      return;
    }

    const networkConfig = getConfigByChainId(publicClient.chain.id);

    const smartWallet = await toLightSmartAccount({
      client: publicClient,
      owner: walletClient,
      version: '2.0.0',

      // DO NOT CHANGE THIS INDEX!!!
      // For context, see:
      // - https://docs.pimlico.io/permissionless/reference/accounts/toLightSmartAccount#index-optional
      // - https://github.com/decentdao/decent-contracts/blob/a2fad6470015c0f59c84d8b5249dd1ee7b8a4773/contracts/account-abstraction/SmartAccountValidationV1.sol#L47
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

    // Select higher of the two
    const maxPriorityFeePerGas =
      maxPriorityFeePerGasEstimate > (minimumMaxPriorityFeePerGas ?? 0n)
        ? maxPriorityFeePerGasEstimate
        : minimumMaxPriorityFeePerGas;

    const userOpWithoutCallData = {
      paymaster: paymasterAddress,
      maxPriorityFeePerGas,
    };

    const callDataForEstimation = prepareCastVoteData(0);
    const {
      preVerificationGas,
      verificationGasLimit,
      callGasLimit,
      paymasterVerificationGasLimit,
      paymasterPostOpGasLimit,
    } = await bundlerClient.estimateUserOperationGas({
      ...userOpWithoutCallData,
      calls: [callDataForEstimation],
    });

    // Calculate gas
    // check algorithm at https://github.com/alchemyplatform/rundler/blob/fae8909b34e5874c0cae2d06aa841a8a112d22a0/crates/types/src/user_operation/v0_7.rs#L206-L215
    const { maxFeePerGas: maxFeePerGasEstimate } = await publicClient.estimateFeesPerGas();
    const gasUsed =
      preVerificationGas +
      verificationGasLimit +
      callGasLimit +
      (paymasterVerificationGasLimit ?? 0n) +
      (paymasterPostOpGasLimit ?? 0n);
    const gasCost = maxFeePerGasEstimate * gasUsed;

    return {
      gasCost,
      userOpWithoutCallData,
      bundlerClient,
    };
  }, [
    getConfigByChainId,
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

  const gaslessVoteLoadingModal = useDecentModal(ModalType.GASLESS_VOTE_LOADING);

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

        const gaslessVoteData = await prepareGaslessVoteOperation();
        if (!gaslessVoteData) {
          return;
        }
        const { userOpWithoutCallData, bundlerClient } = gaslessVoteData;

        const castVoteCallData = prepareCastVoteData(selectedVoteChoice);

        gaslessVoteLoadingModal();

        // Sign and send UserOperation to bundler
        const hash = await bundlerClient.sendUserOperation({
          ...userOpWithoutCallData,
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
    [prepareGaslessVoteOperation, prepareCastVoteData, gaslessVoteLoadingModal, t],
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
