import { Button, Text } from '@chakra-ui/react';
import { abis } from '@fractal-framework/fractal-contracts';
import { SafeMultisigTransactionResponse } from '@safe-global/safe-core-sdk-types';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getAddress, getContract, Hex, isHex } from 'viem';
import GnosisSafeL2Abi from '../../../assets/abi/GnosisSafeL2';
import { buildSafeTransaction, buildSignatureBytes } from '../../../helpers';
import { logError } from '../../../helpers/errorLogging';
import { findMostConfirmedMultisigRejectionProposal } from '../../../helpers/multisigProposal';
import { useSafeMultisigProposals } from '../../../hooks/DAO/loaders/governance/useSafeMultisigProposals';
import { useCurrentDAOKey } from '../../../hooks/DAO/useCurrentDAOKey';
import { useNetworkWalletClient } from '../../../hooks/useNetworkWalletClient';
import { useCanUserCreateProposal } from '../../../hooks/utils/useCanUserSubmitProposal';
import { useTransaction } from '../../../hooks/utils/useTransaction';
import { useDAOStore } from '../../../providers/App/AppProvider';
import { FractalProposalState, MultisigProposal } from '../../../types';
import { DecentTooltip } from '../../ui/DecentTooltip';
import { SectionBottomContentBox } from '../../ui/containers/ContentBox';

function useProposalExecutionButtonAction(
  state: FractalProposalState | null | undefined,
  proposalTransaction: SafeMultisigTransactionResponse | undefined,
) {
  const { daoKey } = useCurrentDAOKey();
  const {
    guardContracts: { freezeGuardContractAddress },
    node: { safe },
  } = useDAOStore({ daoKey });
  const [isSubmitDisabled, setIsSubmitDisabled] = useState(false);
  const [contractCall, contractCallPending] = useTransaction();
  const { data: walletClient } = useNetworkWalletClient();
  const { loadSafeMultisigProposals } = useSafeMultisigProposals();
  const { t } = useTranslation(['transaction']);

  if (!state || !walletClient) return { action: undefined, actionPending: false };

  const timelockTransaction = async () => {
    try {
      setIsSubmitDisabled(true);
      if (
        !proposalTransaction ||
        !proposalTransaction.confirmations ||
        !walletClient ||
        !freezeGuardContractAddress ||
        !isHex(proposalTransaction.data)
      ) {
        return;
      }
      const safeTx = buildSafeTransaction({
        ...proposalTransaction,
        gasToken: getAddress(proposalTransaction.gasToken),
        refundReceiver: proposalTransaction.refundReceiver
          ? getAddress(proposalTransaction.refundReceiver)
          : undefined,
        to: getAddress(proposalTransaction.to),
        value: BigInt(proposalTransaction.value),
        data: proposalTransaction.data,
        operation: proposalTransaction.operation as 0 | 1,
      });
      const signatures = buildSignatureBytes(
        proposalTransaction.confirmations.map(confirmation => {
          if (!isHex(confirmation.signature)) {
            throw new Error('Confirmation signature is malfunctioned');
          }
          return {
            signer: confirmation.owner,
            data: confirmation.signature,
          };
        }),
      );
      const freezeGuard = getContract({
        abi: abis.MultisigFreezeGuard,
        address: freezeGuardContractAddress,
        client: walletClient,
      });
      contractCall({
        contractFn: () =>
          freezeGuard.write.timelockTransaction([
            safeTx.to,
            safeTx.value,
            safeTx.data,
            safeTx.operation,
            BigInt(safeTx.safeTxGas),
            BigInt(safeTx.baseGas),
            BigInt(safeTx.gasPrice),
            safeTx.gasToken,
            safeTx.refundReceiver,
            signatures,
            BigInt(safeTx.nonce),
          ]),
        failedMessage: t('failedExecute'),
        pendingMessage: t('pendingExecute'),
        successMessage: t('successExecute'),
        successCallback: async () => {
          setIsSubmitDisabled(false);
          await loadSafeMultisigProposals();
        },
      });
    } catch (e) {
      setIsSubmitDisabled(false);
      logError(e, 'Error occurred during transaction execution');
    }
  };

  const executeMultisigProposal = async (options: {
    requireDataHex: boolean;
    messages: {
      failed: string;
      pending: string;
      success: string;
    };
  }) => {
    try {
      setIsSubmitDisabled(true);
      if (
        !walletClient ||
        !safe?.address ||
        !proposalTransaction ||
        !proposalTransaction.confirmations ||
        (options.requireDataHex && !isHex(proposalTransaction.data))
      ) {
        return;
      }
      const safeContract = getContract({
        abi: GnosisSafeL2Abi,
        address: safe.address,
        client: walletClient,
      });

      const safeTx = buildSafeTransaction({
        ...proposalTransaction,
        gasToken: getAddress(proposalTransaction.gasToken),
        refundReceiver: proposalTransaction.refundReceiver
          ? getAddress(proposalTransaction.refundReceiver)
          : undefined,
        to: getAddress(proposalTransaction.to),
        value: BigInt(proposalTransaction.value),
        data: (proposalTransaction.data ?? undefined) as Hex | undefined,
        operation: proposalTransaction.operation as 0 | 1,
      });

      const signatures = buildSignatureBytes(
        proposalTransaction.confirmations.map(confirmation => {
          if (!isHex(confirmation.signature)) {
            throw new Error('Confirmation signature is malfunctioned');
          }
          return {
            signer: confirmation.owner,
            data: confirmation.signature,
          };
        }),
      );

      contractCall({
        contractFn: () =>
          safeContract.write.execTransaction([
            safeTx.to,
            safeTx.value,
            safeTx.data,
            safeTx.operation,
            BigInt(safeTx.safeTxGas),
            BigInt(safeTx.baseGas),
            BigInt(safeTx.gasPrice),
            safeTx.gasToken,
            safeTx.refundReceiver,
            signatures,
          ]),
        failedMessage: options.messages.failed,
        pendingMessage: options.messages.pending,
        successMessage: options.messages.success,
        successCallback: async () => {
          await loadSafeMultisigProposals();
        },
      });
    } catch (e) {
      setIsSubmitDisabled(false);
      logError(e, 'Error occurred during transaction execution');
    }
  };

  switch (state) {
    case FractalProposalState.ACTIVE:
      return {
        action: undefined,
        actionPending: false,
      };
    case FractalProposalState.EXECUTABLE:
      return {
        action: () =>
          executeMultisigProposal({
            requireDataHex: true,
            messages: {
              failed: t('failedExecute', { ns: 'transaction' }),
              pending: t('pendingExecute', { ns: 'transaction' }),
              success: t('successExecute', { ns: 'transaction' }),
            },
          }),
        actionPending: contractCallPending || isSubmitDisabled,
      };
    case FractalProposalState.TIMELOCKABLE:
      return {
        action: timelockTransaction,
        actionPending: contractCallPending || isSubmitDisabled,
      };
    case FractalProposalState.TIMELOCKED:
      return {
        action: undefined,
        actionPending: false,
      };

    default:
      return {
        action: undefined,
        actionPending: false,
      };
  }
}

function getProposalExecutionButtonLabel(state: FractalProposalState | null) {
  if (!state) return null;

  switch (state) {
    case FractalProposalState.ACTIVE:
      return 'awaitingSigners';
    case FractalProposalState.EXECUTABLE:
      return 'execute';
    case FractalProposalState.TIMELOCKABLE:
      return 'timelock';
    case FractalProposalState.TIMELOCKED:
      return 'execute';
    default:
      return null;
  }
}
function getRejectionProposalExecutionButtonLabel(state: FractalProposalState | null | undefined) {
  if (!state) return null;

  switch (state) {
    case FractalProposalState.ACTIVE:
      return 'executeRejection';
    case FractalProposalState.EXECUTABLE:
      return 'executeRejection';
    case FractalProposalState.TIMELOCKABLE:
      return 'timelockRejection';
    case FractalProposalState.TIMELOCKED:
      return 'executeRejection';
    default:
      return null;
  }
}

export function ExectionSection({ proposal }: { proposal: MultisigProposal }) {
  const { t } = useTranslation(['proposal']);
  const { daoKey } = useCurrentDAOKey();
  const {
    governance: { proposals },
    node: { safe },
  } = useDAOStore({ daoKey });

  const { canUserCreateProposal } = useCanUserCreateProposal();

  const proposalExecutionButtonLabel = getProposalExecutionButtonLabel(proposal.state);

  const { action, actionPending } = useProposalExecutionButtonAction(
    proposal.state,
    proposal.transaction
      ? { ...proposal.transaction, data: proposal.transaction.data ?? '0x' }
      : undefined,
  );

  const rejectionProposal = findMostConfirmedMultisigRejectionProposal(
    safe?.address,
    proposal.nonce,
    proposals,
  );
  const rejectionProposalExecutionButtonLabel = getRejectionProposalExecutionButtonLabel(
    rejectionProposal?.state,
  );

  const rejectionProposalAction = useProposalExecutionButtonAction(
    rejectionProposal?.state,
    rejectionProposal?.transaction,
  );

  const isRejectedProposalPassThreshold =
    !!rejectionProposal &&
    !!rejectionProposal.confirmations &&
    !!rejectionProposal.signersThreshold &&
    rejectionProposal.confirmations.length >= rejectionProposal.signersThreshold;

  const isDoNotShowStates =
    proposal.state === FractalProposalState.CLOSED ||
    proposal.state === FractalProposalState.EXECUTED;

  if (!proposalExecutionButtonLabel || isDoNotShowStates || !canUserCreateProposal) return null;
  const isActiveNonce =
    safe?.nonce === proposal.nonce || proposal.state === FractalProposalState.EXECUTABLE;

  const isButtonDisabled =
    actionPending ||
    !action ||
    !isActiveNonce ||
    proposal.state === FractalProposalState.EXPIRED ||
    rejectionProposalAction.actionPending;

  return (
    <SectionBottomContentBox>
      <Text
        textStyle="labels-large"
        color="neutral-7"
      >
        {t('proposalExecutionSectionTitle')}
      </Text>
      <DecentTooltip
        placement="top-start"
        label={t('notActiveNonceTooltip')}
        isDisabled={isActiveNonce}
      >
        <>
          {!isRejectedProposalPassThreshold && (
            <Button
              mt="0.5rem"
              w="full"
              py="0.75rem"
              px="1rem"
              onClick={action}
              isDisabled={isButtonDisabled}
            >
              {t(proposalExecutionButtonLabel)}
            </Button>
          )}
          {rejectionProposal && rejectionProposalExecutionButtonLabel && (
            <Button
              mt="0.5rem"
              w="full"
              py="0.75rem"
              px="1rem"
              onClick={rejectionProposalAction.action}
              isDisabled={!isRejectedProposalPassThreshold || rejectionProposalAction.actionPending}
            >
              {t(rejectionProposalExecutionButtonLabel)}
            </Button>
          )}
        </>
      </DecentTooltip>
    </SectionBottomContentBox>
  );
}
