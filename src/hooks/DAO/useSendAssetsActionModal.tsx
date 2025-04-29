import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ModalType } from '../../components/ui/modals/ModalProvider';
import { useDecentModal } from '../../components/ui/modals/useDecentModal';
import { DAO_ROUTES } from '../../constants/routes';
import { useStore } from '../../providers/App/AppProvider';
import { useNetworkConfigStore } from '../../providers/NetworkConfig/useNetworkConfigStore';
import { useProposalActionsStore } from '../../store/actions/useProposalActionsStore';
import {
  prepareSendAssetsActionData,
  SendAssetsData,
} from '../../utils/dao/prepareSendAssetsActionData';
import { useCurrentDAOKey } from './useCurrentDAOKey';

export default function useSendAssetsActionModal() {
  const { daoKey } = useCurrentDAOKey();
  const {
    node: { safe },
  } = useStore({ daoKey });
  const { addressPrefix } = useNetworkConfigStore();
  const { t } = useTranslation(['modals']);
  const { addAction, resetActions } = useProposalActionsStore();
  const navigate = useNavigate();

  const sendAssetsAction = async (sendAssetsData: SendAssetsData) => {
    if (!safe?.address) {
      return;
    }

    const { action } = prepareSendAssetsActionData(sendAssetsData);
    resetActions();
    addAction({ ...action, content: <></> });
    navigate(DAO_ROUTES.proposalWithActionsNew.relative(addressPrefix, safe.address));
  };

  const openSendAssetsModal = useDecentModal(ModalType.SEND_ASSETS, {
    onSubmit: sendAssetsAction,
    submitButtonText: t('submitProposal', { ns: 'modals' }),
  });

  return {
    openSendAssetsModal,
  };
}
