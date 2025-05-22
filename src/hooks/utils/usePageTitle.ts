import { useEffect } from 'react';
import { useDAOStore } from '../../providers/App/AppProvider';
import { useCurrentDAOKey } from '../DAO/useCurrentDAOKey';

export const usePageTitle = () => {
  const { daoKey } = useCurrentDAOKey();
  const {
    node: { subgraphInfo },
  } = useDAOStore({ daoKey });
  useEffect(() => {
    if (subgraphInfo?.daoName) {
      document.title = `${import.meta.env.VITE_APP_NAME} | ${subgraphInfo?.daoName}`;
    }

    return () => {
      document.title = import.meta.env.VITE_APP_NAME;
    };
  }, [subgraphInfo?.daoName]);
};
