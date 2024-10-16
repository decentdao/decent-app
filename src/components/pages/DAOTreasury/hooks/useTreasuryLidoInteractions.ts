import { useState, useEffect } from 'react';
import { getContract } from 'viem';
import { usePublicClient } from 'wagmi';
import LidoWithdrawalQueueAbi from '../../../../assets/abi/LidoWithdrawalQueueAbi';
import useLidoStaking from '../../../../hooks/stake/lido/useLidoStaking';
import { useCanUserCreateProposal } from '../../../../hooks/utils/useCanUserSubmitProposal';
import { useFractal } from '../../../../providers/App/AppProvider';
import { useNetworkConfig } from '../../../../providers/NetworkConfig/NetworkConfigProvider';
import { ModalType } from '../../../ui/modals/ModalProvider';
import { useDecentModal } from '../../../ui/modals/useDecentModal';

export default function useTreasuryLidoInteractions() {
  const {
    treasury: { assetsFungible, assetsNonFungible },
  } = useFractal();
  const ethAsset = assetsFungible.find(asset => !asset.tokenAddress);
  const { handleUnstake, handleClaimUnstakedETH } = useLidoStaking();
  const { canUserCreateProposal } = useCanUserCreateProposal();
  const { staking } = useNetworkConfig();
  const publicClient = usePublicClient();

  // --- Lido Stake button setup ---
  const showStakeButton =
    canUserCreateProposal &&
    Object.keys(staking).length > 0 &&
    ethAsset &&
    BigInt(ethAsset.balance) > 0n;
  const openStakingModal = useDecentModal(ModalType.STAKE);

  // --- Lido Unstake button setup ---
  const stETHAsset = assetsFungible.find(
    asset => asset.tokenAddress === staking?.lido?.stETHContractAddress,
  );
  const showUnstakeButton = canUserCreateProposal && staking.lido && stETHAsset;
  const handleUnstakeButtonClick = () => {
    if (stETHAsset) {
      handleUnstake(stETHAsset.balance);
    }
  };

  // --- Lido Claim ETH button setup ---

  const [isLidoClaimable, setIsLidoClaimable] = useState(false);
  const lidoWithdrawalNFT = assetsNonFungible.find(
    asset => asset.tokenAddress === staking.lido?.withdrawalQueueContractAddress,
  );
  const showClaimETHButton = canUserCreateProposal && staking.lido && lidoWithdrawalNFT;

  useEffect(() => {
    const getLidoClaimableStatus = async () => {
      if (!staking.lido?.withdrawalQueueContractAddress || !lidoWithdrawalNFT || !publicClient) {
        return;
      }

      const withdrawalQueueContract = getContract({
        address: staking.lido.withdrawalQueueContractAddress,
        abi: LidoWithdrawalQueueAbi,
        client: publicClient,
      });

      // Since we're checking for the single NFT - we can grab first array element
      const claimableStatus = (
        await withdrawalQueueContract.read.getWithdrawalStatus([
          [BigInt(lidoWithdrawalNFT.tokenId)],
        ])
      )[0];

      if (claimableStatus.isFinalized !== isLidoClaimable) {
        setIsLidoClaimable(claimableStatus.isFinalized);
      }
    };

    getLidoClaimableStatus();
  }, [staking, isLidoClaimable, publicClient, lidoWithdrawalNFT]);

  const handleClickClaimButton = () => {
    handleClaimUnstakedETH(BigInt(lidoWithdrawalNFT!.tokenId));
  };

  return {
    handleClickClaimButton,
    showClaimETHButton,
    showUnstakeButton,
    handleUnstakeButtonClick,
    showStakeButton,
    openStakingModal,
    isLidoClaimable,
  };
}
