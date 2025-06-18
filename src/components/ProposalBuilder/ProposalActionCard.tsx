import { Button, Flex, Icon, IconButton, Text } from '@chakra-ui/react';
import { ArrowsDownUp, CheckSquare, CraneTower, Trash } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { formatUnits, getAddress, isAddress } from 'viem';
import PencilWithLineIcon from '../../assets/theme/custom/icons/PencilWithLineIcon';
import { useCurrentDAOKey } from '../../hooks/DAO/useCurrentDAOKey';
import { createAccountSubstring } from '../../hooks/utils/useGetAccountName';
import { useDAOStore } from '../../providers/App/AppProvider';
import { CreateProposalAction, ProposalActionType } from '../../types/proposalBuilder';
import { Card } from '../ui/cards/Card';
import { DappInteractionActionCard } from '../ui/cards/DappInteractionActionCard';
import { SendAssetsActionCard } from '../ui/cards/SendAssetsActionCard';

function SendAssetsAction({
  action,
  onRemove,
}: {
  action: CreateProposalAction;
  onRemove: () => void;
}) {
  const { daoKey } = useCurrentDAOKey();
  const {
    treasury: { assetsFungible },
  } = useDAOStore({ daoKey });

  const isNativeAssetTransfer = action.actionType === ProposalActionType.NATIVE_TRANSFER;

  // If the transfer is a native asset transfer, `targetAddress` is the recipient address, and `parameters` is an empty array.
  // Otherwise, the first parameter to the call to `transfer` is the recipient address.
  const recipientAddress = isNativeAssetTransfer
    ? action.transactions[0].targetAddress
    : action.transactions[0].parameters[0].value;

  if (!recipientAddress || !isAddress(recipientAddress)) {
    console.error('Send assets action is invalid without a valid recipient address', action);
    return null;
  }

  // Amount to transfer is either `ethValue` for native asset transfers, or the second parameter to the `transfer` function call for ERC20 transfers
  let transferAmount: bigint;
  if (isNativeAssetTransfer && action.transactions[0].ethValue.bigintValue !== undefined) {
    transferAmount = action.transactions[0].ethValue.bigintValue;
  } else if (action.transactions[0].parameters[1].value !== undefined) {
    transferAmount = BigInt(action.transactions[0].parameters[1].value);
  } else {
    console.error('Send assets action is invalid without an amount to transfer', action);
    return null;
  }

  // The asset to transfer is either the native asset, or the asset with the target address
  const asset = assetsFungible.find(a =>
    isNativeAssetTransfer
      ? a.nativeToken
      : a.tokenAddress === getAddress(action.transactions[0].targetAddress),
  );

  if (!asset) {
    console.error('Asset to transfer not found', { asset, assetsFungible });
    return null;
  }

  return (
    <SendAssetsActionCard
      action={{
        recipientAddress,
        transferAmount,
        asset,
      }}
      onRemove={onRemove}
    />
  );
}

export function AirdropAction({
  action,
  onRemove,
}: {
  action: CreateProposalAction;
  onRemove: () => void;
}) {
  const { t } = useTranslation('common');
  const { daoKey } = useCurrentDAOKey();
  const {
    treasury: { assetsFungible },
  } = useDAOStore({ daoKey });

  const approveTransaction = action.transactions.find(txn => txn.functionName === 'approve');
  const disperseTransaction = action.transactions.find(txn => txn.functionName === 'disperseToken');
  if (!approveTransaction || !disperseTransaction) {
    return null;
  }

  const totalAmountString = disperseTransaction.parameters[2].value?.slice(1, -1);
  const totalAmount = BigInt(
    totalAmountString?.split(',').reduce((acc, curr) => acc + BigInt(curr), 0n) || '0',
  );
  const recipientsCount = disperseTransaction.parameters[1].value?.split(',').length || 0;
  const actionAsset = assetsFungible.find(
    asset => asset.tokenAddress === getAddress(approveTransaction.targetAddress),
  );

  if (!actionAsset) {
    return null;
  }
  return (
    <Card my="0.5rem">
      <Flex justifyContent="space-between">
        <Flex
          alignItems="center"
          gap="0.5rem"
        >
          <Icon
            as={ArrowsDownUp}
            w="1.5rem"
            h="1.5rem"
            color="color-lilac-100"
          />
          <Text>{t('airdrop')}</Text>
          <Text color="color-lilac-100">
            {formatUnits(totalAmount, actionAsset.decimals)} {actionAsset.symbol}
          </Text>
          <Text>{t('to').toLowerCase()}</Text>
          <Text color="color-lilac-100">
            {recipientsCount} {t('recipients', { count: recipientsCount })}
          </Text>
        </Flex>
        <Button
          color="color-error-500"
          variant="tertiary"
          size="sm"
          onClick={onRemove}
        >
          <Icon as={Trash} />
        </Button>
      </Flex>
    </Card>
  );
}
export function TransactionBuilderAction({
  action,
  onRemove,
}: {
  action: CreateProposalAction;
  onRemove: () => void;
}) {
  const { t } = useTranslation('actions');

  return (
    <Card my="0.5rem">
      <Flex justifyContent="space-between">
        <Flex
          alignItems="center"
          gap="0.5rem"
        >
          <Icon
            as={CraneTower}
            w="1.5rem"
            h="1.5rem"
            color="color-lilac-100"
          />
          <Text>
            {action.transactions.length === 1
              ? t('transactionBuilderActionCard_single', {
                  functionName: action.transactions[0].functionName,
                  targetAddress: createAccountSubstring(action.transactions[0].targetAddress),
                })
              : t('transactionBuilderActionCard_multiple', {
                  numOfTransactions: action.transactions.length,
                })}
          </Text>
        </Flex>
        <Button
          color="color-error-500"
          variant="tertiary"
          size="sm"
          onClick={onRemove}
        >
          <Icon as={Trash} />
        </Button>
      </Flex>
    </Card>
  );
}

export function ProposalActionCard({
  action,
  removeAction,
  index,
}: {
  action: CreateProposalAction;
  removeAction: (index: number) => void;
  index: number;
}) {
  if (
    action.actionType === ProposalActionType.TRANSFER ||
    action.actionType === ProposalActionType.NATIVE_TRANSFER
  ) {
    return (
      <SendAssetsAction
        action={action}
        onRemove={() => removeAction(index)}
      />
    );
  } else if (action.actionType === ProposalActionType.AIRDROP) {
    return (
      <AirdropAction
        action={action}
        onRemove={() => removeAction(index)}
      />
    );
  } else if (action.actionType === ProposalActionType.DAPP_INTEGRATION) {
    return (
      <DappInteractionActionCard
        action={action}
        onRemove={() => removeAction(index)}
      />
    );
  } else if (action.actionType === ProposalActionType.TRANSACTION_BUILDER) {
    return (
      <TransactionBuilderAction
        action={action}
        onRemove={() => removeAction(index)}
      />
    );
  }

  const isAddAction = action.actionType === ProposalActionType.ADD;
  const isEditAction = action.actionType === ProposalActionType.EDIT;
  const isDeleteAction = action.actionType === ProposalActionType.DELETE;

  return (
    <Flex
      gap={4}
      alignItems="center"
    >
      <Card
        backgroundColor={
          isAddAction || isEditAction
            ? 'color-neutral-950'
            : isDeleteAction
              ? 'color-error-900'
              : 'color-neutral-900'
        }
      >
        <Flex
          gap={2}
          alignItems="center"
        >
          <Icon
            as={
              isAddAction
                ? CheckSquare
                : isEditAction
                  ? PencilWithLineIcon
                  : isDeleteAction
                    ? Trash
                    : CheckSquare
            }
            color={
              isEditAction || isAddAction
                ? 'color-neutral-300'
                : isDeleteAction
                  ? 'color-error-400'
                  : 'color-neutral-300'
            }
          />
          {action.content}
        </Flex>
      </Card>
      <IconButton
        aria-label="Remove action"
        icon={<Trash />}
        variant="ghost"
        size="icon-sm"
        color="color-error-400"
        onClick={() => removeAction(index)}
      />
    </Flex>
  );
}
