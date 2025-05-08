import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Address } from 'viem';
import { useDAOStore } from '../../providers/App/AppProvider';
import { useSafeAPI } from '../../providers/App/hooks/useSafeAPI';
import { useCurrentDAOKey } from '../DAO/useCurrentDAOKey';

export const useUpdateSafeData = (safeAddress?: Address) => {
  const safeAPI = useSafeAPI();
  const location = useLocation();
  const prevPathname = useRef(location.pathname);
  const { daoKey } = useCurrentDAOKey();
  const {
    node: { setSafeInfo },
  } = useDAOStore({ daoKey });

  useEffect(() => {
    if (!safeAPI || !safeAddress) {
      return;
    }

    // Retrieve latest safe info on page/url change
    // @todo - do we need to check if the safeAddress has changed?
    if (prevPathname.current !== location.pathname) {
      (async () => {
        const safeInfo = await safeAPI.getSafeData(safeAddress);

        setSafeInfo(safeInfo);
      })();
      prevPathname.current = location.pathname;
    }
  }, [safeAddress, safeAPI, location, setSafeInfo]);
};
