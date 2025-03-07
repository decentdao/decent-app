import { Outlet } from 'react-router-dom';
import { useAzoriusListeners } from '../../hooks/DAO/loaders/governance/useAzoriusListeners';
import { useERC20Claim } from '../../hooks/DAO/loaders/governance/useERC20Claim';
import { useSnapshotProposals } from '../../hooks/DAO/loaders/snapshot/useSnapshotProposals';
import { useDecentTreasury } from '../../hooks/DAO/loaders/useDecentTreasury';
import { useFractalFreeze } from '../../hooks/DAO/loaders/useFractalFreeze';
import { useFractalGovernance } from '../../hooks/DAO/loaders/useFractalGovernance';
import { useFractalGuardContracts } from '../../hooks/DAO/loaders/useFractalGuardContracts';
import { useFractalNode } from '../../hooks/DAO/loaders/useFractalNode';
import { useGovernanceContracts } from '../../hooks/DAO/loaders/useGovernanceContracts';
import { useHatsTree } from '../../hooks/DAO/loaders/useHatsTree';
import { useKeyValuePairs } from '../../hooks/DAO/useKeyValuePairs';
import { useParseSafeAddress } from '../../hooks/DAO/useParseSafeAddress';
import { useAutomaticSwitchChain } from '../../hooks/utils/useAutomaticSwitchChain';
import { usePageTitle } from '../../hooks/utils/usePageTitle';
import { useTemporaryProposals } from '../../hooks/utils/useTemporaryProposals';
import { useUpdateSafeData } from '../../hooks/utils/useUpdateSafeData';
import { useDaoInfoStore } from '../../store/daoInfo/useDaoInfoStore';
import LoadingProblem from '../LoadingProblem';

export function SafeController() {
  const { invalidQuery, wrongNetwork, addressPrefix, safeAddress } = useParseSafeAddress();
  useAutomaticSwitchChain({ urlAddressPrefix: addressPrefix });

  useUpdateSafeData(safeAddress);
  usePageTitle();
  useTemporaryProposals();

  const { subgraphInfo } = useDaoInfoStore();

  const { errorLoading } = useFractalNode({
    addressPrefix,
    safeAddress,
    wrongNetwork,
    invalidQuery,
  });

  useGovernanceContracts();
  useFractalGuardContracts({});
  useFractalFreeze({ parentSafeAddress: subgraphInfo?.parentAddress ?? null });
  useFractalGovernance();
  useDecentTreasury();
  useERC20Claim();
  useSnapshotProposals();
  useAzoriusListeners();

  useKeyValuePairs();
  useHatsTree();

  // the order of the if blocks of these next three error states matters
  if (invalidQuery) {
    return <LoadingProblem type="badQueryParam" />;
  } else if (errorLoading) {
    return <LoadingProblem type="invalidSafe" />;
  }

  return <Outlet />;
}
