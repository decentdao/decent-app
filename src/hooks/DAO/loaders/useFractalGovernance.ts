import { useQuery } from '@apollo/client';
import { useEffect, useRef } from 'react';
import { useProvider } from 'wagmi';
import { DAOQueryDocument } from '../../../../.graphclient';
import { useFractal } from '../../../providers/App/AppProvider';
import { FractalGovernanceAction } from '../../../providers/App/governance/action';
import useIPFSClient from '../../../providers/App/hooks/useIPFSClient';
import { useAzoriusStrategy } from './governance/useERC20LinearStrategy';
import { useERC20LinearToken } from './governance/useERC20LinearToken';
import { useDAOProposals } from './useProposals';

export const useFractalGovernance = () => {
  // load key for component; helps prevent unnecessary calls
  const loadKey = useRef<string>();

  const {
    node: { daoAddress },
    governanceContracts,
    action,
  } = useFractal();

  const provider = useProvider();

  const loadDAOProposals = useDAOProposals();
  const loadAzoriusStrategy = useAzoriusStrategy();
  const { loadERC20Token, loadUnderlyingERC20Token } = useERC20LinearToken({});
  const ipfsClient = useIPFSClient();

  const ONE_MINUTE = 60 * 1000;

  const chainName = provider.network.name === 'homestead' ? 'mainnet' : provider.network.name;

  useQuery(DAOQueryDocument, {
    variables: { daoAddress },
    onCompleted: async data => {
      if (!daoAddress) return;
      const { daos } = data;
      const dao = daos[0];

      if (dao) {
        const { proposalTemplatesHash } = dao;
        if (proposalTemplatesHash) {
          const proposalTemplates = await ipfsClient.cat(proposalTemplatesHash);

          action.dispatch({
            type: FractalGovernanceAction.SET_PROPOSAL_TEMPLATES,
            payload: proposalTemplates || [],
          });
        } else {
          action.dispatch({
            type: FractalGovernanceAction.SET_PROPOSAL_TEMPLATES,
            payload: [],
          });
        }
      } else {
        action.dispatch({
          type: FractalGovernanceAction.SET_PROPOSAL_TEMPLATES,
          payload: [],
        });
      }
    },
    context: { chainName },
    pollInterval: ONE_MINUTE,
    skip: !daoAddress,
  });

  useEffect(() => {
    const { isLoaded, azoriusContract } = governanceContracts;

    const newLoadKey = daoAddress + (azoriusContract ? '1' : '0');

    if (isLoaded && daoAddress && newLoadKey !== loadKey.current) {
      loadKey.current = newLoadKey;

      loadDAOProposals();

      if (azoriusContract) {
        loadAzoriusStrategy();
        loadERC20Token();
        loadUnderlyingERC20Token();
      }
    } else if (!isLoaded) {
      loadKey.current = undefined;
    }
  }, [
    daoAddress,
    governanceContracts,
    loadDAOProposals,
    loadUnderlyingERC20Token,
    loadAzoriusStrategy,
    loadERC20Token,
  ]);
};
