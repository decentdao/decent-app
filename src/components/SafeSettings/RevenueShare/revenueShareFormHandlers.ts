import { SplitV2Client } from '@0xsplits/splits-sdk';
import { getSplitV2FactoryAddress } from '@0xsplits/splits-sdk/constants';
import { SplitV2Type } from '@0xsplits/splits-sdk/types';
import { Address, getAddress, PublicClient } from 'viem';
import useNetworkPublicClient from '../../../hooks/useNetworkPublicClient';
import { useNetworkConfigStore } from '../../../providers/NetworkConfig/useNetworkConfigStore';
import {
  CreateProposalTransaction,
  CreateProposalActionData,
  ProposalActionType,
} from '../../../types';
import { RevenueSharingWallet, RevenueSharingWalletFormValues } from '../../../types/revShare';
import { SafeSettingsEdits } from '../../ui/modals/SafeSettingsModal';

const DETERMINISTIC_SALT = '0x0000000000000000000000000000000000000000000000000000444543454E54';
const DISTRIBUTION_INCENTIVE = 0;
const TOTAL_ALLOCATION_PERCENT = 100;
const TOTAL_ALLOCATION_PERCENT_BN = BigInt(TOTAL_ALLOCATION_PERCENT);
const DEFAULT_ETH_VALUE = {
  bigintValue: 0n,
  value: '0',
};

export const mergeSplitWalletFormData = (
  formSplitWallets: RevenueSharingWalletFormValues[],
  deployedSplitWallets: RevenueSharingWallet[] | undefined,
) => {
  const maxLength = Math.max(formSplitWallets.length, deployedSplitWallets?.length || 0);

  const reconciledWallets: RevenueSharingWalletFormValues[] = Array.from(
    { length: maxLength },
    (_, walletIndex) => {
      const existingWalletData = deployedSplitWallets?.[walletIndex];
      const existingWalletFormData = formSplitWallets?.[walletIndex];

      const splitsLength = existingWalletData?.splits?.length || 0;
      const newSplitsLength = existingWalletFormData?.splits?.length || 0;
      const maxSplitsLength = Math.max(splitsLength, newSplitsLength);

      return {
        name: existingWalletFormData?.name || existingWalletData?.name,
        address: existingWalletFormData?.address || existingWalletData?.address,
        splits: Array.from({ length: maxSplitsLength }, (__, splitIndex) => {
          const existingSplitData = existingWalletData?.splits?.[splitIndex];
          const existingSplitFormData = existingWalletFormData?.splits?.[splitIndex];
          return {
            address: existingSplitFormData?.address || existingSplitData?.address,
            percentage:
              existingSplitFormData?.percentage || existingSplitData?.percentage.toString(),
          };
        }),
      };
    },
  );

  return reconciledWallets;
};

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
    if (!wallet.name || !wallet.splits) {
      throw new Error('No name, address, or splits found');
    }

    return {
      name: wallet.name,
      address: wallet.address ? getAddress(wallet.address) : undefined,
      splits: wallet.splits.map(split => {
        if (!split.address || !split.percentage) {
          throw new Error('No address or percentage found');
        }
        return {
          address: getAddress(split.address),
          percentage: BigInt(split.percentage),
        };
      }),
    };
  });
};

export const useCreateSplitsClient = () => {
  const {
    chain: { id: chainId },
  } = useNetworkConfigStore();
  const publicClient = useNetworkPublicClient();
  const splitsClient = new SplitV2Client({
    chainId,
    publicClient,
    includeEnsNames: false,
    apiConfig: {
      apiKey: '', // You can create an API key by signing up on our app, and accessing your account settings at app.splits.org/settings.
    }, // Splits GraphQL API key config, this is required for the data client to access the splits graphQL API.
  });

  return splitsClient;
};

export const handleEditRevenueShare = async (
  daoAddress: Address,
  parentDaoAddress: Address | undefined | null,
  stakingContractAddress: Address | undefined,
  updatedValues: SafeSettingsEdits['revenueSharing'],
  existingWallets: RevenueSharingWallet[],
  splitsClient: SplitV2Client,
  publicClient: PublicClient,
) => {
  if (!updatedValues) {
    throw new Error('Revenue sharing is not set');
  }

  const { existing: existingFormUpdates, new: newFormUpdates } = updatedValues;
  const existingWalletFormUpdates = mergeSpecialSplitsIntoWallet(
    existingFormUpdates,
    daoAddress,
    parentDaoAddress,
    stakingContractAddress,
  );
  const newWalletFormUpdates = mergeSpecialSplitsIntoWallet(
    newFormUpdates,
    daoAddress,
    parentDaoAddress,
    stakingContractAddress,
  );

  const transactionsCreate: CreateProposalTransaction[] = [];
  const transactionsUpdate: CreateProposalTransaction[] = [];

  // address:name
  const newWalletAddressNamePairs: string[] = [];
  let isNameUpdated = false;

  const validatedNewWalletFormUpdates = validateAndFormatSplitWallets(newWalletFormUpdates);
  if (newWalletFormUpdates && newWalletFormUpdates.length > 0) {
    for (const newWalletFormUpdate of validatedNewWalletFormUpdates) {
      const { name, splits } = newWalletFormUpdate;

      const totalAllocationPercent = splits.reduce((total, recipient) => {
        return total + recipient.percentage;
      }, 0n);

      if (totalAllocationPercent !== TOTAL_ALLOCATION_PERCENT_BN) {
        throw new Error('Total allocation percent must be 100');
      }
      const recipientsData = splits.map(split => {
        return {
          address: split.address,
          percentAllocation: Number(split.percentage),
        };
      });

      const predictedNewSplitsWalletAddress = await splitsClient.predictDeterministicAddress({
        recipients: recipientsData,
        distributorFeePercent: DISTRIBUTION_INCENTIVE,
        totalAllocationPercent: TOTAL_ALLOCATION_PERCENT,
        splitType: SplitV2Type.Push,
        ownerAddress: daoAddress,
        creatorAddress: daoAddress,
        salt: DETERMINISTIC_SALT,
      });

      const recipients = splits.map(recipient => recipient.address);
      const allocations = splits.map(recipient => recipient.percentage.toString());
      const createNewSplitsWalletData = {
        recipients,
        allocations,
        totalAllocation: TOTAL_ALLOCATION_PERCENT,
        distributionIncentive: DISTRIBUTION_INCENTIVE,
      };

      const splitFactoryAddress = getSplitV2FactoryAddress(
        publicClient.chain!.id,
        SplitV2Type.Push,
      );

      transactionsCreate.push({
        targetAddress: splitFactoryAddress,
        functionName: 'createSplitDeterministic',
        ethValue: DEFAULT_ETH_VALUE,
        operation: 1,
        parameters: [
          {
            signature: '{address[], uint256[], uint256, uint256}',
            value: JSON.stringify(createNewSplitsWalletData),
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

  // for updating existing wallet splits
  if (existingWalletFormUpdates?.length > 0) {
    const updatedSplits = mergeSplitWalletFormData(existingWalletFormUpdates, existingWallets);
    isNameUpdated = updatedSplits.some(
      updatedSplit =>
        updatedSplit.name !==
        existingWallets?.find(existingWallet => existingWallet.address === updatedSplit.address)
          ?.name,
    );
    const formattedUpdatedSplits = validateAndFormatSplitWallets(updatedSplits);
    for (const updatedSplit of formattedUpdatedSplits) {
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
      const allocations = updatedSplit.splits.map(split => split.percentage.toString());

      const createNewSplitsWalletData = {
        recipients,
        allocations,
        totalAllocation: BigInt(TOTAL_ALLOCATION_PERCENT),
        distributionIncentive: DISTRIBUTION_INCENTIVE,
      };

      transactionsUpdate.push({
        targetAddress: updatedSplit.address,
        functionName: 'updateSplit',
        ethValue: DEFAULT_ETH_VALUE,
        parameters: [
          {
            signature: '{address[], uint256[], uint256, uint256}',
            value: JSON.stringify(createNewSplitsWalletData),
          },
        ],
      });
    }
  }

  const actions: CreateProposalActionData[] = [];

  if (transactionsCreate.length > 0) {
    for (const transaction of transactionsCreate) {
      actions.push({
        actionType: ProposalActionType.CREATE_REVENUE_SHARE_WALLET,
        transactions: [transaction],
      });
    }
  }

  if (transactionsUpdate.length > 0) {
    for (const transaction of transactionsUpdate) {
      actions.push({
        actionType: ProposalActionType.UPDATE_REVENUE_SHARE_SPLITS,
        transactions: [transaction],
      });
    }
  }

  // create keyValuePairsUpdate if needed, new wallets, updated names
  if (newWalletAddressNamePairs.length > 0 || isNameUpdated) {
    const existingWalletAddressNamePairs = existingWallets.map(
      wallet => `${wallet.address}:${wallet.name}`,
    );

    // combines new wallets and existing wallets into one array
    const allWalletAddressNamePairs = [
      ...existingWalletAddressNamePairs,
      ...newWalletAddressNamePairs,
    ];
    actions.push({
      actionType: ProposalActionType.UPDATE_REVENUE_SHARE_WALLET_METADATA,
      transactions: [
        {
          targetAddress: daoAddress,
          functionName: 'updateValues',
          ethValue: DEFAULT_ETH_VALUE,
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
        },
      ],
    });
  }

  return actions;
};
