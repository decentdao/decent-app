import { useEffect, useRef } from 'react';
import { useBlocker } from 'react-router-dom';
import { ModalType } from '../components/ui/modals/ModalProvider';
import { useDecentModal } from '../components/ui/modals/useDecentModal';

interface UseUnsavedBlockerOptions {
  when: boolean;
  onDiscardChanges: () => void;
}

export function useUnsavedChangesBlocker({
  when,
  onDiscardChanges,
}: UseUnsavedBlockerOptions): void {
  const blocker = useBlocker(when);

  const { open: openModal } = useDecentModal(ModalType.WARN_UNSAVED_CHANGES, {
    discardChanges: () => {
      onDiscardChanges();
      if (blocker.state === 'blocked' && blocker.proceed) {
        blocker.proceed();
      }
    },
    keepEditing: () => {
      if (blocker.state === 'blocked' && blocker.reset) {
        blocker.reset();
      }
    },
  });
  const modalRef = useRef(false);
  useEffect(() => {
    if (blocker.state === 'blocked' && !modalRef.current) {
      modalRef.current = true;
      openModal();
    } else {
      modalRef.current = false;
    }
  }, [blocker.state, openModal]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!when) return;
      e.preventDefault();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [when]);
}
