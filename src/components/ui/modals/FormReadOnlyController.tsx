import { useFormikContext } from 'formik';
import { useEffect } from 'react';

interface FormReadOnlyControllerProps {
  isReadOnly: boolean;
}

/**
 * Component that manages form read-only state via Formik's status property.
 * Must be used inside a Formik form context.
 */
export function FormReadOnlyController({ isReadOnly }: FormReadOnlyControllerProps) {
  const { setStatus, status } = useFormikContext();

  useEffect(() => {
    const currentReadOnly = status?.readOnly ?? false;
    if (currentReadOnly !== isReadOnly) {
      setStatus({ ...status, readOnly: isReadOnly });
    }
  }, [isReadOnly, setStatus, status]);

  return null;
}
