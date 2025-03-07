import { Button, Flex, Icon, IconButton, Text } from '@chakra-ui/react';
import { ArrowsDownUp, CheckSquare, Trash } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { formatUnits, getAddress, isAddress } from 'viem';
import PencilWithLineIcon from '../../assets/theme/custom/icons/PencilWithLineIcon';
import { useFractal } from '../../providers/App/AppProvider';
import { useProposalActionsStore } from '../../store/actions/useProposalActionsStore';
import { CreateProposalAction, ProposalActionType } from '../../types/proposalBuilder';
import { Card } from '../ui/cards/Card';
import { SendAssetsActionCard } from '../ui/cards/SendAssetsActionCard';

function SendAssetsAction({
  action,
  onRemove,
}: {
  action: CreateProposalAction;
  onRemove: () => void;
}) {
  const {
    treasury: { assetsFungible },
  } = useFractal();

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
        nonceInput: undefined,
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
  const {
    treasury: { assetsFungible },
  } = useFractal();
  const totalAmountString = action.transactions[1].parameters[2].value?.slice(1, -1);
  const totalAmount = BigInt(
    totalAmountString?.split(',').reduce((acc, curr) => acc + BigInt(curr), 0n) || '0',
  );
  const recipientsCount = action.transactions[1].parameters[1].value?.split(',').length || 0;

  // First transaction in the airdrop proposal will be approval transaction, which is called on the token
  // Thus we can find the asset by looking at the target address of the first transaction

  const actionAsset = assetsFungible.find(
    asset => asset.tokenAddress === getAddress(action.transactions[0].targetAddress),
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
            color="lilac-0"
          />
          <Text>{t('airdrop')}</Text>
          <Text color="lilac-0">
            {formatUnits(totalAmount, actionAsset.decimals)} {actionAsset.symbol}
          </Text>
          <Text>{t('to').toLowerCase()}</Text>
          <Text color="lilac-0">
            {recipientsCount} {t('recipients', { count: recipientsCount })}
          </Text>
        </Flex>
        <Button
          color="red-0"
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
  index,
  canBeDeleted,
}: {
  action: CreateProposalAction;
  index: number;
  canBeDeleted: boolean;
}) {
  const { removeAction } = useProposalActionsStore();
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
          isAddAction || isEditAction ? 'neutral-2' : isDeleteAction ? 'red-2' : 'neutral-3'
        }
      >
        <Flex
          gap={2}
          alignItems="center"
        >
          <Icon
            as={isAddAction ? CheckSquare : isEditAction ? PencilWithLineIcon : Trash}
            color={isEditAction || isAddAction ? 'neutral-7' : 'red-1'}
          />
          {action.content}
        </Flex>
      </Card>
      {canBeDeleted && (
        <IconButton
          aria-label="Remove action"
          icon={<Trash />}
          variant="ghost"
          size="icon-sm"
          color="red-1"
          onClick={() => removeAction(index)}
        />
      )}
    </Flex>
  );
}
