import { useEffect } from "react";
import useFeatureFlag from "../../helpers/environmentFeatureFlags";
import { useCurrentDAOKey } from "../../hooks/DAO/useCurrentDAOKey";
import { useStore } from "../../providers/App/AppProvider";

// TODO: This is a temporary wrapper to reset the safe state when the store feature is not enabled.
// This should be removed once the store feature is fully rolled out.

export default function SafeStateResetWrapper({ children }: { children: React.ReactNode }) {
  const storeFeatureEnabled = useFeatureFlag('flag_store_v2');
  const { daoKey } = useCurrentDAOKey();
  const {
    node: { safe },
    action,
  } = useStore({ daoKey });

  useEffect(() => {
    if (storeFeatureEnabled) {
      return;
    }

    if (safe?.address) {
      action.resetSafeState();
    }
  }, [storeFeatureEnabled, action, safe?.address]);
  return <>{children}</>;
}
