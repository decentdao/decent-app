import { Box, Button, Flex, Icon, MenuItem, Text } from '@chakra-ui/react';
import { CaretDown } from '@phosphor-icons/react';
import { SafeMultisigTransactionResponse } from '@safe-global/safe-core-sdk-types';
import { useTranslation } from 'react-i18next';
import { getAddress, Hex } from 'viem';
import { useAccount } from 'wagmi';
import { DETAILS_BOX_SHADOW } from '../../../constants/common';
import { buildSafeTransaction, EIP712_SAFE_TX_TYPE } from '../../../helpers';
import { logError } from '../../../helpers/errorLogging';
import { findMostConfirmedMultisigRejectionProposal } from '../../../helpers/multisigProposal';
import { useSafeMultisigProposals } from '../../../hooks/DAO/loaders/governance/useSafeMultisigProposals';
import useSubmitProposal from '../../../hooks/DAO/proposal/useSubmitProposal';
import { useCurrentDAOKey } from '../../../hooks/DAO/useCurrentDAOKey';
import { useNetworkWalletClient } from '../../../hooks/useNetworkWalletClient';
import { useAsyncRequest } from '../../../hooks/utils/useAsyncRequest';
import { useCanUserCreateProposal } from '../../../hooks/utils/useCanUserSubmitProposal';
import { useDAOStore } from '../../../providers/App/AppProvider';
import { useSafeAPI } from '../../../providers/App/hooks/useSafeAPI';
import { useNetworkConfigStore } from '../../../providers/NetworkConfig/useNetworkConfigStore';
import { FractalProposalState, MultisigProposal } from '../../../types';
import { SectionTopContentBox } from '../../ui/containers/ContentBox';
import { OptionMenu } from '../../ui/menus/OptionMenu';
import { ModalType } from '../../ui/modals/ModalProvider';
import { useDecentModal } from '../../ui/modals/useDecentModal';

const useSignTransaction = () => {
  const { daoKey } = useCurrentDAOKey();
  const {
    node: { safe },
  } = useDAOStore({ daoKey });
  const { chain } = useNetworkConfigStore();
  const { loadSafeMultisigProposals } = useSafeMultisigProposals();
  const { data: walletClient } = useNetworkWalletClient();
  const { t } = useTranslation(['proposal']);

  const safeAPI = useSafeAPI();
  const [asyncRequest, asyncRequestPending] = useAsyncRequest();

  const signTransaction = async (
    proposalTx: SafeMultisigTransactionResponse,
    proposalId: string,
  ) => {
    if (!walletClient || !safe?.address || !safeAPI) {
      return;
    }
    try {
      const safeTx = buildSafeTransaction({
        ...proposalTx,
        gasToken: getAddress(proposalTx.gasToken),
        refundReceiver: proposalTx.refundReceiver
          ? getAddress(proposalTx.refundReceiver)
          : undefined,
        to: getAddress(proposalTx.to),
        value: BigInt(proposalTx.value),
        data: proposalTx.data as Hex,
        operation: proposalTx.operation as 0 | 1,
      });

      asyncRequest({
        asyncFunc: () =>
          walletClient.signTypedData({
            account: walletClient.account.address,
            domain: { verifyingContract: safe.address, chainId: chain.id },
            types: EIP712_SAFE_TX_TYPE,
            primaryType: 'SafeTx',
            message: {
              to: safeTx.to,
              value: safeTx.value,
              data: safeTx.data,
              operation: safeTx.operation,
              safeTxGas: safeTx.safeTxGas,
              baseGas: safeTx.baseGas,
              gasPrice: safeTx.gasPrice,
              gasToken: safeTx.gasToken,
              refundReceiver: safeTx.refundReceiver,
              nonce: safeTx.nonce,
            },
          }),
        failedMessage: t('failedSign'),
        pendingMessage: t('pendingSign'),
        successMessage: t('successSign'),
        successCallback: async (signature: string) => {
          await safeAPI.confirmTransaction(proposalId, signature);
          await loadSafeMultisigProposals();
        },
      });
    } catch (e) {
      logError(e, 'Error occurred during transaction confirmation');
    }
  };
  return {
    signTransaction,
    asyncRequestPending,
  };
};

function getTriggerButtonColor(
  approvalTimestamp: Date | undefined,
  rejectionTimestamp: Date | undefined,
) {
  if (!!approvalTimestamp && !!rejectionTimestamp) {
    return approvalTimestamp > rejectionTimestamp ? 'green' : 'red';
  }
  if (approvalTimestamp) {
    return 'celery-0';
  }

  if (rejectionTimestamp) {
    return 'red-1';
  }

  return 'white-0';
}

function getTriggerButtonLabel(
  approvalTimestamp: Date | undefined,
  rejectionTimestamp: Date | undefined,
) {
  if (!!approvalTimestamp && !!rejectionTimestamp) {
    return approvalTimestamp > rejectionTimestamp ? 'approve' : 'reject';
  }
  if (approvalTimestamp) {
    return 'approve';
  }

  if (rejectionTimestamp) {
    return 'reject';
  }

  return 'selectStatusLabel';
}

function SignatureOption({
  label,
  color,
  isDisabled,
  menuItemOnClick,
}: {
  label: string;
  color: string;
  isDisabled: boolean;
  menuItemOnClick: () => void;
}) {
  const { t } = useTranslation(['common']);
  return (
    <MenuItem
      closeOnSelect
      onClick={menuItemOnClick}
      isDisabled={isDisabled}
      boxShadow={DETAILS_BOX_SHADOW}
      px="1rem"
      py="0.5rem"
      bg="neutral-2"
      borderRadius="0.5rem"
      w="full"
      cursor="pointer"
      _hover={{
        bg: 'neutral-3',
      }}
      _active={{
        bg: 'neutral-3',
      }}
      _disabled={{
        cursor: 'not-allowed',
        opacity: 0.5,
      }}
    >
      <Text
        textStyle="body-small"
        color={color}
      >
        {t(label)}
      </Text>
    </MenuItem>
  );
}

export function SignatureSection({ proposal }: { proposal: MultisigProposal }) {
  const { proposalId, confirmations, transaction } = proposal;
  const { canUserCreateProposal } = useCanUserCreateProposal();
  const { daoKey } = useCurrentDAOKey();
  const {
    node: { safe },
    governance: { proposals },
  } = useDAOStore({ daoKey });
  const user = useAccount();
  const { t } = useTranslation(['common', 'proposal']);

  const { signTransaction, asyncRequestPending } = useSignTransaction();
  const { submitRejectionMultisigProposal, pendingCreateTx } = useSubmitProposal();

  const conflictingProposals =
    proposals?.filter(
      (p: MultisigProposal) =>
        p.nonce === proposal.nonce &&
        p.proposalId !== proposal.proposalId &&
        !p.isMultisigRejectionTx,
    ) ?? [];

  const rejectionProposal = findMostConfirmedMultisigRejectionProposal(
    safe?.address,
    proposal.nonce,
    proposals,
  );

  const userProposalConfirmation = confirmations?.find(
    confirmation => confirmation.owner === user.address,
  );
  const userRejectionProposalConfirmation = rejectionProposal?.confirmations?.find(
    confirmation => confirmation.owner === user.address,
  );

  const handleConfirmSubmitRejectionProposal = () => {
    submitRejectionMultisigProposal({
      safeAddress: safe?.address,
      nonce: proposal.nonce,
      pendingToastMessage: t('proposalRejectionCreatePendingToastMessage', {
        ns: 'proposal',
      }),
      successToastMessage: t('proposalRejectionCreateSuccessToastMessage', {
        ns: 'proposal',
      }),
      failedToastMessage: t('proposalRejectionCreateFailureToastMessage', {
        ns: 'proposal',
      }),
    });
  };

  const openConfirmRejectProposalModal = useDecentModal(ModalType.CONFIRM_REJECT_PROPOSAL, {
    submitRejection: handleConfirmSubmitRejectionProposal,
  });
  const showConfirmRejectProposalModal = !rejectionProposal && conflictingProposals?.length;

  const isDoNotShowStates =
    proposal.state === FractalProposalState.CLOSED ||
    proposal.state === FractalProposalState.REJECTED ||
    proposal.state === FractalProposalState.EXECUTED;

  if (
    !canUserCreateProposal ||
    !transaction ||
    isDoNotShowStates ||
    !safe?.address ||
    !user.address
  ) {
    return null;
  }

  const proposalApprovalTimestamp = userProposalConfirmation
    ? new Date(userProposalConfirmation.submissionDate)
    : undefined;
  const rejectionProposalApprovalTimestamp = userRejectionProposalConfirmation
    ? new Date(userRejectionProposalConfirmation.submissionDate)
    : undefined;

  let isSignatureSectionDisabled =
    asyncRequestPending || proposal.state !== FractalProposalState.ACTIVE || pendingCreateTx;
  // Allow proposer to sign reject proposal, since proposer automatically approves
  if (proposal.proposer === getAddress(user.address)) {
    if (!userRejectionProposalConfirmation && !isSignatureSectionDisabled) {
      isSignatureSectionDisabled = false;
    } else if (userRejectionProposalConfirmation) {
      isSignatureSectionDisabled = true;
    }
    // If user has already approved or rejected, disable signature section
  } else if (userProposalConfirmation || userRejectionProposalConfirmation) {
    isSignatureSectionDisabled = true;
  }

  return (
    <SectionTopContentBox>
      <Text
        textStyle="labels-large"
        color="neutral-7"
      >
        {t('yourSignatureLabel', { ns: 'proposal' })}
      </Text>
      <OptionMenu
        matchWidth
        // allows menu button to become disabled via isDisabled prop
        buttonAs={Button}
        buttonProps={{
          // prevents button styling
          variant: 'unstyled',
          isDisabled: isSignatureSectionDisabled,
          // base styling
          w: 'full',
          boxShadow: DETAILS_BOX_SHADOW,
          px: '1rem',
          py: '0.5rem',
          bg: 'neutral-2',
          borderRadius: '0.5rem',
          mt: '0.5rem',
          color: getTriggerButtonColor(
            proposalApprovalTimestamp,
            rejectionProposalApprovalTimestamp,
          ),
          // disabled styles
          _disabled: {
            cursor: 'default',
            color: 'neutral-5',
          },
        }}
        trigger={
          <Flex
            alignItems="center"
            justifyContent="space-between"
            w="full"
          >
            <Text textStyle="body-small">
              {t(
                getTriggerButtonLabel(
                  proposalApprovalTimestamp,
                  rejectionProposalApprovalTimestamp,
                ),
              )}
            </Text>
            <Icon
              as={CaretDown}
              boxSize="1.5rem"
            />
          </Flex>
        }
        options={[
          {
            optionKey: 'approve',
            onClick: () => {},
            renderer: () => (
              <SignatureOption
                label="approve"
                color="celery-0"
                isDisabled={!!userProposalConfirmation}
                menuItemOnClick={() => signTransaction(transaction, proposalId)}
              />
            ),
          },
          {
            optionKey: 'reject',
            onClick: () => {},
            renderer: () => (
              <SignatureOption
                label="reject"
                color="red-1"
                isDisabled={!!userRejectionProposalConfirmation}
                menuItemOnClick={() =>
                  showConfirmRejectProposalModal
                    ? openConfirmRejectProposalModal()
                    : rejectionProposal?.transaction
                      ? signTransaction(rejectionProposal.transaction, rejectionProposal.proposalId)
                      : handleConfirmSubmitRejectionProposal()
                }
              />
            ),
          },
        ]}
      />
      <Box
        mt="0.5rem"
        pl="0.5rem"
      >
        {conflictingProposals?.length > 0 && (
          <Text
            textStyle="labels-small"
            color="neutral-7"
          >
            {t('conflictingProposalNotice', { ns: 'proposal' })}
          </Text>
        )}
      </Box>
    </SectionTopContentBox>
  );
}
