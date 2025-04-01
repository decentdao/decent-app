import { Button } from '@chakra-ui/react';
import { useFormikContext } from 'formik';
import useFeatureFlag from '../../helpers/environmentFeatureFlags';
import { RoleFormValues } from '../../types/roles';
import { DEV_STREAM_DURATION_MINUTES } from './devModeConstants';
export function DevSet10MinPaymentStream({ formIndex }: { formIndex: number }) {
  const { values, setFieldValue } = useFormikContext<RoleFormValues>();

  const devFeatureEnabled = useFeatureFlag('flag_dev');
  // Use local flag only for flag_dev
  return devFeatureEnabled ? (
    <Button
      size="sm"
      onClick={() => {
        const startDate = new Date();
        const endDate = new Date(startDate.getTime() + DEV_STREAM_DURATION_MINUTES * 60 * 1000);
        setFieldValue(`roleEditing.payments.${formIndex}`, {
          ...values.roleEditing?.payments?.[formIndex],
          startDate,
          endDate,
        });
      }}
      mb={4}
    >
      Set {DEV_STREAM_DURATION_MINUTES} min stream
    </Button>
  ) : null;
}
