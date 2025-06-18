import { Icon, IconButton } from '@chakra-ui/react';
import { abis } from '@fractal-framework/fractal-contracts';
import { GearFine } from '@phosphor-icons/react';
import { useMemo } from 'react';
import { getContract } from 'viem';
import {
  isWithinFreezePeriod,
  isWithinFreezeProposalPeriod,
} from '../../../../helpers/freezePeriodHelpers';
import useUserERC721VotingTokens from '../../../../hooks/DAO/proposal/useUserERC721VotingTokens';
import useClawBack from '../../../../hooks/DAO/useClawBack';
import { useCurrentDAOKey } from '../../../../hooks/DAO/useCurrentDAOKey';
import { useNetworkWalletClient } from '../../../../hooks/useNetworkWalletClient';
import useBlockTimestamp from '../../../../hooks/utils/useBlockTimestamp';
import { useDAOStore } from '../../../../providers/App/AppProvider';
import { FractalModuleType, FreezeVotingType } from '../../../../types';
import { ModalType } from '../../modals/ModalProvider';
import { useDecentModal } from '../../modals/useDecentModal';
import { OptionMenu } from '../OptionMenu';

export function ManageDAOMenu() {
  const { daoKey } = useCurrentDAOKey();
  const {
    guard,
    guardAccountData,
    guardContracts,
    node: { safe, subgraphInfo, modules },
  } = useDAOStore({ daoKey });

  const currentTime = BigInt(useBlockTimestamp());

  const safeAddress = safe?.address;
  const { getUserERC721VotingTokens } = useUserERC721VotingTokens(safeAddress ?? null, null, false);
  const { handleClawBack } = useClawBack({
    parentAddress: subgraphInfo?.parentAddress ?? null,
    childSafeInfo: {
      daoAddress: safe?.address,
      modules: modules,
    },
  });

  const { open: openSettingsModal } = useDecentModal(ModalType.SAFE_SETTINGS);

  const { data: walletClient } = useNetworkWalletClient();

  const freezeOption = useMemo(
    () => ({
      optionKey: 'optionInitiateFreeze',
      onClick: () => {
        const freezeVotingType = guardContracts.freezeVotingType;

        if (freezeVotingType === FreezeVotingType.MULTISIG) {
          if (!guardContracts.freezeVotingContractAddress) {
            throw new Error('freeze voting contract address not set');
          }
          if (!walletClient) {
            throw new Error('wallet client not set');
          }

          const freezeVotingContract = getContract({
            abi: abis.MultisigFreezeVoting,
            address: guardContracts.freezeVotingContractAddress,
            client: walletClient,
          });
          return freezeVotingContract.write.castFreezeVote();
        } else if (freezeVotingType === FreezeVotingType.ERC20) {
          if (!guardContracts.freezeVotingContractAddress) {
            throw new Error('freeze voting contract address not set');
          }
          if (!walletClient) {
            throw new Error('wallet client not set');
          }
          const contract = getContract({
            abi: abis.ERC20FreezeVoting,
            address: guardContracts.freezeVotingContractAddress,
            client: walletClient,
          });
          return contract.write.castFreezeVote();
        } else if (freezeVotingType === FreezeVotingType.ERC721) {
          getUserERC721VotingTokens(subgraphInfo?.parentAddress ?? null, null).then(tokensInfo => {
            if (!guardContracts.freezeVotingContractAddress) {
              throw new Error('freeze voting contract address not set');
            }
            if (!walletClient) {
              throw new Error('wallet client not set');
            }
            const freezeERC721VotingContract = getContract({
              abi: abis.ERC721FreezeVoting,
              address: guardContracts.freezeVotingContractAddress,
              client: walletClient,
            });
            return freezeERC721VotingContract.write.castFreezeVote([
              tokensInfo.totalVotingTokenAddresses,
              tokensInfo.totalVotingTokenIds.map(i => BigInt(i)),
            ]);
          });
        }
      },
    }),
    [
      subgraphInfo?.parentAddress,
      getUserERC721VotingTokens,
      guardContracts.freezeVotingContractAddress,
      guardContracts.freezeVotingType,
      walletClient,
    ],
  );

  const options = useMemo(() => {
    const clawBackOption = {
      optionKey: 'optionInitiateClawback',
      onClick: handleClawBack,
    };

    const settingsOption = {
      optionKey: 'optionSettings',
      onClick: openSettingsModal,
    };

    if (
      guard.freezeProposalCreatedTime !== null &&
      guard.freezeProposalPeriod !== null &&
      guard.freezePeriod !== null &&
      !isWithinFreezeProposalPeriod(
        guard.freezeProposalCreatedTime,
        guard.freezeProposalPeriod,
        currentTime,
      ) &&
      !isWithinFreezePeriod(guard.freezeProposalCreatedTime, guard.freezePeriod, currentTime) &&
      guardAccountData.userHasVotes
    ) {
      return [settingsOption, freezeOption];
    } else if (
      guard.freezeProposalCreatedTime !== null &&
      guard.freezePeriod !== null &&
      isWithinFreezePeriod(guard.freezeProposalCreatedTime, guard.freezePeriod, currentTime) &&
      guard.isFrozen &&
      guardAccountData.userHasVotes
    ) {
      const fractalModule = (modules ?? []).find(
        module => module.moduleType === FractalModuleType.FRACTAL,
      );
      if (fractalModule) {
        return [settingsOption, clawBackOption];
      } else {
        return [settingsOption];
      }
    } else {
      return [settingsOption];
    }
  }, [
    handleClawBack,
    openSettingsModal,
    guard.freezeProposalCreatedTime,
    guard.freezeProposalPeriod,
    guard.freezePeriod,
    guard.isFrozen,
    currentTime,
    guardAccountData.userHasVotes,
    freezeOption,
    modules,
  ]);

  return options.length === 1 ? (
    <IconButton
      aria-label="Manage DAO"
      icon={
        <Icon
          as={GearFine}
          boxSize="1.25rem"
        />
      }
      onClick={options[0].onClick}
      variant="tertiary"
      p="0.25rem"
      h="fit-content"
      sx={{
        span: {
          h: '1.25rem',
        },
      }}
    />
  ) : (
    <OptionMenu
      trigger={
        <Icon
          as={GearFine}
          boxSize="1.25rem"
        />
      }
      options={options}
      namespace="menu"
      buttonAs={IconButton}
      buttonProps={{
        variant: 'tertiary',
        p: '0.25rem',
        h: 'fit-content',
        sx: {
          span: {
            h: '1.25rem',
          },
        },
      }}
    />
  );
}
