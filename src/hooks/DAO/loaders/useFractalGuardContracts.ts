import { abis } from '@fractal-framework/fractal-contracts';
import { useCallback, useEffect, useRef } from 'react';
import { getContract, zeroAddress } from 'viem';
import { usePublicClient } from 'wagmi';
import { useFractal } from '../../../providers/App/AppProvider';
import { GuardContractAction } from '../../../providers/App/guardContracts/action';
import { useNetworkConfig } from '../../../providers/NetworkConfig/NetworkConfigProvider';
import { useDaoInfoStore } from '../../../store/daoInfo/useDaoInfoStore';
import { FreezeGuardType, FreezeVotingType } from '../../../types';
import { useAddressContractType } from '../../utils/useAddressContractType';
import { FractalModuleData, FractalModuleType, GnosisSafe } from './../../../types/fractal';

export const useFractalGuardContracts = ({ loadOnMount = true }: { loadOnMount?: boolean }) => {
  // load key for component; helps prevent unnecessary calls
  const loadKey = useRef<string>();
  const { action } = useFractal();

  const { daoModules, safe, subgraphInfo } = useDaoInfoStore();

  const safeAddress = safe?.address;

  const { chain } = useNetworkConfig();

  const { getAddressContractType } = useAddressContractType();

  const publicClient = usePublicClient();

  const loadFractalGuardContracts = useCallback(
    async (_safe: GnosisSafe, _fractalModules: FractalModuleData[]) => {
      if (!publicClient) {
        return;
      }

      const { guard } = _safe;

      const azoriusModule = _fractalModules?.find(
        module => module.moduleType === FractalModuleType.AZORIUS,
      );

      if (azoriusModule) {
        const azoriusContract = getContract({
          abi: abis.Azorius,
          address: azoriusModule.moduleAddress,
          client: publicClient,
        });

        const azoriusGuardAddress = await azoriusContract.read.getGuard();
        const { isFreezeGuardAzorius } = await getAddressContractType(azoriusGuardAddress);
        if (azoriusGuardAddress === zeroAddress || !isFreezeGuardAzorius) {
          return {
            freezeGuardContractAddress: undefined,
            freezeVotingContractAddress: undefined,
            freezeVotingType: null,
            freezeGuardType: null,
          };
        }

        const freezeGuardContract = getContract({
          abi: abis.AzoriusFreezeGuard,
          address: azoriusGuardAddress,
          client: publicClient,
        });

        const freezeVotingAddress = await freezeGuardContract.read.freezeVoting();
        const freezeVotingPossibilities = await getAddressContractType(freezeVotingAddress);
        let freezeVotingType;
        if (freezeVotingPossibilities.isFreezeVotingMultisig) {
          freezeVotingType = FreezeVotingType.MULTISIG;
        } else if (freezeVotingPossibilities.isFreezeVotingErc721) {
          freezeVotingType = FreezeVotingType.ERC721;
        } else if (freezeVotingPossibilities.isFreezeVotingErc20) {
          freezeVotingType = FreezeVotingType.ERC20;
        } else {
          throw new Error('Invalid freeze voting type');
        }

        return {
          freezeGuardContractAddress: azoriusGuardAddress,
          freezeVotingContractAddress: freezeVotingAddress,
          freezeVotingType,
          freezeGuardType: FreezeGuardType.AZORIUS,
        };
      } else if (guard) {
        const masterCopyData = await getAddressContractType(guard);
        if (!masterCopyData.isFreezeGuardMultisig || _safe.guard === zeroAddress) {
          return {
            freezeGuardContractAddress: undefined,
            freezeVotingContractAddress: undefined,
            freezeVotingType: null,
            freezeGuardType: null,
          };
        }

        const multisigFreezeGuardContract = getContract({
          abi: abis.MultisigFreezeGuard,
          address: guard,
          client: publicClient,
        });

        const votingAddress = await multisigFreezeGuardContract.read.freezeVoting();
        const freezeVotingMasterCopyData = await getAddressContractType(votingAddress);
        const freezeVotingType = freezeVotingMasterCopyData.isFreezeVotingMultisig
          ? FreezeVotingType.MULTISIG
          : freezeVotingMasterCopyData.isFreezeVotingErc721
            ? FreezeVotingType.ERC721
            : FreezeVotingType.ERC20;

        return {
          freezeGuardContractAddress: guard,
          freezeVotingContractAddress: votingAddress,
          freezeVotingType,
          freezeGuardType: FreezeGuardType.MULTISIG,
        };
      } else {
        return {
          freezeGuardContractAddress: undefined,
          freezeVotingContractAddress: undefined,
          freezeVotingType: null,
          freezeGuardType: null,
        };
      }
    },
    [getAddressContractType, publicClient],
  );

  const setGuardContracts = useCallback(async () => {
    if (!safe || daoModules === null) return;
    const contracts = await loadFractalGuardContracts(safe, daoModules);
    if (!contracts) return;
    action.dispatch({ type: GuardContractAction.SET_GUARD_CONTRACT, payload: contracts });
  }, [action, safe, daoModules, loadFractalGuardContracts]);

  useEffect(() => {
    if (
      loadOnMount &&
      safeAddress &&
      safeAddress + chain.id !== loadKey.current &&
      subgraphInfo !== null &&
      safe !== null
    ) {
      loadKey.current = safeAddress + chain.id;
      setGuardContracts();
    }

    if (!safeAddress) {
      loadKey.current = undefined;
    }
  }, [setGuardContracts, subgraphInfo, loadOnMount, chain, safeAddress, safe]);
  return loadFractalGuardContracts;
};
