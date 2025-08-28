import { legacy } from '@decentdao/decent-contracts';
import { Address, encodeAbiParameters, encodeFunctionData, parseAbiParameters } from 'viem';
import {
  CreateProposalActionData,
  CreateProposalTransaction,
  FractalVotingStrategy,
  ProposalActionType,
} from '../../../types';
import {
  getPaymasterSaltNonce,
  getPaymasterAddress,
  getVoteSelectorAndValidator,
} from '../../../utils/gaslessVoting';
import { SafeSettingsEdits } from '../types';

// Extended interface for general handler with specific dependencies
export interface GeneralHandlerDependencies {
  t: (key: string, options?: { ns: string }) => string;
  safe: { address: Address } | null;
  governance: { paymasterAddress: Address | null };
  accountAbstraction:
    | {
        entryPointv07: Address;
        lightAccountFactory: Address;
      }
    | undefined;
  keyValuePairs: Address;
  ethValue: { bigintValue: bigint; value: string };
  zodiacModuleProxyFactory: Address;
  paymaster: {
    decentPaymasterV1MasterCopy: Address;
    linearERC20VotingV1ValidatorV1: Address;
    linearERC721VotingV1ValidatorV1: Address;
  };
  chainId: number;
  bundlerMinimumStake: bigint | undefined;
  paymasterDepositInfo: { stake?: bigint } | undefined;
  buildInstallVersionedVotingStrategies: () => Promise<{
    installVersionedStrategyCreateProposalTxs: CreateProposalTransaction[];
    newStrategies: Array<FractalVotingStrategy>;
  }>;
  strategies: Array<FractalVotingStrategy>;
}

export const handleEditGeneral = async (
  updatedValues: SafeSettingsEdits,
  deps: GeneralHandlerDependencies,
): Promise<{ action: CreateProposalActionData; title: string }> => {
  const {
    t,
    safe,
    governance,
    accountAbstraction,
    keyValuePairs,
    ethValue,
    zodiacModuleProxyFactory,
    paymaster,
    chainId,
    bundlerMinimumStake,
    paymasterDepositInfo,
    buildInstallVersionedVotingStrategies,
    strategies,
  } = deps;

  const changeTitles = [];
  const keyArgs: string[] = [];
  const valueArgs: string[] = [];

  const accountAbstractionSupported = bundlerMinimumStake !== undefined;
  const stakingRequired = accountAbstractionSupported && bundlerMinimumStake > 0n;
  const { paymasterAddress } = governance;

  const transactions: CreateProposalTransaction[] = [];

  if (updatedValues.general?.name) {
    changeTitles.push(t('updatesSafeName', { ns: 'proposalMetadata' }));
    keyArgs.push('daoName');
    valueArgs.push(updatedValues.general.name);
  }

  if (updatedValues.general?.snapshot !== undefined) {
    changeTitles.push(t('updateSnapshotSpace', { ns: 'proposalMetadata' }));
    keyArgs.push('snapshotENS');
    valueArgs.push(updatedValues.general.snapshot);
  }

  if (updatedValues.general?.sponsoredVoting !== undefined) {
    keyArgs.push('gaslessVotingEnabled');
    if (updatedValues.general.sponsoredVoting) {
      changeTitles.push(t('enableGaslessVoting', { ns: 'proposalMetadata' }));
      valueArgs.push('true');
    } else {
      changeTitles.push(t('disableGaslessVoting', { ns: 'proposalMetadata' }));
      valueArgs.push('false');
    }
  }

  const title = changeTitles.join(`; `);

  transactions.push({
    targetAddress: keyValuePairs,
    ethValue,
    functionName: 'updateValues',
    parameters: [
      {
        signature: 'string[]',
        valueArray: keyArgs,
      },
      {
        signature: 'string[]',
        valueArray: valueArgs,
      },
    ],
  });

  if (updatedValues.general?.sponsoredVoting !== undefined) {
    if (!safe?.address) {
      throw new Error('Safe address is not set');
    }

    if (!accountAbstraction) {
      throw new Error('Account Abstraction addresses are not set');
    }

    if (paymasterAddress === null) {
      // Paymaster does not exist, deploy a new one
      const paymasterInitData = encodeFunctionData({
        abi: legacy.abis.DecentPaymasterV1,
        functionName: 'initialize',
        args: [
          encodeAbiParameters(parseAbiParameters(['address', 'address', 'address']), [
            safe.address,
            accountAbstraction.entryPointv07,
            accountAbstraction.lightAccountFactory,
          ]),
        ],
      });

      transactions.push({
        targetAddress: zodiacModuleProxyFactory,
        ethValue,
        functionName: 'deployModule',
        parameters: [
          {
            signature: 'address',
            value: paymaster.decentPaymasterV1MasterCopy,
          },
          {
            signature: 'bytes',
            value: paymasterInitData,
          },
          {
            signature: 'uint256',
            value: getPaymasterSaltNonce(safe.address, chainId).toString(),
          },
        ],
      });
    }

    // Include txs to disable any old voting strategies and enable the new ones.
    const { installVersionedStrategyCreateProposalTxs, newStrategies } =
      await buildInstallVersionedVotingStrategies();

    transactions.push(...installVersionedStrategyCreateProposalTxs);

    const predictedPaymasterAddress = getPaymasterAddress({
      safeAddress: safe.address,
      zodiacModuleProxyFactory,
      paymasterMastercopy: paymaster.decentPaymasterV1MasterCopy,
      entryPoint: accountAbstraction.entryPointv07,
      lightAccountFactory: accountAbstraction.lightAccountFactory,
      chainId,
    });

    // Add stake for Paymaster if not enough
    if (stakingRequired) {
      const stakedAmount = paymasterDepositInfo?.stake || 0n;

      if (paymasterAddress === null || stakedAmount < bundlerMinimumStake) {
        const delta = bundlerMinimumStake - stakedAmount;

        transactions.push({
          targetAddress: predictedPaymasterAddress,
          ethValue: {
            bigintValue: delta,
            value: delta.toString(),
          },
          functionName: 'addStake',
          parameters: [
            {
              signature: 'uint32',
              // one day in seconds, defined on https://github.com/alchemyplatform/rundler/blob/c17fd3dbc24d2af93fd68310031d445d5440794f/crates/sim/src/simulation/mod.rs#L170
              value: 86400n.toString(),
            },
          ],
        });
      }
    }

    newStrategies.forEach(strategy => {
      // Whitelist the new strategy's `vote` function call on the Paymaster
      // // // // // // // // // // // // // // // // // // // // // // //
      const { voteSelector, voteValidator } = getVoteSelectorAndValidator(strategy.type, paymaster);

      transactions.push({
        targetAddress: predictedPaymasterAddress,
        ethValue,
        functionName: 'setFunctionValidator',
        parameters: [
          {
            signature: 'address',
            value: strategy.address,
          },
          {
            signature: 'bytes4',
            value: voteSelector,
          },
          {
            signature: 'address',
            value: voteValidator,
          },
        ],
      });
    });

    // Also whitelist existing versioned strategies that have not already been whitelisted.
    // This will be the case for DAOs deployed after this feature, but did not enable gasless voting on creation.
    if (paymasterAddress === null) {
      strategies
        .filter(strategy => strategy.version !== undefined)
        .forEach(strategy => {
          const { voteSelector, voteValidator } = getVoteSelectorAndValidator(
            strategy.type,
            paymaster,
          );

          transactions.push({
            targetAddress: predictedPaymasterAddress,
            ethValue,
            functionName: 'setFunctionValidator',
            parameters: [
              {
                signature: 'address',
                value: strategy.address,
              },
              {
                signature: 'bytes4',
                value: voteSelector,
              },
              {
                signature: 'address',
                value: voteValidator,
              },
            ],
          });
        });
    }
  }

  const action: CreateProposalActionData = {
    actionType: ProposalActionType.EDIT,
    transactions,
  };

  return { action, title };
};
