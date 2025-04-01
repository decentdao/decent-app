import { abis } from '@fractal-framework/fractal-contracts';
import { useCallback, useEffect, useRef } from 'react';
import { Address, getContract } from 'viem';
import LockReleaseAbi from '../../../assets/abi/LockRelease';
import { useFractal } from '../../../providers/App/AppProvider';
import { GovernanceContractAction } from '../../../providers/App/governanceContracts/action';
import { useDaoInfoStore } from '../../../store/daoInfo/useDaoInfoStore';
import { DecentModule, FractalTokenType, FractalVotingStrategy } from '../../../types';
import { getAzoriusModuleFromModules } from '../../../utils';
import useNetworkPublicClient from '../../useNetworkPublicClient';
import {
  ContractTypeWithVersion,
  useAddressContractType,
} from '../../utils/useAddressContractType';
import useVotingStrategyAddress from '../../utils/useVotingStrategiesAddresses';

export const useGovernanceContracts = () => {
  // tracks the current valid DAO address; helps prevent unnecessary calls
  const currentValidAddress = useRef<string | null>();
  const { action } = useFractal();
  const node = useDaoInfoStore();
  const publicClient = useNetworkPublicClient();
  const { getAddressContractType } = useAddressContractType();

  const { getVotingStrategies } = useVotingStrategyAddress();
  const { modules, safe } = node;

  const safeAddress = safe?.address;

  const loadGovernanceContracts = useCallback(
    async (daoModules: DecentModule[]) => {
      const azoriusModule = getAzoriusModuleFromModules(daoModules);

      const votingStrategies = await getVotingStrategies();
      if (!azoriusModule || !votingStrategies) {
        action.dispatch({
          type: GovernanceContractAction.SET_GOVERNANCE_CONTRACT_ADDRESSES,
          payload: {
            linearVotingErc20Address: undefined,
            linearVotingErc721Address: undefined,
            linearVotingErc20WithHatsWhitelistingAddress: undefined,
            linearVotingErc721WithHatsWhitelistingAddress: undefined,
            strategies: [],
          },
        });
        return;
      }

      let votesTokenAddress: Address | undefined;
      let lockReleaseAddress: Address | undefined;

      const setGovTokenAddress = async (erc20VotingStrategyAddress: Address) => {
        if (votesTokenAddress) {
          return;
        }
        const ozLinearVotingContract = getContract({
          abi: abis.LinearERC20Voting,
          address: erc20VotingStrategyAddress,
          client: publicClient,
        });

        const govTokenAddress = await ozLinearVotingContract.read.governanceToken();
        // govTokenAddress might be either
        // - a valid VotesERC20 contract
        // - a valid LockRelease contract
        // - or none of these which is against business logic

        const { isVotesErc20 } = await getAddressContractType(govTokenAddress);

        if (isVotesErc20) {
          votesTokenAddress = govTokenAddress;
        } else {
          const possibleLockRelease = getContract({
            address: govTokenAddress,
            abi: LockReleaseAbi,
            client: { public: publicClient },
          });

          try {
            votesTokenAddress = await possibleLockRelease.read.token();
            lockReleaseAddress = govTokenAddress;
          } catch {
            throw new Error('Unknown governance token type');
          }
        }
      };

      let strategies: FractalVotingStrategy[] = [];

      const tokenType = (votingStrategy: ContractTypeWithVersion): FractalTokenType | undefined => {
        if (
          votingStrategy.isLinearVotingErc20 ||
          votingStrategy.isLinearVotingErc20WithHatsProposalCreation
        ) {
          return FractalTokenType.erc20;
        } else if (
          votingStrategy.isLinearVotingErc721 ||
          votingStrategy.isLinearVotingErc721WithHatsProposalCreation
        ) {
          return FractalTokenType.erc721;
        } else {
          return undefined;
        }
      };

      const hasWhitelist = (votingStrategy: ContractTypeWithVersion): boolean | undefined => {
        if (
          votingStrategy.isLinearVotingErc20WithHatsProposalCreation ||
          votingStrategy.isLinearVotingErc721WithHatsProposalCreation
        ) {
          return true;
        } else if (votingStrategy.isLinearVotingErc20 || votingStrategy.isLinearVotingErc721) {
          return false;
        } else {
          return undefined;
        }
      };

      await Promise.all(
        votingStrategies.map(async votingStrategy => {
          const type = tokenType(votingStrategy);
          const whitelist = hasWhitelist(votingStrategy);
          if (type != undefined && whitelist != undefined) {
            const strategy = {
              address: votingStrategy.strategyAddress,
              type: type,
              withWhitelist: whitelist,
              version: votingStrategy.version,
            };
            strategies.push(strategy);
          }
          if (type == FractalTokenType.erc20) {
            await setGovTokenAddress(votingStrategy.strategyAddress);
          }
        }),
      );

      if (strategies.length > 0) {
        let linearVotingErc20Address = strategies.find(strategy => {
          return strategy.type == FractalTokenType.erc20 && strategy.withWhitelist == false;
        })?.address;
        let linearVotingErc20WithHatsWhitelistingAddress = strategies.find(strategy => {
          return strategy.type == FractalTokenType.erc20 && strategy.withWhitelist == true;
        })?.address;
        let linearVotingErc721Address = strategies.find(strategy => {
          return strategy.type == FractalTokenType.erc721 && strategy.withWhitelist == false;
        })?.address;
        let linearVotingErc721WithHatsWhitelistingAddress = strategies.find(strategy => {
          return strategy.type == FractalTokenType.erc721 && strategy.withWhitelist == true;
        })?.address;

        action.dispatch({
          type: GovernanceContractAction.SET_GOVERNANCE_CONTRACT_ADDRESSES,
          payload: {
            linearVotingErc20Address,
            linearVotingErc721Address,
            linearVotingErc20WithHatsWhitelistingAddress,
            linearVotingErc721WithHatsWhitelistingAddress,
            votesTokenAddress,
            lockReleaseAddress,
            moduleAzoriusAddress: azoriusModule.moduleAddress,
            strategies: strategies,
          },
        });
      }
    },
    [action, getVotingStrategies, publicClient, getAddressContractType],
  );

  useEffect(() => {
    if (
      safeAddress !== undefined &&
      currentValidAddress.current !== safeAddress &&
      modules !== null
    ) {
      loadGovernanceContracts(modules);
      currentValidAddress.current = safeAddress;
    }
    if (!safeAddress) {
      currentValidAddress.current = null;
    }
  }, [modules, loadGovernanceContracts, safeAddress]);
};
