import { useContext } from 'react';
import {
  ModalTypeWithProps,
  IModalContext,
  ModalContext,
  ModalPropsTypes,
  ModalType,
} from './ModalProvider';

/**
 * Returns an object with `open` and `close` functions to control the provided ModalType modal.
 *
 * @param modal the ModalType to open.
 * @param props optional arbitrary key:value properties to pass to the modal
 */
export const useDecentModal = <T extends ModalType>(modal: T, props?: ModalPropsTypes[T]) => {
  const { pushModal, openModals, popModal } = useContext<IModalContext>(ModalContext);
  return {
    open: () => {
      const modalObject = { type: modal, props: props ?? {} } as ModalTypeWithProps;

      if (openModals.findIndex(m => m.type === modal) === -1) {
        pushModal(modalObject);
      }
    },
    close: () => {
      popModal();
    },
  };
};
