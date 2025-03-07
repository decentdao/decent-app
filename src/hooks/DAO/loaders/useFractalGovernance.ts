import { useEffect, useRef } from 'react';
import { createDecentSubgraphClient } from '../../../graphql';
import { DAOQuery, DAOQueryResponse } from '../../../graphql/DAOQueries';
import { useFractal } from '../../../providers/App/AppProvider';
import { FractalGovernanceAction } from '../../../providers/App/governance/action';
import useIPFSClient from '../../../providers/App/hooks/useIPFSClient';
import { useNetworkConfigStore } from '../../../providers/NetworkConfig/useNetworkConfigStore';
import { useDaoInfoStore } from '../../../store/daoInfo/useDaoInfoStore';
import { GovernanceType, ProposalTemplate } from '../../../types';
import { useERC20LinearStrategy } from './governance/useERC20LinearStrategy';
import { useERC20LinearToken } from './governance/useERC20LinearToken';
import { useERC721LinearStrategy } from './governance/useERC721LinearStrategy';
import useERC721Tokens from './governance/useERC721Tokens';
import { useLockRelease } from './governance/useLockRelease';
import { useLoadDAOProposals } from './useLoadDAOProposals';

export const useFractalGovernance = () => {
  const {
    governanceContracts,
    action,
    governance: { type },
    guardContracts: { isGuardLoaded },
  } = useFractal();
  const { safe } = useDaoInfoStore();
  const { getConfigByChainId, chain } = useNetworkConfigStore();

  const safeAddress = safe?.address;

  const loadDAOProposals = useLoadDAOProposals();
  const loadERC20Strategy = useERC20LinearStrategy();
  const loadERC721Strategy = useERC721LinearStrategy();
  const { loadERC20Token } = useERC20LinearToken({});
  const { loadLockedVotesToken } = useLockRelease({});
  const loadERC721Tokens = useERC721Tokens();
  const ipfsClient = useIPFSClient();

  const subgraphLoadKey = useRef<string>();
  useEffect(() => {
    const getSubgraphData = async () => {
      if (!safeAddress) return;

      try {
        const client = createDecentSubgraphClient(getConfigByChainId(chain.id));
        const result = await client.query<DAOQueryResponse>(DAOQuery, { safeAddress });

        if (result.error) {
          console.error('Failed to fetch DAO data', result.error);
        }

        if (!result.data) {
          action.dispatch({
            type: FractalGovernanceAction.SET_PROPOSAL_TEMPLATES,
            payload: [],
          });
          return;
        }
        const { daos } = result.data;
        const dao = daos[0];

        // `dao` might be undefined despite what the type says
        if (!dao) {
          action.dispatch({
            type: FractalGovernanceAction.SET_PROPOSAL_TEMPLATES,
            payload: [],
          });
          return;
        }

        const { proposalTemplatesHash } = dao;

        if (!proposalTemplatesHash) {
          action.dispatch({
            type: FractalGovernanceAction.SET_PROPOSAL_TEMPLATES,
            payload: [],
          });
          return;
        }

        const proposalTemplates: ProposalTemplate[] | undefined =
          await ipfsClient.cat(proposalTemplatesHash);

        if (!proposalTemplates) {
          action.dispatch({
            type: FractalGovernanceAction.SET_PROPOSAL_TEMPLATES,
            payload: [],
          });
          return;
        }

        const mappedProposalTemplates = proposalTemplates.map(proposalTemplate => ({
          ...proposalTemplate,
          transactions: proposalTemplate.transactions.map(transaction => ({
            ...transaction,
            ethValue: {
              // bigintValue was serialized as a string, so we need to convert it back to a bigint
              bigintValue: BigInt(transaction.ethValue.bigintValue || 0n),
              value: transaction.ethValue.value ?? '0',
            },
          })),
        }));

        action.dispatch({
          type: FractalGovernanceAction.SET_PROPOSAL_TEMPLATES,
          payload: mappedProposalTemplates,
        });
      } catch (error) {
        console.error('Error processing DAO data:', error);
        action.dispatch({
          type: FractalGovernanceAction.SET_PROPOSAL_TEMPLATES,
          payload: [],
        });
      }
    };

    const newLoadKey = safeAddress || '0x';
    if (safeAddress && safeAddress !== subgraphLoadKey.current) {
      subgraphLoadKey.current = newLoadKey;
      getSubgraphData();
    }
    if (!safeAddress) {
      subgraphLoadKey.current = undefined;
    }
  }, [action, chain.id, getConfigByChainId, ipfsClient, safeAddress]);

  useEffect(() => {
    const {
      isLoaded,
      moduleAzoriusAddress,
      lockReleaseAddress,
      linearVotingErc721Address,
      linearVotingErc20Address,
      linearVotingErc20WithHatsWhitelistingAddress,
      linearVotingErc721WithHatsWhitelistingAddress,
    } = governanceContracts;

    if (isLoaded && !type) {
      if (moduleAzoriusAddress) {
        if (linearVotingErc20Address || linearVotingErc20WithHatsWhitelistingAddress) {
          action.dispatch({
            type: FractalGovernanceAction.SET_GOVERNANCE_TYPE,
            payload: GovernanceType.AZORIUS_ERC20,
          });
          loadERC20Strategy();
          loadERC20Token();
          if (lockReleaseAddress) {
            loadLockedVotesToken();
          }
        } else if (linearVotingErc721Address || linearVotingErc721WithHatsWhitelistingAddress) {
          action.dispatch({
            type: FractalGovernanceAction.SET_GOVERNANCE_TYPE,
            payload: GovernanceType.AZORIUS_ERC721,
          });
          loadERC721Strategy();
          loadERC721Tokens();
        }
      } else {
        action.dispatch({
          type: FractalGovernanceAction.SET_GOVERNANCE_TYPE,
          payload: GovernanceType.MULTISIG,
        });
      }
    }
  }, [
    governanceContracts,
    loadERC20Strategy,
    loadERC20Token,
    loadLockedVotesToken,
    loadERC721Strategy,
    loadERC721Tokens,
    action,
    type,
  ]);

  const proposalsLoadKey = useRef<string>();
  useEffect(() => {
    const newLoadKey = safeAddress || '0x';
    if (type && safeAddress && safeAddress !== proposalsLoadKey.current && isGuardLoaded) {
      proposalsLoadKey.current = newLoadKey;
      loadDAOProposals();
    }
    if (!type || !safeAddress) {
      proposalsLoadKey.current = undefined;
    }
  }, [type, loadDAOProposals, isGuardLoaded, safeAddress]);
};
