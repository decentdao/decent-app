import { abis } from '@fractal-framework/fractal-contracts';
import { SafeMultisigTransactionListResponse } from '@safe-global/api-kit';
import { useCallback } from 'react';
import { Address, getAddress, getContract, isAddress } from 'viem';
import { isApproved, isRejected } from '../../helpers/activity';
import { isMultisigRejectionProposal } from '../../helpers/multisigProposal';
import { useDAOStore } from '../../providers/App/AppProvider';
import { FractalProposal, FractalProposalState } from '../../types';
import { parseDecodedData } from '../../utils';
import { getAverageBlockTime } from '../../utils/contract';
import { getTxTimelockedTimestamp } from '../../utils/guard';
import { useCurrentDAOKey } from '../DAO/useCurrentDAOKey';
import useNetworkPublicClient from '../useNetworkPublicClient';
import { useSafeDecoder } from './useSafeDecoder';

type FreezeGuardData = {
  guardTimelockPeriodMs: bigint;
  guardExecutionPeriodMs: bigint;
  lastBlockTimestamp: number;
};

export const useSafeTransactions = () => {
  const { daoKey } = useCurrentDAOKey();
  const { guardContracts } = useDAOStore({ daoKey });
  const decode = useSafeDecoder();
  const publicClient = useNetworkPublicClient();

  const getState = useCallback(
    async (
      activities: FractalProposal[],
      freezeGuardAddress?: Address,
      freezeGuardData?: FreezeGuardData,
    ) => {
      if (freezeGuardAddress && freezeGuardData) {
        return Promise.all(
          activities.map(async (activity, _, activityArr) => {
            if (!activity.transaction) {
              return activity;
            }

            let state: FractalProposalState;

            if (activity.transaction.isExecuted) {
              // the transaction has already been executed
              state = FractalProposalState.EXECUTED;
            } else if (isRejected(activityArr, activity.transaction)) {
              // a different transaction with the same nonce has already
              // been executed, so this is no longer valid
              state = FractalProposalState.REJECTED;
            } else {
              // it's not executed or rejected, so we need to check the timelock status
              const timelockedTimestampMs =
                (await getTxTimelockedTimestamp(activity, freezeGuardAddress, publicClient)) * 1000;
              if (timelockedTimestampMs === 0) {
                // not yet timelocked
                if (isApproved(activity.transaction)) {
                  // the proposal has enough signatures, so it can now be timelocked
                  state = FractalProposalState.TIMELOCKABLE;
                } else {
                  // not enough signatures on the proposal, it's still active
                  state = FractalProposalState.ACTIVE;
                }
              } else {
                // the proposal has been timelocked

                const timeLockPeriodEndMs =
                  timelockedTimestampMs + Number(freezeGuardData.guardTimelockPeriodMs);
                const nowMs = freezeGuardData.lastBlockTimestamp * 1000;
                if (nowMs > timeLockPeriodEndMs) {
                  // Timelock has ended, check execution period
                  const executionPeriodEndMs =
                    timeLockPeriodEndMs + Number(freezeGuardData.guardExecutionPeriodMs);
                  if (nowMs < executionPeriodEndMs) {
                    // Within execution period
                    state = FractalProposalState.EXECUTABLE;
                  } else {
                    // Execution period has ended
                    state = FractalProposalState.EXPIRED;
                  }
                } else {
                  // Still within timelock period
                  state = FractalProposalState.TIMELOCKED;
                }
              }
            }
            return { ...activity, state };
          }),
        );
      } else {
        return activities.map((activity, _, activityArr) => {
          if (!activity.transaction) {
            return activity;
          }

          let state;
          if (activity.transaction.isExecuted) {
            state = FractalProposalState.EXECUTED;
          } else if (isRejected(activityArr, activity.transaction)) {
            state = FractalProposalState.REJECTED;
          } else if (isApproved(activity.transaction)) {
            state = FractalProposalState.EXECUTABLE;
          } else {
            state = FractalProposalState.ACTIVE;
          }
          return { ...activity, state };
        });
      }
    },
    [publicClient],
  );

  const parseTransactions = useCallback(
    async (transactions: SafeMultisigTransactionListResponse) => {
      if (!transactions.results.length) {
        return [];
      }

      const activities = await Promise.all(
        transactions.results.map(async transaction => {
          const eventDate = new Date(transaction.submissionDate);

          const eventSafeTxHash = transaction.safeTxHash;

          const eventNonce = transaction.nonce;

          const isMultisigRejectionTx: boolean | undefined = isMultisigRejectionProposal(
            transaction.safe,
            transaction.nonce,
            transaction,
          );

          const confirmations = transaction.confirmations ?? [];

          const data = transaction.dataDecoded
            ? {
                decodedTransactions: parseDecodedData(transaction, true),
              }
            : {
                decodedTransactions: await decode(
                  transaction.value,
                  getAddress(transaction.to),
                  transaction.data,
                ),
              };

          const targets = data
            ? [...data.decodedTransactions.map(tx => tx.target)]
            : [getAddress(transaction.to)];

          const activity: FractalProposal = {
            transaction,
            eventDate,
            confirmations,
            signersThreshold: transaction.confirmationsRequired,
            isMultisigRejectionTx,
            proposalId: eventSafeTxHash,
            targets,
            // @dev proposer can be null when its the first transaction
            proposer: isAddress(transaction.proposer)
              ? getAddress(transaction.proposer)
              : transaction.nonce === 0 && transaction.executor && isAddress(transaction.executor)
                ? getAddress(transaction.executor)
                : null,
            // @todo typing for `multiSigTransaction.transactionHash` is misleading, as ` multiSigTransaction.transactionHash` is not always defined (if ever). Need to tighten up the typing here.
            // ! @todo This is why we are showing the two different hashes
            transactionHash: transaction.transactionHash ?? transaction.safeTxHash,
            data: data,
            state: null,
            nonce: eventNonce,
          };
          return activity;
        }),
      );
      let freezeGuardData: FreezeGuardData | undefined;

      if (guardContracts.freezeGuardContractAddress) {
        const blockNumber = await publicClient.getBlockNumber();
        const averageBlockTime = BigInt(Math.round(await getAverageBlockTime(publicClient)));
        const freezeGuard = getContract({
          address: guardContracts.freezeGuardContractAddress,
          abi: abis.MultisigFreezeGuard,
          client: publicClient,
        });

        const [timelockPeriod, executionPeriod, block] = await Promise.all([
          freezeGuard.read.timelockPeriod(),
          freezeGuard.read.executionPeriod(),
          publicClient.getBlock({ blockNumber: blockNumber }),
        ]);

        freezeGuardData = {
          guardTimelockPeriodMs: BigInt(timelockPeriod) * BigInt(averageBlockTime) * 1000n,
          guardExecutionPeriodMs: BigInt(executionPeriod) * BigInt(averageBlockTime) * 1000n,
          lastBlockTimestamp: Number(block.timestamp),
        };
      }

      // todo: Some of these activities may be completed and can be cached
      const activitiesWithState = await getState(
        activities,
        guardContracts.freezeGuardContractAddress,
        freezeGuardData,
      );

      return activitiesWithState;
    },
    [decode, getState, guardContracts.freezeGuardContractAddress, publicClient],
  );
  return { parseTransactions };
};
