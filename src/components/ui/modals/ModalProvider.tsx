import { Portal, Show, useDisclosure } from '@chakra-ui/react';
import { FormikProps } from 'formik';
import { createContext, ReactNode, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Address } from 'viem';
import { NEUTRAL_2_50_TRANSPARENT } from '../../../constants/common';
import { AirdropData, CreateProposalTransaction, ProposalTemplate } from '../../../types';
import { SendAssetsData } from '../../../utils/dao/prepareSendAssetsActionData';
import { ProposalTransactionsFormModal } from '../../ProposalBuilder/ProposalTransactionsForm';
import AddSignerModal from '../../SafeSettings/Signers/modals/AddSignerModal';
import RemoveSignerModal from '../../SafeSettings/Signers/modals/RemoveSignerModal';
import DraggableDrawer from '../containers/DraggableDrawer';
import { AddCreateProposalPermissionModal } from './AddCreateProposalPermissionModal';
import { AddStrategyPermissionModal } from './AddStrategyPermissionModal';
import { AirdropModal } from './AirdropModal/AirdropModal';
import { ConfirmDeleteStrategyModal } from './ConfirmDeleteStrategyModal';
import { ConfirmModifyGovernanceModal } from './ConfirmModifyGovernanceModal';
import { ConfirmUrlModal } from './ConfirmUrlModal';
import { ConfirmExecutionModal, ConfirmRejectProposalModal } from './ConfirmationModal';
import { DelegateModal } from './DelegateModal';
import ForkProposalTemplateModal from './ForkProposalTemplateModal';
import { GaslessVoteFailedModal } from './GaslessVoting/GaslessVoteFailedModal';
import { GaslessVoteLoadingModal } from './GaslessVoting/GaslessVoteLoadingModal';
import { GaslessVoteSuccessModal } from './GaslessVoting/GaslessVoteSuccessModal';
import { RefillGasTankModal } from './GaslessVoting/RefillGasTankModal';
import { WithdrawGasTankModal } from './GaslessVoting/WithdrawGasTankModal';
import { ModalBase, ModalBaseSize, ModalContentStyle } from './ModalBase';
import PaymentCancelConfirmModal from './PaymentCancelConfirmModal';
import { PaymentWithdrawModal } from './PaymentWithdrawModal';
import ProposalTemplateModal from './ProposalTemplateModal';
import { SafeProposalDappDetailModal } from './SafeDapp/SafeProposalDappDetailModal';
import { SafeProposalDappsModal } from './SafeDapp/SafeProposalDappsModal';
import { SafeSettingsModal } from './SafeSettingsModal';
import { SendAssetsModal } from './SendAssetsModal';
import { UnsavedChangesWarningContent } from './UnsavedChangesWarningContent';

export enum ModalType {
  DELEGATE,
  STAKE,
  CONFIRM_URL,
  REMOVE_SIGNER, // @TODO: remove this modal (https://linear.app/decent-labs/issue/ENG-1150/remove-add-remove-signer-modals)
  ADD_SIGNER, // @TODO: remove this modal (https://linear.app/decent-labs/issue/ENG-1150/remove-add-remove-signer-modals)
  ADD_PERMISSION,
  ADD_CREATE_PROPOSAL_PERMISSION,
  CREATE_PROPOSAL_FROM_TEMPLATE,
  COPY_PROPOSAL_TEMPLATE,
  CONFIRM_MODIFY_GOVERNANCE,
  WARN_UNSAVED_CHANGES,
  WITHDRAW_PAYMENT,
  CONFIRM_CANCEL_PAYMENT,
  CONFIRM_DELETE_STRATEGY,
  SEND_ASSETS,
  AIRDROP,
  REFILL_GAS,
  GASLESS_VOTE_LOADING,
  GASLESS_VOTE_SUCCESS,
  GASLESS_VOTE_FAILED,
  TRANSACTION_BUILDER,
  WITHDRAW_GAS,
  DAPPS_BROWSER,
  DAPP_BROWSER,
  SAFE_SETTINGS,
  CONFIRM_NONCE_EXECUTION,
  CONFIRM_REJECT_PROPOSAL,
  CONFIRM_EXECUTION,
}

export type ModalPropsTypes = {
  [ModalType.DELEGATE]: {};
  [ModalType.STAKE]: {};
  [ModalType.ADD_PERMISSION]: {
    openAddCreateProposalPermissionModal: () => void;
  };
  [ModalType.ADD_CREATE_PROPOSAL_PERMISSION]: {
    votingStrategyAddress: Address | null;
  };
  [ModalType.CONFIRM_DELETE_STRATEGY]: {};
  [ModalType.CONFIRM_URL]: { url: string | undefined };
  [ModalType.REMOVE_SIGNER]: {
    selectedSigner: Address;
    signers: Address[];
    currentThreshold: number;
  };
  [ModalType.ADD_SIGNER]: { signers: Address[]; currentThreshold: number | undefined };
  [ModalType.CREATE_PROPOSAL_FROM_TEMPLATE]: { proposalTemplate: ProposalTemplate };
  [ModalType.COPY_PROPOSAL_TEMPLATE]: {
    proposalTemplate: ProposalTemplate;
    templateIndex: number;
  };
  [ModalType.CONFIRM_MODIFY_GOVERNANCE]: {};
  [ModalType.WARN_UNSAVED_CHANGES]: {
    discardChanges: () => void;
    keepEditing: () => void;
  };
  [ModalType.WITHDRAW_PAYMENT]: {
    paymentAssetLogo?: string;
    paymentAssetSymbol: string;
    paymentAssetDecimals: number;
    paymentStreamId?: string;
    paymentContractAddress: Address | undefined;
    withdrawInformation: {
      roleHatSmartAccountAddress: Address | undefined;
      recipient: Address | undefined;
      withdrawableAmount: bigint | undefined;
    };
    onSuccess: () => void;
  };
  [ModalType.CONFIRM_CANCEL_PAYMENT]: {
    onSubmit: () => void;
  };
  [ModalType.SEND_ASSETS]: {
    onSubmit: (sendAssetData: SendAssetsData) => void;
    submitButtonText: string;
  };
  [ModalType.AIRDROP]: {
    onSubmit: (airdropData: AirdropData) => void;
    submitButtonText: string;
  };
  [ModalType.REFILL_GAS]: {};
  [ModalType.WITHDRAW_GAS]: {};
  [ModalType.GASLESS_VOTE_LOADING]: {};
  [ModalType.GASLESS_VOTE_SUCCESS]: {};
  [ModalType.GASLESS_VOTE_FAILED]: {
    onRetry: () => void;
    onFallback: () => void;
  };
  [ModalType.TRANSACTION_BUILDER]: {
    onSubmit?: (transactionBuilderData: FormikProps<CreateProposalTransaction[]>['values']) => void;
    submitButtonText?: string;
  };
  [ModalType.DAPPS_BROWSER]: {};
  [ModalType.DAPP_BROWSER]: {
    appUrl: string;
  };
  [ModalType.SAFE_SETTINGS]: {};
  [ModalType.CONFIRM_NONCE_EXECUTION]: {
    nonce: number | undefined;
    continue: () => void;
    cancel: () => void;
  };
  [ModalType.CONFIRM_REJECT_PROPOSAL]: {
    submitRejection: () => void;
  };
  [ModalType.CONFIRM_EXECUTION]: {
    nonce: number | undefined;
    submitExecution: () => void;
  };
};

export type ModalTypeWithProps = {
  [K in ModalType]: { type: K; props: ModalPropsTypes[K] };
}[ModalType];

export interface IModalContext {
  openModals: ModalTypeWithProps[];
  pushModal: (modal: ModalTypeWithProps) => void;
  popModal: () => void;
  closeAllModals: () => void;
}

export const ModalContext = createContext<IModalContext>({
  openModals: [],
  pushModal: () => {},
  popModal: () => {},
  closeAllModals: () => {},
});

interface ModalData {
  title?: string;
  warn: boolean;
  content: ReactNode | null;
  isSearchInputModal: boolean;
  onSetClosed: () => void;
  size: ModalBaseSize;
  closeOnOverlayClick: boolean;
  contentStyle?: ModalContentStyle;
  type: ModalType;
}

const getModalData = (args: {
  current: ModalTypeWithProps;
  popModal: () => void;
  closeAll: () => void;
  t: (key: string) => string;
}): ModalData => {
  const { current, popModal, closeAll, t } = args;

  let modalSize: ModalBaseSize = 'lg';
  let modalTitle: string | undefined;
  let hasWarning = false;
  let isSearchInput = false;
  let modalContent: ReactNode | null = null;
  let closeModalOnOverlayClick = true;
  let modalContentStyle: ModalContentStyle | undefined;

  switch (current.type) {
    case ModalType.DELEGATE:
      modalTitle = t('delegateTitle');
      modalContent = <DelegateModal close={popModal} />;
      break;

    case ModalType.CONFIRM_URL:
      if (!current.props.url) {
        throw new Error('URL is required for CONFIRM_URL modal');
      }

      modalTitle = t('confirmUrlTitle');
      hasWarning = true;
      modalContent = (
        <ConfirmUrlModal
          url={current.props.url}
          close={popModal}
        />
      );
      break;
    case ModalType.REMOVE_SIGNER:
      modalTitle = t('removeSignerTitle');
      modalContent = (
        <RemoveSignerModal
          selectedSigner={current.props.selectedSigner}
          signers={current.props.signers}
          currentThreshold={current.props.currentThreshold}
          close={popModal}
        />
      );
      break;
    case ModalType.ADD_SIGNER:
      if (!current.props.currentThreshold) {
        throw new Error('Current threshold is required for ADD_SIGNER modal');
      }

      modalTitle = t('addSignerTitle');
      modalContent = (
        <AddSignerModal
          signers={current.props.signers}
          currentThreshold={current.props.currentThreshold}
          close={popModal}
        />
      );
      break;
    case ModalType.CREATE_PROPOSAL_FROM_TEMPLATE:
      modalTitle = current.props.proposalTemplate.title;
      modalContent = (
        <ProposalTemplateModal
          proposalTemplate={current.props.proposalTemplate}
          onClose={popModal}
        />
      );
      break;
    case ModalType.COPY_PROPOSAL_TEMPLATE:
      modalTitle = t('forkProposalTemplate');
      modalContent = (
        <ForkProposalTemplateModal
          proposalTemplate={current.props.proposalTemplate}
          templateIndex={current.props.templateIndex}
          onClose={popModal}
        />
      );
      break;
    case ModalType.CONFIRM_MODIFY_GOVERNANCE:
      hasWarning = true;
      modalContent = (
        <ConfirmModifyGovernanceModal
          onClose={popModal}
          closeAllModals={closeAll}
        />
      );
      break;
    case ModalType.WARN_UNSAVED_CHANGES:
      closeModalOnOverlayClick = false;
      modalContent = (
        <UnsavedChangesWarningContent
          onDiscard={() => {
            current.props.discardChanges();
            popModal();
          }}
          onKeepEditing={() => {
            current.props.keepEditing();
            setTimeout(() => {
              popModal();
            }, 0); // This is a workaround to avoid the modal being closed immediately
          }}
        />
      );
      break;
    case ModalType.WITHDRAW_PAYMENT:
      if (!current.props.withdrawInformation.withdrawableAmount) {
        throw new Error('Withdrawable amount is required for WITHDRAW_PAYMENT modal');
      }
      if (!current.props.withdrawInformation.recipient) {
        throw new Error('Recipient is required for WITHDRAW_PAYMENT modal');
      }

      modalContent = (
        <PaymentWithdrawModal
          paymentAssetLogo={current.props.paymentAssetLogo}
          paymentAssetSymbol={current.props.paymentAssetSymbol}
          paymentAssetDecimals={current.props.paymentAssetDecimals}
          paymentStreamId={current.props.paymentStreamId}
          paymentContractAddress={current.props.paymentContractAddress}
          withdrawInformation={{
            ...current.props.withdrawInformation,
            withdrawableAmount: current.props.withdrawInformation.withdrawableAmount,
            recipient: current.props.withdrawInformation.recipient,
          }}
          onSuccess={current.props.onSuccess}
          onClose={popModal}
        />
      );
      break;
    case ModalType.CONFIRM_CANCEL_PAYMENT: {
      modalContent = (
        <PaymentCancelConfirmModal
          closeModal={popModal}
          onSubmit={current.props.onSubmit}
        />
      );
      modalSize = 'sm';
      break;
    }
    case ModalType.ADD_PERMISSION:
      modalContent = (
        <AddStrategyPermissionModal
          closeModal={popModal}
          openAddCreateProposalPermissionModal={current.props.openAddCreateProposalPermissionModal}
        />
      );
      modalSize = 'xl';
      break;
    case ModalType.ADD_CREATE_PROPOSAL_PERMISSION:
      modalContent = (
        <AddCreateProposalPermissionModal
          closeModal={popModal}
          votingStrategyAddress={current.props.votingStrategyAddress}
        />
      );
      modalSize = 'xl';
      break;
    case ModalType.CONFIRM_DELETE_STRATEGY:
      modalContent = (
        <ConfirmDeleteStrategyModal
          onClose={popModal}
          closeAllModals={closeAll}
        />
      );
      break;
    case ModalType.SEND_ASSETS:
      modalContent = (
        <SendAssetsModal
          submitButtonText={current.props.submitButtonText}
          close={popModal}
          sendAssetsData={(data: SendAssetsData) => {
            current.props.onSubmit(data);
            popModal();
          }}
        />
      );
      break;
    case ModalType.REFILL_GAS:
      modalContent = <RefillGasTankModal close={popModal} />;
      break;
    case ModalType.WITHDRAW_GAS:
      modalContent = <WithdrawGasTankModal close={popModal} />;
      break;
    case ModalType.GASLESS_VOTE_SUCCESS:
      modalContent = <GaslessVoteSuccessModal close={popModal} />;
      modalSize = 'md';
      break;
    case ModalType.GASLESS_VOTE_FAILED:
      modalContent = (
        <GaslessVoteFailedModal
          close={popModal}
          onRetry={current.props.onRetry}
          onFallback={current.props.onFallback}
        />
      );
      modalSize = 'md';
      break;
    case ModalType.GASLESS_VOTE_LOADING:
      modalContent = <GaslessVoteLoadingModal />;
      modalSize = 'md';
      closeModalOnOverlayClick = false;
      break;
    case ModalType.AIRDROP:
      modalContent = (
        <AirdropModal
          submitButtonText={current.props.submitButtonText}
          close={popModal}
          airdropData={(data: AirdropData) => {
            current.props.onSubmit(data);
            popModal();
          }}
        />
      );
      break;
    case ModalType.TRANSACTION_BUILDER:
      modalTitle = t('transactionBuilderTitle');
      modalContent = (
        <ProposalTransactionsFormModal
          pendingTransaction={false}
          values={[]}
          errors={undefined}
          setFieldValue={() => {}}
          isProposalMode={true}
          onSubmit={current.props.onSubmit}
          onClose={popModal}
          submitButtonText={current.props.submitButtonText}
        />
      );
      modalSize = '2xl';
      break;
    case ModalType.DAPPS_BROWSER:
      modalContent = <SafeProposalDappsModal onClose={popModal} />;
      modalSize = 'max';
      break;
    case ModalType.DAPP_BROWSER:
      modalContent = (
        <SafeProposalDappDetailModal
          appUrl={current.props.appUrl}
          onClose={popModal}
        />
      );
      modalSize = 'max';
      break;
    case ModalType.SAFE_SETTINGS:
      modalContent = (
        <SafeSettingsModal
          closeModal={popModal}
          closeAllModals={closeAll}
        />
      );
      modalSize = '6xl';
      modalContentStyle = {
        backgroundColor: NEUTRAL_2_50_TRANSPARENT,
        padding: '0',
      };
      break;

    case ModalType.CONFIRM_REJECT_PROPOSAL:
      modalContent = (
        <ConfirmRejectProposalModal
          submitRejection={() => {
            current.props.submitRejection();
            popModal();
          }}
          cancel={popModal}
        />
      );
      modalSize = 'md';
      break;
    case ModalType.CONFIRM_EXECUTION:
      modalContent = (
        <ConfirmExecutionModal
          nonce={current.props.nonce}
          submitExecution={() => {
            current.props.submitExecution();
            popModal();
          }}
          cancel={popModal}
        />
      );
      modalSize = 'md';
      break;

    default:
      modalTitle = '';
      modalContent = null;
      break;
  }

  return {
    isSearchInputModal: isSearchInput,
    title: modalTitle,
    warn: hasWarning,
    content: modalContent,
    onSetClosed: popModal,
    size: modalSize,
    closeOnOverlayClick: closeModalOnOverlayClick,
    contentStyle: modalContentStyle,
    type: current.type,
  };
};

function ModalDisplay({
  modalData,
  isOpen,
  openModal,
  index,
  baseZIndex,
}: {
  modalData: ModalData;
  isOpen: boolean;
  openModal: () => void;
  index: number;
  baseZIndex: number;
}) {
  const {
    content,
    isSearchInputModal,
    title,
    warn,
    size,
    closeOnOverlayClick,
    contentStyle,
    onSetClosed,
    type,
  } = modalData;

  let display = content ? (
    <ModalBase
      closeOnOverlayClick={closeOnOverlayClick}
      title={title}
      warn={warn}
      isOpen={isOpen}
      onClose={onSetClosed}
      isSearchInputModal={isSearchInputModal}
      size={size}
      contentStyle={contentStyle}
      zIndex={baseZIndex + index}
    >
      {content}
    </ModalBase>
  ) : null;

  if (
    type === ModalType.WITHDRAW_PAYMENT ||
    type === ModalType.CONFIRM_CANCEL_PAYMENT ||
    type === ModalType.ADD_PERMISSION ||
    type === ModalType.CONFIRM_DELETE_STRATEGY ||
    type === ModalType.GASLESS_VOTE_LOADING ||
    type === ModalType.GASLESS_VOTE_FAILED ||
    type === ModalType.GASLESS_VOTE_SUCCESS
  ) {
    display = (
      <>
        <Show below="md">
          <DraggableDrawer
            isOpen={isOpen}
            onClose={onSetClosed}
            onOpen={openModal}
            closeOnOverlayClick={closeOnOverlayClick}
            headerContent={null}
          >
            {content}
          </DraggableDrawer>
        </Show>
        <Show above="md">
          <ModalBase
            closeOnOverlayClick={closeOnOverlayClick}
            title={title}
            warn={warn}
            isOpen={isOpen}
            onClose={onSetClosed}
            isSearchInputModal={isSearchInputModal}
            zIndex={baseZIndex + index + 1}
            size={size}
          >
            {content}
          </ModalBase>
        </Show>
      </>
    );
  }

  return display;
}

/**
 * A provider that handles displaying modals in the app.
 *
 * To add a new modal:
 *  1. Create the modal content as a component, excluding the title of the modal (see e.g. DelegateModal).
 *  2. Add the modal to the ModalType enum.
 *  3. Handle assigning your new modal component for that ModalType here in the provider switch case.
 *  4. Utilize the useDecentModal hook to get a click listener to open your new modal.
 */
export function ModalProvider({
  children,
  baseZIndex = 1400,
  closeBaseModal,
}: {
  children: ReactNode;
  baseZIndex?: number;
  closeBaseModal?: () => void;
}) {
  const [openModals, setOpenModals] = useState<ModalTypeWithProps[]>([]);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { t } = useTranslation('modals');

  const pushModal = useCallback((modal: ModalTypeWithProps) => {
    setOpenModals(prev => [...prev, modal]);
  }, []);

  const popModal = useCallback(() => {
    setOpenModals(prev => prev.slice(0, -1));
  }, []);

  const closeAllModals = useCallback(() => {
    setOpenModals([]);
    if (closeBaseModal) {
      closeBaseModal();
    }
    onClose();
  }, [onClose, closeBaseModal]);

  useEffect(() => {
    if (openModals.length > 0) {
      onOpen();
    } else {
      onClose();
    }
  }, [openModals.length, onOpen, onClose]);

  const modalDisplays = openModals.map((modal, i) => {
    const modalData = getModalData({
      current: modal,
      popModal,
      closeAll: closeAllModals,
      t,
    });
    return (
      <ModalDisplay
        key={i}
        modalData={modalData}
        isOpen={isOpen}
        openModal={onOpen}
        index={i}
        baseZIndex={baseZIndex}
      />
    );
  });

  return (
    <ModalContext.Provider value={{ openModals, pushModal, popModal, closeAllModals }}>
      {children}
      <Portal>{modalDisplays}</Portal>
    </ModalContext.Provider>
  );
}
