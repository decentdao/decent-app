import { Portal, Show, useDisclosure } from '@chakra-ui/react';
import { FormikProps, FormikContextType } from 'formik';
import { createContext, ReactNode, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Address } from 'viem';
import { NEUTRAL_2_50_TRANSPARENT } from '../../../constants/common';
import { AddCreateProposalPermissionModal } from '../../../pages/dao/settings/permissions/AddCreateProposalPermissionModal';
import { CreateProposalTransaction, ProposalTemplate } from '../../../types';
import { SendAssetsData } from '../../../utils/dao/prepareSendAssetsActionData';
import { ProposalTransactionsFormModal } from '../../ProposalBuilder/ProposalTransactionsForm';
import AddSignerModal from '../../SafeSettings/Signers/modals/AddSignerModal';
import RemoveSignerModal from '../../SafeSettings/Signers/modals/RemoveSignerModal';
import DraggableDrawer from '../containers/DraggableDrawer';
import { AddStrategyPermissionModal } from './AddStrategyPermissionModal';
import { AgreementBuilderModal } from './AgreementBuilderModal';
import { AirdropData, AirdropModal } from './AirdropModal/AirdropModal';
import { ConfirmDeleteStrategyModal } from './ConfirmDeleteStrategyModal';
import { ConfirmModifyGovernanceModal } from './ConfirmModifyGovernanceModal';
import { ConfirmUrlModal } from './ConfirmUrlModal';
import { ConfirmExecutionModal, ConfirmRejectProposalModal } from './ConfirmationModal';
import { DelegateModal } from './DelegateModal';
import ForkProposalTemplateModal from './ForkProposalTemplateModal';
import { GaslessVoteFailedModal } from './GaslessVoting/GaslessVoteFailedModal';
import { GaslessVoteLoadingModal } from './GaslessVoting/GaslessVoteLoadingModal';
import { GaslessVoteSuccessModal } from './GaslessVoting/GaslessVoteSuccessModal';
import { RefillGasData, RefillGasTankModal } from './GaslessVoting/RefillGasTankModal';
import { WithdrawGasData, WithdrawGasTankModal } from './GaslessVoting/WithdrawGasTankModal';
import { ModalBase, ModalBaseSize, ModalContentStyle } from './ModalBase';
import PaymentCancelConfirmModal from './PaymentCancelConfirmModal';
import { PaymentWithdrawModal } from './PaymentWithdrawModal';
import ProposalTemplateModal from './ProposalTemplateModal';
import { SafeProposalDappDetailModal } from './SafeDapp/SafeProposalDappDetailModal';
import { SafeProposalDappsModal } from './SafeDapp/SafeProposalDappsModal';
import { SafeSettingsEdits, SafeSettingsModal } from './SafeSettingsModal';
import { SendAssetsModal } from './SendAssetsModal';
import StakeModal from './Stake';
import { UnsavedChangesWarningContent } from './UnsavedChangesWarningContent';

export enum ModalType {
  NONE,
  DELEGATE,
  STAKE,
  CONFIRM_URL,
  REMOVE_SIGNER,
  ADD_SIGNER,
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
  AGREEMENT_BUILDER,
}

export type ModalPropsTypes = {
  [ModalType.NONE]: {};
  [ModalType.DELEGATE]: {};
  [ModalType.STAKE]: {};
  [ModalType.ADD_PERMISSION]: {
    openAddCreateProposalPermissionModal: () => void;
  };
  [ModalType.ADD_CREATE_PROPOSAL_PERMISSION]: {
    formikContext: FormikContextType<SafeSettingsEdits>;
    votingStrategyAddress: Address | null;
  };
  [ModalType.CONFIRM_DELETE_STRATEGY]: {};
  [ModalType.CONFIRM_URL]: { url: string };
  [ModalType.REMOVE_SIGNER]: {
    selectedSigner: Address;
    signers: Address[];
    currentThreshold: number;
  };
  [ModalType.ADD_SIGNER]: { signers: Address[]; currentThreshold: number };
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
    paymentContractAddress: Address;
    withdrawInformation: {
      roleHatSmartAccountAddress: Address | undefined;
      recipient: Address;
      withdrawableAmount: bigint;
    };
    onSuccess: () => Promise<void>;
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
  [ModalType.REFILL_GAS]: {
    onSubmit: (refillGasData: RefillGasData) => void;
  };
  [ModalType.WITHDRAW_GAS]: {
    onWithdraw: (withdrawGasData: WithdrawGasData) => void;
  };
  [ModalType.GASLESS_VOTE_LOADING]: {};
  [ModalType.GASLESS_VOTE_SUCCESS]: {};
  [ModalType.GASLESS_VOTE_FAILED]: {
    onRetry: () => void;
    onFallback: () => void;
  };
  [ModalType.TRANSACTION_BUILDER]: {
    onSubmit?: (transactionBuilderData: FormikProps<CreateProposalTransaction[]>['values']) => void;
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
  [ModalType.AGREEMENT_BUILDER]: {};
};

export type ModalTypeWithProps = {
  [K in ModalType]: { type: K; props: ModalPropsTypes[K] };
}[ModalType];

export interface IModalContext {
  openModals: ModalTypeWithProps[];
  pushModal: (modal: ModalTypeWithProps) => void;
  popModal: () => void;
}

export const ModalContext = createContext<IModalContext>({
  openModals: [],
  pushModal: () => {},
  popModal: () => {},
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
    case ModalType.STAKE:
      modalTitle = t('stakeTitle');
      modalContent = <StakeModal close={popModal} />;
      break;
    case ModalType.CONFIRM_URL:
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
    case ModalType.WITHDRAW_PAYMENT: {
      modalContent = (
        <PaymentWithdrawModal
          paymentAssetLogo={current.props.paymentAssetLogo}
          paymentAssetSymbol={current.props.paymentAssetSymbol}
          paymentAssetDecimals={current.props.paymentAssetDecimals}
          paymentStreamId={current.props.paymentStreamId}
          paymentContractAddress={current.props.paymentContractAddress}
          withdrawInformation={current.props.withdrawInformation}
          onSuccess={current.props.onSuccess}
          onClose={popModal}
        />
      );
      break;
    }
    case ModalType.CONFIRM_CANCEL_PAYMENT: {
      modalContent = (
        <PaymentCancelConfirmModal
          onClose={popModal}
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
          formikContext={current.props.formikContext}
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
      modalContent = (
        <RefillGasTankModal
          close={popModal}
          refillGasData={(data: RefillGasData) => {
            current.props.onSubmit(data);
            popModal();
          }}
        />
      );
      break;
    case ModalType.WITHDRAW_GAS:
      modalContent = (
        <WithdrawGasTankModal
          close={popModal}
          withdrawGasData={(data: WithdrawGasData) => {
            current.props.onWithdraw(data);
            popModal();
          }}
        />
      );
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
      modalSize = 'max';
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
    case ModalType.AGREEMENT_BUILDER:
      modalContent = <AgreementBuilderModal closeModal={popModal} />;
      modalSize = 'max';
      break;
    case ModalType.NONE:
    default:
      modalTitle = '';
      modalContent = null;
    // @todo - confirm behaviour of NONE modal type, potentially remove. (https://linear.app/decent-labs/issue/ENG-826/confirm-behaviour-of-none-modal-type-potentially-remove)
    // onClose();
    // closeModal();
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
}: {
  modalData: ModalData;
  isOpen: boolean;
  openModal: () => void;
  index: number;
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
      zIndex={1400 + index}
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
            zIndex={1401 + index} // @dev - Modal zIndex is 1400, but since these modals are might be shown alongside drawer - we need to make it larger
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
export function ModalProvider({ children }: { children: ReactNode }) {
  const [openModals, setOpenModals] = useState<ModalTypeWithProps[]>([]);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { t } = useTranslation('modals');

  const pushModal = useCallback((modal: ModalTypeWithProps) => {
    setOpenModals(prev => [...prev, modal]);
  }, []);

  const popModal = useCallback(() => {
    setOpenModals(prev => prev.slice(0, -1));
  }, []);

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
      closeAll: () => {
        setOpenModals([]);
        onClose();
      },
      t,
    });
    return (
      <ModalDisplay
        key={i}
        modalData={modalData}
        isOpen={isOpen}
        openModal={onOpen}
        index={i}
      />
    );
  });

  return (
    <ModalContext.Provider value={{ openModals, pushModal, popModal }}>
      {children}
      <Portal>{modalDisplays}</Portal>
    </ModalContext.Provider>
  );
}
