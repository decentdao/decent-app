import { ModalType } from '../../components/ui/modals/ModalProvider';
import { useDecentModal } from '../../components/ui/modals/useDecentModal';

export default function useIframeActionModal() {
  const openIframeModal = useDecentModal(ModalType.IFRAME);

  return {
    openIframeModal,
  };
}
