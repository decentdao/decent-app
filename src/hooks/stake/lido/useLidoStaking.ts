import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { encodeFunctionData } from 'viem';
import LidoStEthAbi from '../../../assets/abi/LidoStEthAbi';
import LidoWithdrawalQueueAbi from '../../../assets/abi/LidoWithdrawalQueueAbi';
import { useDAOStore } from '../../../providers/App/AppProvider';
import { useNetworkConfigStore } from '../../../providers/NetworkConfig/useNetworkConfigStore';
import { ProposalExecuteData } from '../../../types';
import useSubmitProposal from '../../DAO/proposal/useSubmitProposal';
import { useCurrentDAOKey } from '../../DAO/useCurrentDAOKey';

export default function useLidoStaking() {
  const { daoKey } = useCurrentDAOKey();
  const {
    node: { safe },
  } = useDAOStore({ daoKey });
  const {
    staking: { lido },
  } = useNetworkConfigStore();
  const { submitProposal } = useSubmitProposal();
  const { t } = useTranslation('proposal');

  const safeAddress = safe?.address;

  const handleStake = useCallback(
    async (value: bigint) => {
      if (!lido || !safeAddress) {
        // Means it is not supported on current network
        return;
      }

      const encodedSubmit = encodeFunctionData({
        abi: LidoStEthAbi,
        functionName: 'submit',
        args: [lido.rewardsAddress],
      });

      const proposalData: ProposalExecuteData = {
        metaData: {
          title: t('stakeWithLidoTitle'),
          description: t('stakeWithLidoDescription'),
          documentationUrl: 'https://docs.lido.fi/guides/steth-integration-guide#what-is-steth',
        },
        targets: [lido.stETHContractAddress],
        calldatas: [encodedSubmit],
        values: [value],
      };
      await submitProposal({
        proposalData,
        nonce: safe?.nonce,
        pendingToastMessage: t('proposalCreatePendingToastMessage'),
        successToastMessage: t('proposalCreateSuccessToastMessage'),
        failedToastMessage: t('proposalCreateFailureToastMessage'),
      });
    },
    [lido, safeAddress, safe, submitProposal, t],
  );

  const handleUnstake = useCallback(
    async (value: string) => {
      if (!lido || !safeAddress) {
        // Means it is not supported on current network
        return;
      }

      const encodedApprove = encodeFunctionData({
        abi: LidoStEthAbi,
        functionName: 'approve',
        args: [lido.withdrawalQueueContractAddress, BigInt(value)],
      });

      const encodedWithdraw = encodeFunctionData({
        abi: LidoWithdrawalQueueAbi,
        functionName: 'requestWithdrawals',
        args: [[BigInt(value)], safeAddress],
      });

      const proposalData: ProposalExecuteData = {
        metaData: {
          title: t('unstakeStEthTitle'),
          description: t('unstakeStEthDescription'),
          documentationUrl:
            'https://docs.lido.fi/guides/steth-integration-guide#request-withdrawal-and-mint-nft',
        },
        targets: [lido.stETHContractAddress, lido.withdrawalQueueContractAddress],
        calldatas: [encodedApprove, encodedWithdraw],
        values: [0n, 0n],
      };
      await submitProposal({
        proposalData,
        nonce: safe?.nonce,
        pendingToastMessage: t('proposalCreatePendingToastMessage'),
        successToastMessage: t('proposalCreateSuccessToastMessage'),
        failedToastMessage: t('proposalCreateFailureToastMessage'),
      });
    },
    [lido, safeAddress, safe, submitProposal, t],
  );

  const handleClaimUnstakedETH = useCallback(
    async (nftId: bigint) => {
      if (!lido || !safeAddress) {
        // Means it is not supported on current network
        return;
      }

      const encodedClaim = encodeFunctionData({
        abi: LidoWithdrawalQueueAbi,
        functionName: 'claimWithdrawal',
        args: [nftId],
      });

      const proposalData: ProposalExecuteData = {
        metaData: {
          title: t('lidoWithdrawalTitle'),
          description: t('lidoWithdrawalDescription'),
          documentationUrl: 'https://docs.lido.fi/guides/steth-integration-guide#claiming',
        },
        targets: [lido.withdrawalQueueContractAddress],
        calldatas: [encodedClaim],
        values: [0n],
      };
      await submitProposal({
        proposalData,
        nonce: safe?.nonce,
        pendingToastMessage: t('proposalCreatePendingToastMessage'),
        successToastMessage: t('proposalCreateSuccessToastMessage'),
        failedToastMessage: t('proposalCreateFailureToastMessage'),
      });
    },
    [lido, safeAddress, safe, submitProposal, t],
  );

  return { handleStake, handleUnstake, handleClaimUnstakedETH };
}
