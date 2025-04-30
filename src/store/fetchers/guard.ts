import { abis } from '@fractal-framework/fractal-contracts';
import { useCallback } from 'react';
import { Address, getContract, GetContractReturnType, PublicClient, zeroAddress } from 'viem';
import GnosisSafeL2Abi from '../../assets/abi/GnosisSafeL2';
import {
  isWithinFreezePeriod,
  isWithinFreezeProposalPeriod,
} from '../../helpers/freezePeriodHelpers';
import useUserERC721VotingTokens from '../../hooks/DAO/proposal/useUserERC721VotingTokens';
import useNetworkPublicClient from '../../hooks/useNetworkPublicClient';
import { useAddressContractType } from '../../hooks/utils/useAddressContractType';
import { DecentModule, FreezeGuardType, FreezeVotingType } from '../../types';
import { blocksToSeconds, getTimeStamp } from '../../utils/contract';

export function useGuardFetcher() {
  const publicClient = useNetworkPublicClient();
  const { getUserERC721VotingTokens } = useUserERC721VotingTokens(null, null, false);
  const { getAddressContractType } = useAddressContractType();

  const fetchDAOGuard = useCallback(
    async ({
      guardAddress,
      _azoriusModule,
    }: {
      guardAddress: Address;
      _azoriusModule?: DecentModule;
    }) => {
      if (_azoriusModule) {
        const azoriusContract = getContract({
          abi: abis.Azorius,
          address: _azoriusModule.moduleAddress,
          client: publicClient,
        });

        const azoriusGuardAddress = await azoriusContract.read.getGuard();
        const { isFreezeGuardAzorius } = await getAddressContractType(azoriusGuardAddress);

        if (azoriusGuardAddress === zeroAddress || !isFreezeGuardAzorius) {
          return;
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

        let freezeVotingContract:
          | GetContractReturnType<typeof abis.MultisigFreezeVoting, PublicClient>
          | GetContractReturnType<typeof abis.ERC20FreezeVoting, PublicClient>
          | GetContractReturnType<typeof abis.ERC721FreezeVoting, PublicClient>;

        if (freezeVotingType === FreezeVotingType.ERC20) {
          freezeVotingContract = getContract({
            abi: abis.ERC20FreezeVoting,
            address: freezeVotingAddress,
            client: publicClient,
          });
        } else if (freezeVotingType === FreezeVotingType.ERC721) {
          freezeVotingContract = getContract({
            abi: abis.ERC721FreezeVoting,
            address: freezeVotingAddress,
            client: publicClient,
          });
        } else if (freezeVotingType === FreezeVotingType.MULTISIG) {
          freezeVotingContract = getContract({
            abi: abis.MultisigFreezeVoting,
            address: freezeVotingAddress,
            client: publicClient,
          });
        } else {
          throw new Error('unknown freezeVotingType');
        }

        const [
          freezeVotesThreshold,
          freezeProposalCreatedBlock,
          freezeProposalVoteCount,
          freezeProposalBlock,
          freezePeriodBlock,
          isFrozen,
        ] = await Promise.all([
          freezeVotingContract.read.freezeVotesThreshold(),
          freezeVotingContract.read.freezeProposalCreatedBlock(),
          freezeVotingContract.read.freezeProposalVoteCount(),
          freezeVotingContract.read.freezeProposalPeriod(),
          freezeVotingContract.read.freezePeriod(),
          freezeVotingContract.read.isFrozen(),
        ]);

        // timestamp when proposal was created
        const freezeProposalCreatedTime = await getTimeStamp(
          freezeProposalCreatedBlock,
          publicClient,
        );

        // length of time to vote on freeze
        const freezeProposalPeriod = await blocksToSeconds(freezeProposalBlock, publicClient);

        // length of time frozen for in seconds
        const freezePeriod = await blocksToSeconds(freezePeriodBlock, publicClient);

        const freezeGuard = {
          freezeVotesThreshold,
          freezeProposalCreatedTime: BigInt(freezeProposalCreatedTime),
          freezeProposalVoteCount,
          freezeProposalPeriod: BigInt(freezeProposalPeriod),
          freezePeriod: BigInt(freezePeriod),
          isFrozen,
        };

        return {
          freezeGuardContractAddress: azoriusGuardAddress,
          freezeVotingContractAddress: freezeVotingAddress,
          freezeVotingType,
          freezeGuardType: FreezeGuardType.AZORIUS,
          ...freezeGuard,
        };
      } else if (guardAddress) {
        const multisigFreezeGuardContract = getContract({
          abi: abis.MultisigFreezeGuard,
          address: guardAddress,
          client: publicClient,
        });

        const freezeVotingAddress = await multisigFreezeGuardContract.read.freezeVoting();
        const freezeVotingMasterCopyData = await getAddressContractType(freezeVotingAddress);
        const freezeVotingType = freezeVotingMasterCopyData.isFreezeVotingMultisig
          ? FreezeVotingType.MULTISIG
          : freezeVotingMasterCopyData.isFreezeVotingErc721
            ? FreezeVotingType.ERC721
            : FreezeVotingType.ERC20;

        let freezeVotingContract:
          | GetContractReturnType<typeof abis.MultisigFreezeVoting, PublicClient>
          | GetContractReturnType<typeof abis.ERC20FreezeVoting, PublicClient>
          | GetContractReturnType<typeof abis.ERC721FreezeVoting, PublicClient>;

        if (freezeVotingType === FreezeVotingType.ERC20) {
          freezeVotingContract = getContract({
            abi: abis.ERC20FreezeVoting,
            address: freezeVotingAddress,
            client: publicClient,
          });
        } else if (freezeVotingType === FreezeVotingType.ERC721) {
          freezeVotingContract = getContract({
            abi: abis.ERC721FreezeVoting,
            address: freezeVotingAddress,
            client: publicClient,
          });
        } else if (freezeVotingType === FreezeVotingType.MULTISIG) {
          freezeVotingContract = getContract({
            abi: abis.MultisigFreezeVoting,
            address: freezeVotingAddress,
            client: publicClient,
          });
        } else {
          throw new Error('unknown freezeVotingType');
        }

        const [
          freezeVotesThreshold,
          freezeProposalCreatedBlock,
          freezeProposalVoteCount,
          freezeProposalBlock,
          freezePeriodBlock,
          isFrozen,
        ] = await Promise.all([
          freezeVotingContract.read.freezeVotesThreshold(),
          freezeVotingContract.read.freezeProposalCreatedBlock(),
          freezeVotingContract.read.freezeProposalVoteCount(),
          freezeVotingContract.read.freezeProposalPeriod(),
          freezeVotingContract.read.freezePeriod(),
          freezeVotingContract.read.isFrozen(),
        ]);

        // timestamp when proposal was created
        const freezeProposalCreatedTime = await getTimeStamp(
          freezeProposalCreatedBlock,
          publicClient,
        );

        // length of time to vote on freeze
        const freezeProposalPeriod = await blocksToSeconds(freezeProposalBlock, publicClient);

        // length of time frozen for in seconds
        const freezePeriod = await blocksToSeconds(freezePeriodBlock, publicClient);

        const freezeGuard = {
          freezeVotesThreshold,
          freezeProposalCreatedTime: BigInt(freezeProposalCreatedTime),
          freezeProposalVoteCount,
          freezeProposalPeriod: BigInt(freezeProposalPeriod),
          freezePeriod: BigInt(freezePeriod),
          isFrozen,
        };

        return {
          freezeGuardContractAddress: guardAddress,
          freezeVotingContractAddress: freezeVotingAddress,
          freezeVotingType,
          freezeGuardType: FreezeGuardType.MULTISIG,
          ...freezeGuard,
        };
      }
    },
    [publicClient, getAddressContractType],
  );

  const fetchGuardAccountData = useCallback(
    async ({
      account,
      azoriusGuardAddress,
      multisigGuardAddress,
      freezeVotingType,
      freezeVotingAddress,
      _parentSafeAddress,
      freezeProposalCreatedTime,
      freezeProposalPeriod,
      freezePeriod,
    }: {
      account: Address;
      azoriusGuardAddress?: Address;
      multisigGuardAddress?: Address;
      freezeVotingType: FreezeVotingType;
      freezeVotingAddress: Address;
      _parentSafeAddress: Address | null;
      freezeProposalCreatedTime: bigint;
      freezeProposalPeriod: bigint;
      freezePeriod: bigint;
    }) => {
      let userHasFreezeVoted = false;
      let userHasVotes = false;

      if (multisigGuardAddress) {
        const freezeVotingContract = getContract({
          abi: abis.MultisigFreezeVoting,
          address: freezeVotingAddress,
          client: publicClient,
        });
        const freezeCreatedBlock = await freezeVotingContract.read.freezeProposalCreatedBlock();
        userHasFreezeVoted = await freezeVotingContract.read.userHasFreezeVoted([
          account || zeroAddress,
          BigInt(freezeCreatedBlock),
        ]);

        if (freezeVotingType === FreezeVotingType.MULTISIG) {
          const safeFreezeVotingContract = getContract({
            abi: abis.MultisigFreezeVoting,
            address: freezeVotingAddress,
            client: publicClient,
          });

          // TODO: We can attempt reading from Zustand store here and fallback to reading on-chain.
          const safeContract = getContract({
            abi: GnosisSafeL2Abi,
            address: await safeFreezeVotingContract.read.parentGnosisSafe(),
            client: publicClient,
          });
          const owners = await safeContract.read.getOwners();
          userHasVotes = owners.find(owner => owner === account) !== undefined;
        } else if (freezeVotingType === FreezeVotingType.ERC20) {
          const freezeERC20VotingContract = getContract({
            abi: abis.ERC20FreezeVoting,
            address: freezeVotingAddress,
            client: publicClient,
          });
          const votesERC20Address = await freezeERC20VotingContract.read.votesERC20();
          const { isVotesErc20 } = await getAddressContractType(votesERC20Address);
          if (!isVotesErc20) {
            throw new Error('votesERC20Address is not a valid VotesERC20 contract');
          }
          const votesTokenContract = getContract({
            abi: abis.VotesERC20,
            address: votesERC20Address,
            client: publicClient,
          });
          const currentTimestamp = await getTimeStamp('latest', publicClient);
          const isFreezeActive =
            isWithinFreezeProposalPeriod(
              freezeProposalCreatedTime,
              freezeProposalPeriod,
              BigInt(currentTimestamp),
            ) ||
            isWithinFreezePeriod(freezeProposalCreatedTime, freezePeriod, BigInt(currentTimestamp));
          userHasVotes =
            (!isFreezeActive
              ? // freeze not active
                await votesTokenContract.read.getVotes([account || zeroAddress])
              : // freeze is active
                await votesTokenContract.read.getPastVotes([
                  account || zeroAddress,
                  BigInt(freezeCreatedBlock),
                ])) > 0n;
        } else if (freezeVotingType === FreezeVotingType.ERC721) {
          const { totalVotingTokenAddresses } = await getUserERC721VotingTokens(
            _parentSafeAddress,
            null,
          );
          userHasVotes = totalVotingTokenAddresses.length > 0;
        }
      } else if (azoriusGuardAddress) {
        let freezeVotingContract:
          | GetContractReturnType<typeof abis.MultisigFreezeVoting, PublicClient>
          | GetContractReturnType<typeof abis.ERC20FreezeVoting, PublicClient>
          | GetContractReturnType<typeof abis.ERC721FreezeVoting, PublicClient>;

        if (freezeVotingType === FreezeVotingType.ERC20) {
          freezeVotingContract = getContract({
            abi: abis.ERC20FreezeVoting,
            address: freezeVotingAddress,
            client: publicClient,
          });
        } else if (freezeVotingType === FreezeVotingType.ERC721) {
          freezeVotingContract = getContract({
            abi: abis.ERC721FreezeVoting,
            address: freezeVotingAddress,
            client: publicClient,
          });
        } else if (freezeVotingType === FreezeVotingType.MULTISIG) {
          freezeVotingContract = getContract({
            abi: abis.MultisigFreezeVoting,
            address: freezeVotingAddress,
            client: publicClient,
          });
        } else {
          throw new Error('unknown freezeVotingType');
        }
        const freezeCreatedBlock = await freezeVotingContract.read.freezeProposalCreatedBlock();
        userHasFreezeVoted = await freezeVotingContract.read.userHasFreezeVoted([
          account || zeroAddress,
          BigInt(freezeCreatedBlock),
        ]);

        if (freezeVotingType === FreezeVotingType.MULTISIG) {
          const safeFreezeVotingContract = getContract({
            abi: abis.MultisigFreezeVoting,
            address: freezeVotingAddress,
            client: publicClient,
          });

          // TODO: We can attempt reading from Zustand store here and fallback to reading on-chain.
          const safeContract = getContract({
            abi: GnosisSafeL2Abi,
            address: await safeFreezeVotingContract.read.parentGnosisSafe(),
            client: publicClient,
          });
          const owners = await safeContract.read.getOwners();
          userHasVotes = owners.find(owner => owner === account) !== undefined;
        } else if (freezeVotingType === FreezeVotingType.ERC20) {
          const freezeERC20VotingContract = getContract({
            abi: abis.ERC20FreezeVoting,
            address: freezeVotingAddress,
            client: publicClient,
          });
          const votesERC20Address = await freezeERC20VotingContract.read.votesERC20();
          const { isVotesErc20 } = await getAddressContractType(votesERC20Address);
          if (!isVotesErc20) {
            throw new Error('votesERC20Address is not a valid VotesERC20 contract');
          }
          const votesTokenContract = getContract({
            abi: abis.VotesERC20,
            address: votesERC20Address,
            client: publicClient,
          });
          const currentTimestamp = await getTimeStamp('latest', publicClient);
          const isFreezeActive =
            isWithinFreezeProposalPeriod(
              freezeProposalCreatedTime,
              freezeProposalPeriod,
              BigInt(currentTimestamp),
            ) ||
            isWithinFreezePeriod(freezeProposalCreatedTime, freezePeriod, BigInt(currentTimestamp));
          userHasVotes =
            (!isFreezeActive
              ? // freeze not active
                await votesTokenContract.read.getVotes([account || zeroAddress])
              : // freeze is active
                await votesTokenContract.read.getPastVotes([
                  account || zeroAddress,
                  BigInt(freezeCreatedBlock),
                ])) > 0n;
        } else if (freezeVotingType === FreezeVotingType.ERC721) {
          const { totalVotingTokenAddresses } = await getUserERC721VotingTokens(
            _parentSafeAddress,
            null,
          );
          userHasVotes = totalVotingTokenAddresses.length > 0;
        }
      }

      return {
        userHasFreezeVoted,
        userHasVotes,
      };
    },
    [publicClient, getAddressContractType, getUserERC721VotingTokens],
  );

  return { fetchDAOGuard, fetchGuardAccountData };
}
