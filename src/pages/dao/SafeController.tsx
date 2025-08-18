import { Outlet } from 'react-router-dom';
import { useHatsTree } from '../../hooks/DAO/loaders/useHatsTree';
import { useCurrentDAOKey } from '../../hooks/DAO/useCurrentDAOKey';
import { useAutomaticSwitchChain } from '../../hooks/utils/useAutomaticSwitchChain';
import { usePageTitle } from '../../hooks/utils/usePageTitle';
import { useTemporaryProposals } from '../../hooks/utils/useTemporaryProposals';
import { useUpdateSafeData } from '../../hooks/utils/useUpdateSafeData';
import { useDAOStoreFetcher } from '../../store/fetcher';
import { useDAOStoreListener } from '../../store/listener';
import LoadingProblem from '../LoadingProblem';

export function SafeController() {
  const { invalidQuery, wrongNetwork, addressPrefix, safeAddress, daoKey } = useCurrentDAOKey();
  useAutomaticSwitchChain({ urlAddressPrefix: addressPrefix });

  useUpdateSafeData(safeAddress);
  usePageTitle();
  useTemporaryProposals();

  useHatsTree();

  const { errorLoading } = useDAOStoreFetcher({ daoKey, safeAddress, invalidQuery, wrongNetwork });
  useDAOStoreListener({ daoKey });

  // the order of the if blocks of these next three error states matters
  if (invalidQuery) {
    return <LoadingProblem type="badQueryParam" />;
  } else if (errorLoading) {
    return <LoadingProblem type="invalidSafe" />;
  }

  return <Outlet />;
}
