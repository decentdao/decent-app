import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ModalType } from '../../components/ui/modals/ModalProvider';
import { useDecentModal } from '../../components/ui/modals/useDecentModal';
import { DAO_ROUTES } from '../../constants/routes';
import { useFractal } from '../../providers/App/AppProvider';
import { useNetworkConfigStore } from '../../providers/NetworkConfig/useNetworkConfigStore';
import { useProposalActionsStore } from '../../store/actions/useProposalActionsStore';
import { useDaoInfoStore } from '../../store/daoInfo/useDaoInfoStore';

import {
  prepareSendAssetsActionData,
  SendAssetsData,
} from '../../utils/dao/prepareSendAssetsActionData';

export default function useSendAssetsActionModal() {
  const { safe } = useDaoInfoStore();
  const { addressPrefix } = useNetworkConfigStore();
  const { t } = useTranslation(['modals']);
  const { addAction } = useProposalActionsStore();
  const navigate = useNavigate();
  const {
    governance: { isAzorius },
  } = useFractal();
  const sendAssetsAction = async (sendAssetsData: SendAssetsData) => {
    if (!safe?.address) {
      return;
    }

    const { action } = prepareSendAssetsActionData(sendAssetsData);
    addAction({ ...action, content: <></> });

    navigate(DAO_ROUTES.proposalWithActionsNew.relative(addressPrefix, safe.address));
  };

  const openSendAssetsModal = useDecentModal(ModalType.SEND_ASSETS, {
    onSubmit: sendAssetsAction,
    submitButtonText: t('submitProposal', { ns: 'modals' }),
    showNonceInput: !isAzorius,
  });

  return {
    openSendAssetsModal,
  };
}
