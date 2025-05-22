import { Icon, IconButton, useBreakpointValue } from '@chakra-ui/react';
import { abis } from '@fractal-framework/fractal-contracts';
import { GearFine } from '@phosphor-icons/react';
import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getContract } from 'viem';
import { DAO_ROUTES } from '../../../../constants/routes';
import useFeatureFlag from '../../../../helpers/environmentFeatureFlags';
import {
  isWithinFreezePeriod,
  isWithinFreezeProposalPeriod,
} from '../../../../helpers/freezePeriodHelpers';
import useUserERC721VotingTokens from '../../../../hooks/DAO/proposal/useUserERC721VotingTokens';
import useClawBack from '../../../../hooks/DAO/useClawBack';
import { useCurrentDAOKey } from '../../../../hooks/DAO/useCurrentDAOKey';
import { useNetworkWalletClient } from '../../../../hooks/useNetworkWalletClient';
import useBlockTimestamp from '../../../../hooks/utils/useBlockTimestamp';
import { useCanUserCreateProposal } from '../../../../hooks/utils/useCanUserSubmitProposal';
import { useDAOStore } from '../../../../providers/App/AppProvider';
import { useNetworkConfigStore } from '../../../../providers/NetworkConfig/useNetworkConfigStore';
import { FractalModuleType, FreezeVotingType, GovernanceType } from '../../../../types';
import { ModalType } from '../../modals/ModalProvider';
import { useDecentModal } from '../../modals/useDecentModal';
import { OptionMenu } from '../OptionMenu';

export function ManageDAOMenu() {
  const { daoKey } = useCurrentDAOKey();
  const {
    governance: { type },
    guard,
    guardContracts,
    node: { safe, subgraphInfo, modules },
  } = useDAOStore({ daoKey });
  const currentTime = BigInt(useBlockTimestamp());
  const navigate = useNavigate();
  const safeAddress = safe?.address;
  const { canUserCreateProposal } = useCanUserCreateProposal();
  const { getUserERC721VotingTokens } = useUserERC721VotingTokens(safeAddress ?? null, null, false);
  const { handleClawBack } = useClawBack({
    parentAddress: subgraphInfo?.parentAddress ?? null,
    childSafeInfo: {
      daoAddress: safe?.address,
      modules: modules,
    },
  });

  const { addressPrefix } = useNetworkConfigStore();

  const openSettingsModal = useDecentModal(ModalType.SAFE_SETTINGS);

  const settingsV1FeatureEnabled = useFeatureFlag('flag_settings_v1');
  const isMobile = useBreakpointValue({ base: true, md: false });

  const handleNavigateToSettings = useCallback(() => {
    if (safeAddress) {
      if (!isMobile && settingsV1FeatureEnabled) {
        openSettingsModal();
      } else {
        navigate(DAO_ROUTES.settings.relative(addressPrefix, safeAddress));
      }
    }
  }, [safeAddress, isMobile, settingsV1FeatureEnabled, navigate, addressPrefix, openSettingsModal]);

  const handleModifyGovernance = useDecentModal(ModalType.CONFIRM_MODIFY_GOVERNANCE);

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

    // @todo: Remove after feature flag is removed (https://linear.app/decent-labs/issue/ENG-796/remove-modifygovernanceoption-completely)
    const modifyGovernanceOption = {
      optionKey: 'optionModifyGovernance',
      onClick: handleModifyGovernance,
    };

    const settingsOption = {
      optionKey: 'optionSettings',
      onClick: handleNavigateToSettings,
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
      guard.userHasVotes
    ) {
      if (!settingsV1FeatureEnabled && type === GovernanceType.MULTISIG) {
        return [settingsOption, freezeOption, modifyGovernanceOption];
      } else {
        return [settingsOption, freezeOption];
      }
    } else if (
      guard.freezeProposalCreatedTime !== null &&
      guard.freezePeriod !== null &&
      isWithinFreezePeriod(guard.freezeProposalCreatedTime, guard.freezePeriod, currentTime) &&
      guard.isFrozen &&
      guard.userHasVotes
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
      return [
        settingsOption,
        ...(!settingsV1FeatureEnabled && canUserCreateProposal && type === GovernanceType.MULTISIG
          ? [modifyGovernanceOption]
          : []),
      ];
    }
  }, [
    guard,
    currentTime,
    type,
    handleClawBack,
    settingsV1FeatureEnabled,
    handleModifyGovernance,
    handleNavigateToSettings,
    freezeOption,
    modules,
    canUserCreateProposal,
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
