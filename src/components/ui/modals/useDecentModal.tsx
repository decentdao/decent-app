import { useContext } from 'react';
import {
  ModalTypeWithProps,
  IModalContext,
  ModalContext,
  ModalPropsTypes,
  ModalType,
} from './ModalProvider';

/**
 * Returns a Function intended to be used in a click listener to open the provided ModalType.
 *
 * @param modal the ModalType to open.
 * @param props optional arbitrary key:value properties to pass to the modal
 * @returns a Function that when called opens the provided ModalType modal.
 */
export const useDecentModal = <T extends ModalType>(modal: T, props?: ModalPropsTypes[T]) => {
  const { pushModal, openModals } = useContext<IModalContext>(ModalContext);
  return () => {
    const modalObject = { type: modal, props: props ?? {} } as ModalTypeWithProps;

    if (openModals.findIndex(m => m.type === modal) === -1) {
      pushModal(modalObject);
    }
  };
};
