import { useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useFractal } from '../../providers/App/AppProvider';
import { useERC20Claim } from './loaders/governance/useERC20Claim';
import { useSnapshotProposals } from './loaders/snapshot/useSnapshotProposals';
import { useFractalFreeze } from './loaders/useFractalFreeze';
import { useFractalGovernance } from './loaders/useFractalGovernance';
import { useFractalGuardContracts } from './loaders/useFractalGuardContracts';
import { useFractalNode } from './loaders/useFractalNode';
import { useFractalTreasury } from './loaders/useFractalTreasury';
import { useGovernanceContracts } from './loaders/useGovernanceContracts';

export default function useDAOController() {
  const currentDAOAddress = useRef<string | null>(null);
  const { daoAddress } = useParams();
  const {
    node: {
      nodeHierarchy: { parentAddress },
    },
    action,
  } = useFractal();
  useEffect(() => {
    if (!daoAddress || daoAddress !== currentDAOAddress.current) {
      action.resetDAO();
      currentDAOAddress.current = null;
    }
    if (daoAddress && !currentDAOAddress.current) {
      currentDAOAddress.current = daoAddress;
    }
  }, [action, daoAddress]);

  const { nodeLoading, errorLoading } = useFractalNode({ daoAddress: currentDAOAddress.current || '' });
  useGovernanceContracts();
  useFractalGuardContracts({});
  useFractalFreeze({ parentSafeAddress: parentAddress });
  useFractalGovernance();
  useFractalTreasury();
  useERC20Claim();
  useSnapshotProposals();
  return { nodeLoading, errorLoading };
}
