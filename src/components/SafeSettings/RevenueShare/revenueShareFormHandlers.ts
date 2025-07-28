import { SplitV2Client } from '@0xsplits/splits-sdk';
import { getSplitV2FactoryAddress } from '@0xsplits/splits-sdk/constants';
import { splitV2FactoryABI, splitV2ABI } from '@0xsplits/splits-sdk/constants/abi';
import { SplitV2Type } from '@0xsplits/splits-sdk/types';
import { legacy } from '@decentdao/decent-contracts';
import { Address, encodeFunctionData, getAddress, PublicClient } from 'viem';
import useNetworkPublicClient from '../../../hooks/useNetworkPublicClient';
import { useNetworkConfigStore } from '../../../providers/NetworkConfig/useNetworkConfigStore';
import {
  CreateProposalTransaction,
  CreateProposalActionData,
  ProposalActionType,
} from '../../../types';
import { RevenueSharingWallet, RevenueSharingWalletFormValues } from '../../../types/revShare';
import { SafeSettingsEdits } from '../../ui/modals/SafeSettingsModal';

const DEFAULT_SALT = '0x0000000000000000000000000000000000000000000000000000000000D3C3NT';
const DISTRIBUTION_INCENTIVE = 0;
const TOTAL_ALLOCATION_PERCENT = 100;
const TOTAL_ALLOCATION_PERCENT_BN = BigInt(TOTAL_ALLOCATION_PERCENT);

export const createCombinedSplitsWalletData = (
  formSplitWallets: RevenueSharingWalletFormValues[],
  deployedSplitWallets: RevenueSharingWallet[] | undefined,
) => {
  const maxLength = Math.max(formSplitWallets.length, deployedSplitWallets?.length || 0);

  const existingFormWallets: RevenueSharingWalletFormValues[] = Array.from(
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

  return existingFormWallets;
};

export const createFormatedSplitsWalletData = (
  formSplitWallets: RevenueSharingWalletFormValues[],
) => {
  return formSplitWallets.map(wallet => {
    if (!wallet.name || !wallet.address || !wallet.splits) {
      throw new Error('No name, address, or splits found');
    }
    return {
      name: wallet.name,
      address: getAddress(wallet.address),
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
  updatedValues: SafeSettingsEdits['revenueSharing'],
  existingWallets: RevenueSharingWallet[],
  splitsClient: SplitV2Client,
  multisendContractAddress: Address,
  publicClient: PublicClient,
  safeAddress: Address,
) => {
  if (!updatedValues) {
    throw new Error('Revenue sharing is not set');
  }

  const { existing: existingWalletFormUpdates, new: newWalletFormUpdates } = updatedValues;

  const transactions: CreateProposalTransaction[] = [];
  // address:name
  const newSplitAddressWithNames: string[] = [];
  let isNameUpdated = false;

  const validatedNewWalletFormUpdates = createFormatedSplitsWalletData(newWalletFormUpdates);
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

      const predictedNewSplitsWalletAddress = splitsClient.predictDeterministicAddress({
        recipients: recipientsData,
        distributorFeePercent: DISTRIBUTION_INCENTIVE,
        totalAllocationPercent: TOTAL_ALLOCATION_PERCENT,
        splitType: SplitV2Type.Push,
        ownerAddress: safeAddress,
        creatorAddress: safeAddress,
        salt: DEFAULT_SALT,
      });

      const recipients = splits.map(recipient => recipient.address);
      const allocations = splits.map(recipient => recipient.percentage);
      const createNewSplitsWalletData = {
        recipients,
        allocations,
        totalAllocation: BigInt(TOTAL_ALLOCATION_PERCENT),
        distributionIncentive: DISTRIBUTION_INCENTIVE,
      };

      const createNewSplitsWalletTransaction = encodeFunctionData({
        abi: splitV2FactoryABI,
        functionName: 'createSplitDeterministic',
        args: [createNewSplitsWalletData, safeAddress, safeAddress, DEFAULT_SALT],
      });

      newSplitAddressWithNames.push(`${predictedNewSplitsWalletAddress}:${name}`);

      const splitFactoryAddress = getSplitV2FactoryAddress(
        publicClient.chain!.id,
        SplitV2Type.Push,
      );
      const calldata = createNewSplitsWalletTransaction;

      // TODO: Add the new wallet to the key value pairs
    }
  }

  // for updating existing wallet splits
  if (existingWalletFormUpdates?.length > 0) {
    const updatedSplits = createCombinedSplitsWalletData(
      existingWalletFormUpdates,
      existingWallets,
    );
    isNameUpdated = updatedSplits.some(
      updatedSplit =>
        updatedSplit.name !==
        existingWallets?.find(existingWallet => existingWallet.address === updatedSplit.address)
          ?.name,
    );
    const formatedUpdatedSplits = createFormatedSplitsWalletData(updatedSplits);
    for (const updatedSplit of formatedUpdatedSplits) {
      if (!updatedSplit) {
        throw new Error('No original wallet data found');
      }

      // This would handle new splits and updated splits
      const totalAllocationPercent = updatedSplit.splits.reduce((total, recipient) => {
        return total + recipient.percentage;
      }, 0n);

      if (totalAllocationPercent !== TOTAL_ALLOCATION_PERCENT_BN) {
        throw new Error('Total allocation percent must be 100');
      }

      const recipients = updatedSplit.splits.map(split => getAddress(split.address));
      const allocations = updatedSplit.splits.map(split => BigInt(split.percentage));

      const createNewSplitsWalletData = {
        recipients,
        allocations,
        totalAllocation: BigInt(TOTAL_ALLOCATION_PERCENT),
        distributionIncentive: DISTRIBUTION_INCENTIVE,
      };

      const updateSplitRecipientData = encodeFunctionData({
        abi: splitV2ABI,
        functionName: 'updateSplit',
        args: [createNewSplitsWalletData],
      });

      const targetAddress = updatedSplit.address;
      const calldata = updateSplitRecipientData;
    }
  }

  // create keyValuePairsUpdate if needed, new wallets, updated names
  if (newSplitAddressWithNames.length > 0 || isNameUpdated) {
    const existingWalletAddressWithName = existingWallets.map(
      wallet => `${wallet.address}:${wallet.name}`,
    );

    // combines new wallets and existing wallets into one array
    const combinedWallets = [...existingWalletAddressWithName, ...newSplitAddressWithNames];
    const createKeyValuePairsUpdate = encodeFunctionData({
      abi: legacy.abis.KeyValuePairs,
      functionName: 'updateValues',
      args: [['revShareWallets'], [JSON.stringify(combinedWallets)]],
    });
  }

  // deploy new split -> create split, update keyvalue
  // update existing split -> update split, update keyvalue

  // update name -> update keyvalue
  const title = '';

  const action: CreateProposalActionData = {
    actionType: ProposalActionType.EDIT,
    transactions,
  };

  return { action, title };
};
