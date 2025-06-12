import { HatsSubgraphClient, Tree } from '@hatsprotocol/sdk-v1-subgraph';
import { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { createSablierSubgraphClient } from '../../../graphql';
import { useDAOStore } from '../../../providers/App/AppProvider';
import useIPFSClient from '../../../providers/App/hooks/useIPFSClient';
import { useNetworkConfigStore } from '../../../providers/NetworkConfig/useNetworkConfigStore';
import { DecentHatsError } from '../../../store/roles/rolesStoreUtils';
import { useRolesStore } from '../../../store/roles/useRolesStore';
import useNetworkPublicClient from '../../useNetworkPublicClient';
import { CacheExpiry, CacheKeys } from '../../utils/cache/cacheDefaults';
import { getValue, setValue } from '../../utils/cache/useLocalStorage';
import { useCurrentDAOKey } from '../useCurrentDAOKey';

const hatsSubgraphClient = new HatsSubgraphClient({});

const useHatsTree = () => {
  const { t } = useTranslation('roles');
  const { daoKey } = useCurrentDAOKey();
  const {
    governanceContracts: {
      linearVotingErc20WithHatsWhitelistingAddress,
      linearVotingErc721WithHatsWhitelistingAddress,
      isLoaded: governanceContractsLoaded,
    },
  } = useDAOStore({ daoKey });
  const { hatsTreeId, contextChainId, setHatsTree, resetRoles } = useRolesStore();

  const ipfsClient = useIPFSClient();
  const {
    chain,
    getConfigByChainId,
    contracts: {
      hatsProtocol,
      erc6551Registry,
      hatsAccount1ofNMasterCopy: hatsAccountImplementation,
      hatsElectionsEligibilityMasterCopy: hatsElectionsImplementation,
    },
  } = useNetworkConfigStore();
  const publicClient = useNetworkPublicClient();

  const getHatsTree = useCallback(
    async (params: { hatsTreeId: number; contextChainId: number }) => {
      try {
        const tree = await hatsSubgraphClient.getTree({
          chainId: params.contextChainId,
          treeId: params.hatsTreeId,
          props: {
            hats: {
              props: {
                prettyId: true,
                status: true,
                details: true,
                eligibility: true,
                wearers: {
                  props: {},
                },
              },
            },
          },
        });

        const hatsWithFetchedDetails = await Promise.all(
          (tree.hats || []).map(async hat => {
            const ipfsPrefix = 'ipfs://';

            if (hat.details === undefined || !hat.details.startsWith(ipfsPrefix)) {
              return hat;
            }

            const hash = hat.details.split(ipfsPrefix)[1];
            const cacheKey = {
              cacheName: CacheKeys.IPFS_HASH,
              hash,
              chainId: params.contextChainId,
            } as const;

            const cachedDetails = getValue(cacheKey);

            if (cachedDetails) {
              return { ...hat, details: cachedDetails };
            }

            try {
              const detailsFromIpfs = await ipfsClient.cat(hash);
              const jsonStringDetails = JSON.stringify(detailsFromIpfs);
              setValue(cacheKey, jsonStringDetails, CacheExpiry.NEVER);
              return { ...hat, details: jsonStringDetails };
            } catch {
              return hat;
            }
          }),
        );

        const treeWithFetchedDetails: Tree = { ...tree, hats: hatsWithFetchedDetails };
        try {
          const config = getConfigByChainId(chain.id);
          const sablierSubgraphClient = createSablierSubgraphClient(config);
          await setHatsTree({
            hatsTree: treeWithFetchedDetails,
            chainId: BigInt(params.contextChainId),
            hatsProtocol,
            erc6551Registry,
            hatsAccountImplementation,
            hatsElectionsImplementation,
            publicClient,
            whitelistingVotingStrategy:
              linearVotingErc20WithHatsWhitelistingAddress ||
              linearVotingErc721WithHatsWhitelistingAddress,
            sablierSubgraphClient,
          });
        } catch (e) {
          if (e instanceof DecentHatsError) {
            toast.error(e.message);
          }
        }
      } catch (e) {
        const config = getConfigByChainId(chain.id);
        const sablierSubgraphClient = createSablierSubgraphClient(config);
        setHatsTree({
          hatsTree: null,
          chainId: BigInt(params.contextChainId),
          hatsProtocol,
          erc6551Registry,
          hatsAccountImplementation,
          hatsElectionsImplementation,
          publicClient,
          sablierSubgraphClient,
        });
        const message = t('invalidHatsTreeIdMessage');
        toast.error(message);
        console.error(e, {
          message,
          args: {
            network: params.contextChainId,
            hatsTreeId: params.hatsTreeId,
          },
        });
      }
    },
    [
      chain.id,
      getConfigByChainId,
      erc6551Registry,
      hatsAccountImplementation,
      hatsElectionsImplementation,
      hatsProtocol,
      ipfsClient,
      linearVotingErc20WithHatsWhitelistingAddress,
      linearVotingErc721WithHatsWhitelistingAddress,
      setHatsTree,
      publicClient,
      t,
    ],
  );

  useEffect(() => {
    // Whitelisting contracts might be not loaded yet which might lead to wrong permissions loading
    if (!governanceContractsLoaded) {
      return;
    }

    if (!daoKey || !hatsTreeId || !contextChainId) {
      resetRoles();
      return;
    }
    const hatsTreeIdValue = hatsTreeId[daoKey];
    // @dev for some reason `hatsTreeId` can stile be null or undefined
    if (hatsTreeIdValue === null || hatsTreeIdValue === undefined) {
      resetRoles();
      return;
    }
    getHatsTree({
      hatsTreeId: hatsTreeIdValue,
      contextChainId,
    });
  }, [contextChainId, getHatsTree, hatsTreeId, governanceContractsLoaded, daoKey, resetRoles]);
};

export { useHatsTree };
