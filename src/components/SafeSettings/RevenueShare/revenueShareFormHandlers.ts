import { getSplitV2FactoryAddress } from '@0xsplits/splits-sdk/constants';
import { splitV2ABI, splitV2FactoryABI } from '@0xsplits/splits-sdk/constants/abi';
import { SplitV2Type } from '@0xsplits/splits-sdk/types';
import { legacy } from '@decentdao/decent-contracts';
import { Address, encodeFunctionData, getAddress, PublicClient } from 'viem';
import { CreateProposalTransaction, ProposalActionType } from '../../../types';
import { RevenueSharingWallet, RevenueSharingWalletFormValues } from '../../../types/revShare';
import { bigintSerializer } from '../../../utils/bigintSerializer';
import { SafeSettingsEdits } from '../../ui/modals/SafeSettingsModal';
import { predictSplitContractAddress } from './prediction';

const DETERMINISTIC_SALT = '0x0000000000000000000000000000000000000000000000000000444543454E54';
const DISTRIBUTION_INCENTIVE = 0;
/**
 * Splits contracts express percentages in parts‑per‑million (PPM):
 * 100.0000 % === 1_000_000 units.
 */
const TOTAL_ALLOCATION_PERCENT = 1_000_000; // 100.0000 % scaled for Splits
const TOTAL_ALLOCATION_PERCENT_BN = BigInt(TOTAL_ALLOCATION_PERCENT);
const DEFAULT_ETH_VALUE = {
  bigintValue: 0n,
  value: '0',
};

export const PERCENT_SCALE = 10_000n;

/** Whole-number percent (0-100) ➜ PPM bigint */
export function percentToPpm(percent: bigint | number | string): bigint {
  const v = BigInt(percent);
  if (v < 0n || v > 100n) throw new Error('Percent must be between 0 and 100');
  return v * PERCENT_SCALE; // 12  → 120 000n
}

/** PPM bigint ➜ whole-number percent (0-100) as number */
export function ppmToPercent(ppm: bigint | number | string): number {
  const v = BigInt(ppm);
  if (v % PERCENT_SCALE !== 0n) throw new Error('PPM value is not a whole percent');
  return Number(v / PERCENT_SCALE); // 120 000n → 12
}

/**
 * Merges form data with deployed data; form data takes precedence
 */
export const mergeSplitWalletFormData = (
  formSplitWallets: RevenueSharingWalletFormValues[],
  deployedSplitWallets: RevenueSharingWallet[] | undefined,
) => {
  const maxLength = Math.max(formSplitWallets.length, deployedSplitWallets?.length || 0);

  const reconciledWallets: RevenueSharingWalletFormValues[] = Array.from(
    { length: maxLength },
    (_, walletIndex) => {
      const existingWalletData = deployedSplitWallets?.[walletIndex];
      const formWalletData = formSplitWallets?.[walletIndex];

      const splitsLength = existingWalletData?.splits?.length || 0;
      const newSplitsLength = formWalletData?.splits?.length || 0;
      const maxSplitsLength = Math.max(splitsLength, newSplitsLength);

      return {
        name: formWalletData?.name ?? existingWalletData?.name,
        address: formWalletData?.address ?? existingWalletData?.address,
        splits: Array.from({ length: maxSplitsLength }, (__, splitIndex) => {
          const existingSplitData = existingWalletData?.splits?.[splitIndex];
          const existingSplitFormData = formWalletData?.splits?.[splitIndex];
          return {
            address: existingSplitFormData?.address ?? existingSplitData?.address,
            percentage:
              existingSplitFormData?.percentage ?? existingSplitData?.percentage.toString(),
          };
        }),
      };
    },
  );

  return reconciledWallets;
};

/**
 * Merges special splits updates into the form wallets
 */
const mergeSpecialSplitsIntoWallet = (
  wallets: RevenueSharingWalletFormValues[] | undefined,
  daoAddress: Address,
  parentDaoAddress: Address | undefined | null,
  stakingContractAddress: Address | undefined,
) => {
  if (!wallets) {
    return [];
  }
  return wallets.map(wallet => {
    const { specialSplits, splits } = wallet;
    const mergedSplits = [...(splits || [])];
    const daoSplitIndex = mergedSplits.findIndex(split => split.address === daoAddress);
    const parentDaoSplitIndex = mergedSplits.findIndex(
      split => !!parentDaoAddress && split.address === parentDaoAddress,
    );
    const stakeHoldersSplitIndex = mergedSplits.findIndex(
      split => !!stakingContractAddress && split.address === stakingContractAddress,
    );

    if (daoSplitIndex === -1 && !!daoAddress && specialSplits?.dao?.percentage !== undefined) {
      mergedSplits.push({
        address: daoAddress,
        percentage: specialSplits.dao.percentage,
      });
    } else if (!!daoAddress && specialSplits?.dao?.percentage !== undefined) {
      mergedSplits[daoSplitIndex] = {
        address: daoAddress,
        percentage: specialSplits.dao.percentage,
      };
    }

    if (
      parentDaoSplitIndex === -1 &&
      !!parentDaoAddress &&
      specialSplits?.parentDao?.percentage !== undefined
    ) {
      mergedSplits.push({
        address: parentDaoAddress,
        percentage: specialSplits.parentDao.percentage,
      });
    } else if (!!parentDaoAddress && specialSplits?.parentDao?.percentage !== undefined) {
      mergedSplits[parentDaoSplitIndex] = {
        address: parentDaoAddress,
        percentage: specialSplits.parentDao.percentage,
      };
    }

    if (
      stakeHoldersSplitIndex === -1 &&
      !!stakingContractAddress &&
      specialSplits?.stakingContract?.percentage !== undefined
    ) {
      mergedSplits.push({
        address: stakingContractAddress,
        percentage: specialSplits.stakingContract.percentage,
      });
    } else if (
      !!stakingContractAddress &&
      specialSplits?.stakingContract?.percentage !== undefined
    ) {
      mergedSplits[stakeHoldersSplitIndex] = {
        address: stakingContractAddress,
        percentage: specialSplits.stakingContract.percentage,
      };
    }

    return {
      ...wallet,
      splits: mergedSplits,
    };
  });
};

export const validateAndFormatSplitWallets = (
  formSplitWallets: RevenueSharingWalletFormValues[],
) => {
  return formSplitWallets.map(wallet => {
    if (!wallet.name || wallet.splits === undefined || wallet.splits.length === 0) {
      throw new Error('No name or splits found');
    }

    return {
      name: wallet.name,
      address: wallet.address ? getAddress(wallet.address) : undefined,
      splits: wallet.splits.map(split => {
        if (!split.address || split.percentage === undefined) {
          throw new Error('No splitaddress or percentage found');
        }

        return {
          address: getAddress(split.address),
          percentage: percentToPpm(split.percentage),
        };
      }),
    };
  });
};

export const handleEditRevenueShare = async ({
  daoAddress,
  parentDaoAddress,
  stakingContractAddress,
  keyValuePairsAddress,
  updatedValues,
  existingWallets,
  publicClient,
}: {
  daoAddress: Address;
  parentDaoAddress: Address | undefined | null;
  stakingContractAddress: Address | undefined;
  keyValuePairsAddress: Address;
  updatedValues: SafeSettingsEdits['revenueSharing'];
  existingWallets: RevenueSharingWallet[];
  publicClient: PublicClient;
}) => {
  if (!updatedValues) {
    throw new Error('Revenue sharing is not set');
  }

  const { existing: existingFormValues, new: newFormValues } = updatedValues;

  const transactions: CreateProposalTransaction[] = [];

  // address:name
  const newWalletAddressNamePairs: string[] = [];
  let isNameUpdated = false;

  const mergedNewFormValues = mergeSpecialSplitsIntoWallet(
    newFormValues,
    daoAddress,
    parentDaoAddress,
    stakingContractAddress,
  );

  const validatedNewWalletFormUpdates = validateAndFormatSplitWallets(mergedNewFormValues);
  if (validatedNewWalletFormUpdates && validatedNewWalletFormUpdates.length > 0) {
    for (const newWalletFormUpdate of validatedNewWalletFormUpdates) {
      const { name, splits } = newWalletFormUpdate;

      const totalAllocationPercent = splits.reduce((total, recipient) => {
        return total + recipient.percentage;
      }, 0n);

      if (totalAllocationPercent !== TOTAL_ALLOCATION_PERCENT_BN) {
        throw new Error('Total allocation percent must be 100');
      }

      const recipients = splits.map(recipient => recipient.address);
      const allocations = splits.map(recipient => recipient.percentage);

      const splitFactoryAddress = getSplitV2FactoryAddress(
        publicClient.chain!.id,
        SplitV2Type.Push,
      );
      const splitWalletImplementation = await publicClient.readContract({
        address: splitFactoryAddress,
        abi: splitV2FactoryABI,
        functionName: 'SPLIT_WALLET_IMPLEMENTATION',
      });

      const predictedNewSplitsWalletAddress = predictSplitContractAddress({
        splitParams: {
          recipients: recipients,
          allocations: allocations,
          totalAllocation: BigInt(TOTAL_ALLOCATION_PERCENT),
          distributionIncentive: DISTRIBUTION_INCENTIVE,
        },
        owner: daoAddress,
        deployer: splitFactoryAddress,
        salt: DETERMINISTIC_SALT,
        splitWalletImplementation: splitWalletImplementation,
      });

      const createSplitCalldata = encodeFunctionData({
        abi: splitV2FactoryABI,
        functionName: 'createSplitDeterministic',
        args: [
          {
            recipients: recipients,
            allocations: allocations,
            totalAllocation: totalAllocationPercent,
            distributionIncentive: DISTRIBUTION_INCENTIVE,
          },
          daoAddress,
          daoAddress,
          DETERMINISTIC_SALT,
        ],
      });

      transactions.push({
        targetAddress: splitFactoryAddress,
        functionName: 'createSplitDeterministic',
        ethValue: DEFAULT_ETH_VALUE,
        calldata: createSplitCalldata,
        // parameters are passed for display purposes
        parameters: [
          {
            signature: '{address[], uint256[], uint256, uint256}',
            value: JSON.stringify(
              {
                recipients,
                allocations,
                totalAllocation: totalAllocationPercent,
                distributionIncentive: DISTRIBUTION_INCENTIVE,
              },
              bigintSerializer,
            ),
          },
          {
            signature: 'address',
            value: daoAddress,
          },
          {
            signature: 'address',
            value: daoAddress,
          },
          {
            signature: 'string',
            value: DETERMINISTIC_SALT,
          },
        ],
      });

      newWalletAddressNamePairs.push(`${predictedNewSplitsWalletAddress}:${name}`);
    }
  }

  const mergedExistingFormValues = mergeSpecialSplitsIntoWallet(
    existingFormValues,
    daoAddress,
    parentDaoAddress,
    stakingContractAddress,
  );
  const mergedExistingWallets = mergeSplitWalletFormData(mergedExistingFormValues, existingWallets);
  const validatedExistingWalletFormUpdates = validateAndFormatSplitWallets(mergedExistingWallets);

  // for updating existing wallet splits
  if (validatedExistingWalletFormUpdates?.length > 0) {
    isNameUpdated = validatedExistingWalletFormUpdates.some(
      updatedSplit =>
        updatedSplit.name !==
        existingWallets?.find(existingWallet => existingWallet.address === updatedSplit.address)
          ?.name,
    );
    for (const updatedSplit of validatedExistingWalletFormUpdates) {
      if (!updatedSplit) {
        throw new Error('No original wallet data found');
      }
      if (!updatedSplit.address) {
        throw new Error('No address found');
      }

      // This would handle new splits and updated splits
      const totalAllocationPercent = updatedSplit.splits.reduce((total, recipient) => {
        return total + recipient.percentage;
      }, 0n);

      if (totalAllocationPercent !== TOTAL_ALLOCATION_PERCENT_BN) {
        throw new Error('Total allocation percent must be 100');
      }

      const recipients = updatedSplit.splits.map(split => getAddress(split.address));
      const allocations = updatedSplit.splits.map(split => split.percentage);

      const updateSplitCalldata = encodeFunctionData({
        abi: splitV2ABI,
        functionName: 'updateSplit',
        args: [
          {
            recipients: recipients,
            allocations: allocations,
            totalAllocation: totalAllocationPercent,
            distributionIncentive: DISTRIBUTION_INCENTIVE,
          },
        ],
      });

      transactions.push({
        targetAddress: updatedSplit.address,
        functionName: 'updateSplit',
        calldata: updateSplitCalldata,
        ethValue: DEFAULT_ETH_VALUE,
        // parameters are passed for display purposes
        parameters: [
          {
            signature: '{address[], uint256[], uint256, uint256}',
            value: JSON.stringify(
              {
                recipients,
                allocations,
                totalAllocation: totalAllocationPercent,
                distributionIncentive: DISTRIBUTION_INCENTIVE,
              },
              bigintSerializer,
            ),
          },
        ],
      });
    }
  }

  // create keyValuePairsUpdate if needed, new wallets, updated names
  if (newWalletAddressNamePairs.length > 0 || isNameUpdated) {
    const existingWalletAddressNamePairs = validatedNewWalletFormUpdates.map(
      wallet => `${wallet.address}:${wallet.name}`,
    );

    // combines new wallets and existing wallets into one array
    const allWalletAddressNamePairs = [
      ...existingWalletAddressNamePairs,
      ...newWalletAddressNamePairs,
    ];

    const updateRevenueShareMetadataCalldata = encodeFunctionData({
      abi: legacy.abis.KeyValuePairs,
      functionName: 'updateValues',
      args: [['revShareWallets'], [JSON.stringify(allWalletAddressNamePairs)]],
    });

    transactions.push({
      targetAddress: keyValuePairsAddress,
      functionName: 'updateValues',
      calldata: updateRevenueShareMetadataCalldata,
      ethValue: DEFAULT_ETH_VALUE,
      // parameters are passed for display purposes
      parameters: [
        {
          signature: 'string[]',
          valueArray: ['revShareWallets'],
        },
        {
          signature: 'string[]',
          valueArray: [JSON.stringify(allWalletAddressNamePairs)],
        },
      ],
    });
  }

  return {
    // todo make this dynamic
    actionType: ProposalActionType.UPDATE_REVENUE_SHARE_SPLITS,
    title: 'Update Revenue Share Splits',
    transactions,
  };
};
