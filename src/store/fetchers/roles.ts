import { Tree } from '@hatsprotocol/sdk-v1-subgraph';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { createSablierSubgraphClient } from '../../graphql';
import { hatsSubgraphClient } from '../../graphql/hats';
import useNetworkPublicClient from '../../hooks/useNetworkPublicClient';
import { CacheExpiry, CacheKeys } from '../../hooks/utils/cache/cacheDefaults';
import { getValue, setValue } from '../../hooks/utils/cache/useLocalStorage';
import useIPFSClient from '../../providers/App/hooks/useIPFSClient';
import { useNetworkConfigStore } from '../../providers/NetworkConfig/useNetworkConfigStore';
import { DAOKey } from '../../types';
import { useGlobalStore } from '../store';

export const useRolesFetcher = () => {
  const { t } = useTranslation('roles');
  const { chain, getConfigByChainId, contracts } = useNetworkConfigStore();
  const publicClient = useNetworkPublicClient();
  const ipfsClient = useIPFSClient();
  const { setHatsTree } = useGlobalStore();

  const fetchDAORoles = useCallback(
    async ({
      daoKey,
      hatsTreeId,
      contextChainId,
      whitelistingVotingStrategy,
    }: {
      daoKey: DAOKey;
      hatsTreeId: number | null | undefined;
      contextChainId: number;
      whitelistingVotingStrategy?: `0x${string}`;
    }) => {
      try {
        const config = getConfigByChainId(chain.id);
        const sablierSubgraphClient = createSablierSubgraphClient(config);

        if (hatsTreeId === null || hatsTreeId === undefined) {
          await setHatsTree(daoKey, {
            hatsTree: null,
            chainId: BigInt(contextChainId),
            hatsProtocol: contracts.hatsProtocol,
            erc6551Registry: contracts.erc6551Registry,
            hatsAccountImplementation: contracts.hatsAccount1ofNMasterCopy,
            hatsElectionsImplementation: contracts.hatsElectionsEligibilityMasterCopy,
            publicClient,
            sablierSubgraphClient,
          });
          return;
        }

        const tree = await hatsSubgraphClient.getTree({
          chainId: contextChainId,
          treeId: hatsTreeId,
          props: {
            hats: {
              props: {
                prettyId: true,
                status: true,
                details: true,
                eligibility: true,
                wearers: { props: {} },
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
              chainId: contextChainId,
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

        await setHatsTree(daoKey, {
          hatsTree: treeWithFetchedDetails,
          chainId: BigInt(contextChainId),
          hatsProtocol: contracts.hatsProtocol,
          erc6551Registry: contracts.erc6551Registry,
          hatsAccountImplementation: contracts.hatsAccount1ofNMasterCopy,
          hatsElectionsImplementation: contracts.hatsElectionsEligibilityMasterCopy,
          publicClient,
          whitelistingVotingStrategy,
          sablierSubgraphClient,
        });
      } catch (e) {
        const config = getConfigByChainId(chain.id);
        const sablierSubgraphClient = createSablierSubgraphClient(config);
        await setHatsTree(daoKey, {
          hatsTree: null,
          chainId: BigInt(contextChainId),
          hatsProtocol: contracts.hatsProtocol,
          erc6551Registry: contracts.erc6551Registry,
          hatsAccountImplementation: contracts.hatsAccount1ofNMasterCopy,
          hatsElectionsImplementation: contracts.hatsElectionsEligibilityMasterCopy,
          publicClient,
          sablierSubgraphClient,
        });
        const message = t('invalidHatsTreeIdMessage');
        toast.error(message);
        // eslint-disable-next-line no-console
        console.error(e, {
          message,
          args: { network: contextChainId, hatsTreeId },
        });
      }
    },
    [chain.id, contracts, getConfigByChainId, ipfsClient, publicClient, setHatsTree, t],
  );

  return { fetchDAORoles };
};
