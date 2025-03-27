import { Box, Button, Text, Flex } from '@chakra-ui/react';
import { abis } from '@fractal-framework/fractal-contracts';
import { SafeMultisigTransactionResponse } from '@safe-global/safe-core-sdk-types';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getAddress, getContract, Hex, isHex, zeroAddress } from 'viem';
import { useAccount } from 'wagmi';
import GnosisSafeL2Abi from '../../../assets/abi/GnosisSafeL2';
import { Check } from '../../../assets/theme/custom/icons/Check';
import { BACKGROUND_SEMI_TRANSPARENT } from '../../../constants/common';
import { buildSafeTransaction, buildSignatureBytes, EIP712_SAFE_TX_TYPE } from '../../../helpers';
import { logError } from '../../../helpers/errorLogging';
import { findMostConfirmedMultisigRejectionProposal } from '../../../helpers/multisigProposal';
import { useSafeMultisigProposals } from '../../../hooks/DAO/loaders/governance/useSafeMultisigProposals';
import { useNetworkWalletClient } from '../../../hooks/useNetworkWalletClient';
import { useAsyncRequest } from '../../../hooks/utils/useAsyncRequest';
import { useTransaction } from '../../../hooks/utils/useTransaction';
import { useFractal } from '../../../providers/App/AppProvider';
import { useSafeAPI } from '../../../providers/App/hooks/useSafeAPI';
import { useNetworkConfigStore } from '../../../providers/NetworkConfig/useNetworkConfigStore';
import { useDaoInfoStore } from '../../../store/daoInfo/useDaoInfoStore';
import { MultisigProposal, FractalProposalState } from '../../../types';
import { DecentTooltip } from '../../ui/DecentTooltip';
import ContentBox from '../../ui/containers/ContentBox';
import { ProposalCountdown } from '../../ui/proposal/ProposalCountdown';

export function TxActions({ proposal }: { proposal: MultisigProposal }) {
  const {
    guardContracts: { freezeGuardContractAddress },
    governance: { proposals },
  } = useFractal();
  const userAccount = useAccount();
  const safeAPI = useSafeAPI();
  const { safe } = useDaoInfoStore();

  const [isSubmitDisabled, setIsSubmitDisabled] = useState(false);

  const wasTimelocked = useRef(
    proposal.state === FractalProposalState.TIMELOCKABLE ||
      proposal.state === FractalProposalState.TIMELOCKED,
  );

  useEffect(() => {
    if (wasTimelocked.current && proposal.state === FractalProposalState.EXECUTABLE) {
      setIsSubmitDisabled(false);
    }
  }, [proposal.state]);

  const { chain } = useNetworkConfigStore();
  const { t } = useTranslation(['proposal', 'common', 'transaction']);

  const [asyncRequest, asyncRequestPending] = useAsyncRequest();
  const [contractCall, contractCallPending] = useTransaction();
  const { loadSafeMultisigProposals } = useSafeMultisigProposals();
  const { data: walletClient } = useNetworkWalletClient();

  const isOwner = safe?.owners?.includes(userAccount.address ?? zeroAddress);

  if (!isOwner) return null;

  if (!proposal.transaction) return null;

  const signTransaction = async (proposalTx: SafeMultisigTransactionResponse | undefined) => {
    if (!walletClient || !safe?.address || !proposalTx || !safeAPI) {
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
          await safeAPI.confirmTransaction(proposal.proposalId, signature);
          await loadSafeMultisigProposals();
        },
      });
    } catch (e) {
      logError(e, 'Error occurred during transaction confirmation');
    }
  };

  const timelockTransaction = async () => {
    try {
      if (
        !proposal.transaction ||
        !proposal.transaction.confirmations ||
        !walletClient ||
        !freezeGuardContractAddress ||
        !isHex(proposal.transaction.data)
      ) {
        return;
      }
      const safeTx = buildSafeTransaction({
        ...proposal.transaction,
        gasToken: getAddress(proposal.transaction.gasToken),
        refundReceiver: proposal.transaction.refundReceiver
          ? getAddress(proposal.transaction.refundReceiver)
          : undefined,
        to: getAddress(proposal.transaction.to),
        value: BigInt(proposal.transaction.value),
        data: proposal.transaction.data,
        operation: proposal.transaction.operation as 0 | 1,
      });
      const signatures = buildSignatureBytes(
        proposal.transaction.confirmations.map(confirmation => {
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
        failedMessage: t('failedExecute', { ns: 'transaction' }),
        pendingMessage: t('pendingExecute', { ns: 'transaction' }),
        successMessage: t('successExecute', { ns: 'transaction' }),
        successCallback: async () => {
          setIsSubmitDisabled(true);
          await loadSafeMultisigProposals();
        },
      });
    } catch (e) {
      logError(e, 'Error occurred during transaction execution');
    }
  };

  const executeTransaction = async () => {
    try {
      if (
        !walletClient ||
        !safe?.address ||
        !proposal.transaction ||
        !proposal.transaction.confirmations ||
        !isHex(proposal.transaction.data)
      ) {
        return;
      }

      const safeContract = getContract({
        abi: GnosisSafeL2Abi,
        address: safe.address,
        client: walletClient,
      });

      const safeTx = buildSafeTransaction({
        ...proposal.transaction,
        gasToken: getAddress(proposal.transaction.gasToken),
        refundReceiver: proposal.transaction.refundReceiver
          ? getAddress(proposal.transaction.refundReceiver)
          : undefined,
        to: getAddress(proposal.transaction.to),
        value: BigInt(proposal.transaction.value),
        data: proposal.transaction.data,
        operation: proposal.transaction.operation as 0 | 1,
      });

      const signatures = buildSignatureBytes(
        proposal.transaction.confirmations.map(confirmation => {
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
        failedMessage: t('failedExecute', { ns: 'transaction' }),
        pendingMessage: t('pendingExecute', { ns: 'transaction' }),
        successMessage: t('successExecute', { ns: 'transaction' }),
        successCallback: async () => {
          setIsSubmitDisabled(true);
          await loadSafeMultisigProposals();
        },
      });
    } catch (e) {
      logError(e, 'Error occurred during transaction execution');
    }
  };

  const rejectionProposal = findMostConfirmedMultisigRejectionProposal(
    safe?.address,
    proposal.nonce,
    proposals,
  );

  const hasApproved = !!proposal.confirmations?.find(
    confirm => confirm.owner === userAccount.address,
  );
  const hasRejected = !!(rejectionProposal as MultisigProposal)?.confirmations?.find(
    confirm => confirm.owner === userAccount.address,
  );

  const isPending = asyncRequestPending || contractCallPending;
  if (
    (proposal.state === FractalProposalState.ACTIVE && !isOwner) ||
    proposal.state === FractalProposalState.REJECTED ||
    proposal.state === FractalProposalState.EXECUTED ||
    proposal.state === FractalProposalState.EXPIRED
  ) {
    return null;
  }

  type ButtonProps = {
    [state: string]: {
      action: () => Promise<any>;
      text: string;
      pageTitle: string;
      icon?: JSX.Element;
    };
  };

  const activeButtonProps = [
    {
      action: () => signTransaction(proposal.transaction),
      text: 'approve',
      pageTitle: 'signTitle',
    },
    {
      action: () => signTransaction(rejectionProposal?.transaction),
      text: 'reject',
      pageTitle: 'rejectTitle',
    },
  ];

  const buttonProps: ButtonProps = {
    [FractalProposalState.ACTIVE]: {
      action: () => signTransaction(proposal.transaction),
      text: 'approve',
      pageTitle: 'signTitle',
    },
    [FractalProposalState.EXECUTABLE]: {
      action: executeTransaction,
      text: 'execute',
      pageTitle: 'executeTitle',
      icon: <Check boxSize="1.5rem" />,
    },
    [FractalProposalState.TIMELOCKABLE]: {
      action: timelockTransaction,
      text: 'timelock',
      pageTitle: 'timelockTitle',
    },
    [FractalProposalState.TIMELOCKED]: {
      action: async () => {},
      text: 'execute',
      pageTitle: 'executeTitle',
    },
  };
  const isActiveNonce = !!safe && proposal.transaction.nonce === safe.nonce;
  const isButtonDisabled =
    isSubmitDisabled ||
    isPending ||
    proposal.state === FractalProposalState.TIMELOCKED ||
    !isActiveNonce;

  return (
    <ContentBox containerBoxProps={{ bg: BACKGROUND_SEMI_TRANSPARENT }}>
      <Flex justifyContent="space-between">
        <Text>{t(buttonProps[proposal.state!].pageTitle)}</Text>
        <ProposalCountdown proposal={proposal} />
      </Flex>

      {proposal.state === FractalProposalState.ACTIVE &&
        activeButtonProps.map((prop, index) => (
          <Box
            key={index}
            marginTop={4}
          >
            <DecentTooltip
              placement="top-start"
              label={t('notActiveNonceTooltip')}
              isDisabled={isActiveNonce}
            >
              <Button
                w="full"
                isDisabled={isButtonDisabled}
                onClick={prop.action}
              >
                {t(prop.text, { ns: 'common' })}
              </Button>
            </DecentTooltip>
          </Box>
        ))}

      {proposal.state !== FractalProposalState.ACTIVE && (
        <Box marginTop={4}>
          <DecentTooltip
            placement="top-start"
            label={t('notActiveNonceTooltip')}
            isDisabled={isActiveNonce}
          >
            <Button
              w="full"
              rightIcon={buttonProps[proposal.state!].icon}
              isDisabled={isButtonDisabled}
              onClick={buttonProps[proposal.state!].action}
            >
              {t(buttonProps[proposal.state!].text, { ns: 'common' })}
            </Button>
          </DecentTooltip>
        </Box>
      )}
    </ContentBox>
  );
}
