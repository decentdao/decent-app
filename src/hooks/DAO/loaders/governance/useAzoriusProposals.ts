import { LinearERC20Voting, LinearERC721Voting } from '@fractal-framework/fractal-contracts';
import {
  Azorius,
  ProposalExecutedEvent,
} from '@fractal-framework/fractal-contracts/dist/typechain-types/contracts/azorius/Azorius';
import { VotedEvent as ERC20VotedEvent } from '@fractal-framework/fractal-contracts/dist/typechain-types/contracts/azorius/LinearERC20Voting';
import { VotedEvent as ERC721VotedEvent } from '@fractal-framework/fractal-contracts/dist/typechain-types/contracts/azorius/LinearERC721Voting';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Hex, getAddress } from 'viem';
import { logError } from '../../../../helpers/errorLogging';
import { useFractal } from '../../../../providers/App/AppProvider';
import { FractalGovernanceAction } from '../../../../providers/App/governance/action';
import { useEthersProvider } from '../../../../providers/Ethers/hooks/useEthersProvider';
import { useNetworkConfig } from '../../../../providers/NetworkConfig/NetworkConfigProvider';
import {
  CreateProposalMetadata,
  VotingStrategyType,
  DecodedTransaction,
  FractalProposalState,
} from '../../../../types';
import { AzoriusProposal } from '../../../../types/daoProposal';
import { Providers } from '../../../../types/network';
import { mapProposalCreatedEventToProposal, decodeTransactions } from '../../../../utils';
import useSafeContracts from '../../../safe/useSafeContracts';
import { CacheExpiry, CacheKeys } from '../../../utils/cache/cacheDefaults';
import { getValue, setValue } from '../../../utils/cache/useLocalStorage';
import { useSafeDecoder } from '../../../utils/useSafeDecoder';

type OnProposalLoaded = (proposal: AzoriusProposal) => void;

export const useAzoriusProposals = () => {
  const currentAzoriusAddress = useRef<string>();
  const network = useNetworkConfig();

  const {
    governanceContracts: {
      azoriusContractAddress,
      ozLinearVotingContractAddress,
      erc721LinearVotingContractAddress,
    },
    action,
  } = useFractal();

  const baseContracts = useSafeContracts();
  const provider = useEthersProvider();
  const decode = useSafeDecoder();

  const azoriusContract = useMemo(() => {
    if (!baseContracts || !azoriusContractAddress) {
      return;
    }

    return baseContracts.fractalAzoriusMasterCopyContract.asProvider.attach(azoriusContractAddress);
  }, [azoriusContractAddress, baseContracts]);

  const strategyType = useMemo(() => {
    if (ozLinearVotingContractAddress) {
      return VotingStrategyType.LINEAR_ERC20;
    } else if (erc721LinearVotingContractAddress) {
      return VotingStrategyType.LINEAR_ERC721;
    } else {
      return undefined;
    }
  }, [ozLinearVotingContractAddress, erc721LinearVotingContractAddress]);

  const erc20StrategyContract = useMemo(() => {
    if (!baseContracts || !ozLinearVotingContractAddress) {
      return undefined;
    }

    return baseContracts.linearVotingMasterCopyContract.asProvider.attach(
      ozLinearVotingContractAddress,
    );
  }, [baseContracts, ozLinearVotingContractAddress]);

  const erc721StrategyContract = useMemo(() => {
    if (!baseContracts || !erc721LinearVotingContractAddress) {
      return undefined;
    }

    return baseContracts.linearVotingERC721MasterCopyContract.asProvider.attach(
      erc721LinearVotingContractAddress,
    );
  }, [baseContracts, erc721LinearVotingContractAddress]);

  const erc20VotedEvents = useMemo(async () => {
    if (!erc20StrategyContract) {
      return;
    }

    const filter = erc20StrategyContract.filters.Voted();
    const events = await erc20StrategyContract.queryFilter(filter);

    return events;
  }, [erc20StrategyContract]);

  const erc721VotedEvents = useMemo(async () => {
    if (!erc721StrategyContract) {
      return;
    }

    const filter = erc721StrategyContract.filters.Voted();
    const events = await erc721StrategyContract.queryFilter(filter);

    return events;
  }, [erc721StrategyContract]);

  const executedEvents = useMemo(async () => {
    if (!azoriusContract) {
      return;
    }

    const filter = azoriusContract.filters.ProposalExecuted();
    const events = await azoriusContract.queryFilter(filter);

    return events;
  }, [azoriusContract]);

  useEffect(() => {
    if (!azoriusContractAddress) {
      currentAzoriusAddress.current = undefined;
    }

    if (azoriusContractAddress && currentAzoriusAddress.current !== azoriusContractAddress) {
      currentAzoriusAddress.current = azoriusContractAddress;
    }
  }, [azoriusContractAddress]);

  const { t } = useTranslation('proposal');

  const loadAzoriusProposals = useCallback(
    async (
      _azoriusContract: Azorius | undefined,
      _erc20StrategyContract: LinearERC20Voting | undefined,
      _erc721StrategyContract: LinearERC721Voting | undefined,
      _strategyType: VotingStrategyType | undefined,
      _erc20VotedEvents: Promise<ERC20VotedEvent[] | undefined>,
      _erc721VotedEvents: Promise<ERC721VotedEvent[] | undefined>,
      _executedEvents: Promise<ProposalExecutedEvent[] | undefined>,
      _provider: Providers | undefined,
      _decode: (
        value: string,
        to: string,
        data?: string | undefined,
      ) => Promise<DecodedTransaction[]>,
      _proposalLoaded: OnProposalLoaded,
    ) => {
      if (!_strategyType || !_azoriusContract || !_provider) {
        return;
      }

      const proposalCreatedFilter = _azoriusContract.filters.ProposalCreated();
      const proposalCreatedEvents = (
        await _azoriusContract.queryFilter(proposalCreatedFilter)
      ).reverse();

      action.dispatch({
        type: FractalGovernanceAction.SET_ALL_PROPOSALS_LOADED,
        payload: false,
      });

      action.dispatch({
        type: FractalGovernanceAction.SET_LOADING_FIRST_PROPOSAL,
        payload: true,
      });

      const completeOneProposalLoadProcess = (proposal: AzoriusProposal) => {
        if (currentAzoriusAddress.current !== azoriusContractAddress) {
          // The DAO has changed, don't load the just-fetched proposal,
          // into state, and get out of this function completely.
          return;
        }

        _proposalLoaded(proposal);

        action.dispatch({
          type: FractalGovernanceAction.SET_LOADING_FIRST_PROPOSAL,
          payload: false,
        });
      };

      const parseProposalMetadata = (metadata: string): CreateProposalMetadata => {
        try {
          const createProposalMetadata: CreateProposalMetadata = JSON.parse(metadata);
          return createProposalMetadata;
        } catch {
          logError('Unable to parse proposal metadata.', 'metadata:', metadata);
          return {
            title: t('metadataFailedParsePlaceholder'),
            description: '',
          };
        }
      };

      for (const proposalCreatedEvent of proposalCreatedEvents) {
        if (
          // oops
          network.chain.id === 1 && // mainnet
          azoriusContract?.address === '0x61BC890acf131f8dbd9C1DF8638b3c333dc1c6eC' && // decent dao's azorius
          proposalCreatedEvent.args[1].eq(0) // proposal id 0
        ) {
          // skip
          action.dispatch({
            type: FractalGovernanceAction.SKIPPED_A_PROPOSAL,
            payload: null,
          });
          continue;
        }

        const cachedProposal = getValue({
          cacheName: CacheKeys.PROPOSAL_CACHE,
          proposalId: proposalCreatedEvent.args.proposalId.toString(),
          contractAddress: getAddress(_azoriusContract.address),
        });

        if (cachedProposal) {
          completeOneProposalLoadProcess(cachedProposal);
          continue;
        }

        let proposalData;

        if (proposalCreatedEvent.args.metadata) {
          const metadataEvent = parseProposalMetadata(proposalCreatedEvent.args.metadata);

          try {
            const decodedTransactions = await decodeTransactions(
              _decode,
              proposalCreatedEvent.args.transactions.map(tx => ({
                ...tx,
                to: getAddress(tx.to),
                // @dev if decodeTransactions worked - we can be certain that this is Hex so type casting should be save.
                // Also this will change and this casting won't be needed after migrating to viem's getContract
                data: tx.data as Hex,
                value: tx.value.toBigInt(),
              })),
            );
            proposalData = {
              metaData: {
                title: metadataEvent.title,
                description: metadataEvent.description,
                documentationUrl: metadataEvent.documentationUrl,
              },
              transactions: proposalCreatedEvent.args.transactions.map(tx => ({
                ...tx,
                to: getAddress(tx.to),
                value: tx.value.toBigInt(),
                data: tx.data as Hex, // @dev Same here
              })),
              decodedTransactions,
            };
          } catch {
            logError(
              'Unable to parse proposal transactions.',
              'transactions:',
              proposalCreatedEvent.args.transactions,
            );
          }
        }

        const proposal = await mapProposalCreatedEventToProposal(
          proposalCreatedEvent,
          _erc20StrategyContract,
          _erc721StrategyContract,
          _strategyType,
          proposalCreatedEvent.args.proposalId.toBigInt(),
          proposalCreatedEvent.args.proposer,
          _azoriusContract,
          _provider,
          _erc20VotedEvents,
          _erc721VotedEvents,
          _executedEvents,
          proposalData,
        );

        completeOneProposalLoadProcess(proposal);

        const isProposalFossilized =
          proposal.state === FractalProposalState.CLOSED ||
          proposal.state === FractalProposalState.EXECUTED ||
          proposal.state === FractalProposalState.FAILED ||
          proposal.state === FractalProposalState.EXPIRED ||
          proposal.state === FractalProposalState.REJECTED;

        if (isProposalFossilized) {
          setValue(
            {
              cacheName: CacheKeys.PROPOSAL_CACHE,
              proposalId: proposalCreatedEvent.args.proposalId.toString(),
              contractAddress: getAddress(_azoriusContract.address),
            },
            proposal,
            CacheExpiry.NEVER,
          );
        }
      }

      // Just in case there are no `proposalCreatedEvent`s, we still need to set the loading state to false.
      action.dispatch({
        type: FractalGovernanceAction.SET_LOADING_FIRST_PROPOSAL,
        payload: false,
      });

      action.dispatch({
        type: FractalGovernanceAction.SET_ALL_PROPOSALS_LOADED,
        payload: true,
      });
    },
    [action, azoriusContract?.address, azoriusContractAddress, network.chain.id, t],
  );

  return (proposalLoaded: OnProposalLoaded) =>
    loadAzoriusProposals(
      azoriusContract,
      erc20StrategyContract,
      erc721StrategyContract,
      strategyType,
      erc20VotedEvents,
      erc721VotedEvents,
      executedEvents,
      provider,
      decode,
      proposalLoaded,
    );
};
