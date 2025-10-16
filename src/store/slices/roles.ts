import { Tree } from '@hatsprotocol/sdk-v1-subgraph';
import { getContract, Hex, PublicClient } from 'viem';
import { StateCreator } from 'zustand';
import { SablierV2LockupLinearAbi } from '../../assets/abi/SablierV2Lockup';
import { convertStreamIdToBigInt } from '../../hooks/streams/useCreateSablierStream';
import { DAOKey } from '../../types';
import { DecentRoleHat, DecentTree, RolesStoreData, SablierPayment } from '../../types/roles';
import { sanitize } from '../roles/rolesStoreUtils';
import { GlobalStore, StoreMiddleware, StoreSlice } from '../store';

// Per-DAO stream map to avoid data leakage across DAOs (not persisted)
const streamIdToHatIdMapByDao = new Map<DAOKey, Map<string, BigInt>>();
const getOrCreateDaoStreamMap = (daoKey: DAOKey) => {
  let m = streamIdToHatIdMapByDao.get(daoKey);
  if (!m) {
    m = new Map<string, BigInt>();
    streamIdToHatIdMapByDao.set(daoKey, m);
  }
  return m;
};
const getStreamEntries = (daoKey: DAOKey) =>
  Array.from(getOrCreateDaoStreamMap(daoKey).entries()).map(([streamId, hatId]) => ({
    streamId,
    hatId,
  }));

export type RolesPerDao = Omit<RolesStoreData, 'hatsTreeId'> & {
  hatsTreeId: number | null | undefined;
};

export const EMPTY_ROLES: RolesPerDao = {
  hatsTreeId: undefined,
  hatsTree: undefined,
  streamsFetched: false,
  contextChainId: null,
};

export type RolesSlice = {
  roles: StoreSlice<RolesPerDao>;
  getRoles: (daoKey: DAOKey) => RolesPerDao;
  getHat: (daoKey: DAOKey, hatId: Hex) => DecentRoleHat | null;
  getPayment: (daoKey: DAOKey, hatId: Hex, streamId: string) => SablierPayment | null;
  setHatKeyValuePairData: (
    daoKey: DAOKey,
    args: {
      contextChainId: number | null;
      hatsTreeId?: number | null;
      streamIdsToHatIds: { hatId: BigInt; streamId: string }[];
    },
  ) => void;
  setHatsTree: (
    daoKey: DAOKey,
    params: {
      hatsTree: Tree | null | undefined;
      chainId: bigint;
      hatsProtocol: `0x${string}`;
      erc6551Registry: `0x${string}`;
      hatsAccountImplementation: `0x${string}`;
      hatsElectionsImplementation: `0x${string}`;
      publicClient: PublicClient;
      sablierSubgraphClient: any; // Client from urql, keeping loose here to avoid cross-import
      whitelistingVotingStrategy?: `0x${string}`;
    },
  ) => Promise<void>;
  refreshWithdrawableAmount: (
    daoKey: DAOKey,
    hatId: Hex,
    streamId: string,
    publicClient: PublicClient,
  ) => Promise<void>;
  updateCurrentTermStatus: (daoKey: DAOKey, hatId: Hex, termStatus: 'active' | 'inactive') => void;
  resetRoles: (daoKey: DAOKey) => void;
};

export const createRolesSlice: StateCreator<GlobalStore, StoreMiddleware, [], RolesSlice> = (
  set,
  get,
) => ({
  roles: {},

  getRoles: daoKey => get().roles[daoKey] || EMPTY_ROLES,

  getHat: (daoKey, hatId) => {
    const hatsTree = get().roles[daoKey]?.hatsTree;
    const matches = hatsTree?.roleHats.filter((h: DecentRoleHat) => h.id === hatId);
    if (!matches || matches.length === 0) return null;
    if (matches.length > 1) throw new Error('multiple hats with the same ID');
    return matches[0];
  },

  getPayment: (daoKey, hatId, streamId) => {
    const hat = get().getHat(daoKey, hatId);
    if (!hat) return null;
    const matches = hat.payments.filter((p: SablierPayment) => p.streamId === streamId);
    if (matches.length === 0) return null;
    if (matches.length > 1) throw new Error('multiple payments with the same ID');
    return matches[0];
  },

  setHatKeyValuePairData: (daoKey, args) => {
    const { hatsTreeId, contextChainId, streamIdsToHatIds } = args;
    const daoStreamMap = getOrCreateDaoStreamMap(daoKey);
    for (const { hatId, streamId } of streamIdsToHatIds) {
      daoStreamMap.set(streamId, hatId);
    }

    set(
      state => {
        if (hatsTreeId === undefined) {
          state.roles[daoKey] = { ...EMPTY_ROLES };
          return;
        }
        if (hatsTreeId === null) {
          const prev = state.roles[daoKey] || EMPTY_ROLES;
          state.roles[daoKey] = {
            ...prev,
            hatsTree: null,
            contextChainId,
            streamsFetched: false,
            // leave hatsTreeId as-is (undefined)
          };
          return;
        }
        const prev = state.roles[daoKey] || EMPTY_ROLES;
        state.roles[daoKey] = {
          ...prev,
          hatsTreeId,
          contextChainId,
          streamsFetched: false,
        };
      },
      false,
      'roles/setHatKeyValuePairData',
    );
  },

  setHatsTree: async (daoKey, params) => {
    const hatsTree = await sanitize(
      params.hatsTree,
      params.hatsAccountImplementation as any,
      params.hatsElectionsImplementation as any,
      params.erc6551Registry as any,
      params.hatsProtocol as any,
      params.chainId,
      params.publicClient,
      params.sablierSubgraphClient,
      params.whitelistingVotingStrategy as any,
    );

    const streamIdsToHatIdsMap = getStreamEntries(daoKey);

    let sanitizedTree = hatsTree as DecentTree | null | undefined;
    if (sanitizedTree) {
      sanitizedTree = {
        ...sanitizedTree,
        roleHats: sanitizedTree.roleHats.map(roleHat => {
          const filteredStreamIds = streamIdsToHatIdsMap
            .filter(ids => ids.hatId === BigInt(roleHat.id))
            .map(ids => ids.streamId);
          return {
            ...roleHat,
            payments: roleHat.isTermed
              ? roleHat.payments.filter(payment => filteredStreamIds.includes(payment.streamId))
              : roleHat.payments,
          };
        }),
      };
    }

    set(
      state => {
        const prev = state.roles[daoKey] || EMPTY_ROLES;
        state.roles[daoKey] = {
          ...prev,
          hatsTree: sanitizedTree,
        };
      },
      false,
      'roles/setHatsTree',
    );
  },

  refreshWithdrawableAmount: async (daoKey, hatId, streamId, publicClient) => {
    const payment = get().getPayment(daoKey, hatId, streamId);
    if (!payment) return;

    const streamContract = getContract({
      abi: SablierV2LockupLinearAbi,
      address: payment.contractAddress,
      client: publicClient,
    });

    const bigintStreamId = convertStreamIdToBigInt(streamId);
    const newWithdrawableAmount = await streamContract.read.withdrawableAmountOf([bigintStreamId]);
    const currentHatsTree = get().roles[daoKey]?.hatsTree;
    if (!currentHatsTree) return;

    set(
      state => {
        const prev = state.roles[daoKey] || EMPTY_ROLES;
        state.roles[daoKey] = {
          ...prev,
          hatsTree: {
            ...currentHatsTree,
            roleHats: currentHatsTree.roleHats.map(roleHat => {
              if (roleHat.id !== hatId) return roleHat;
              return {
                ...roleHat,
                payments: roleHat.payments.map(p =>
                  p.streamId === streamId ? { ...p, withdrawableAmount: newWithdrawableAmount } : p,
                ),
              };
            }),
          },
        };
      },
      false,
      'roles/refreshWithdrawableAmount',
    );
  },

  updateCurrentTermStatus: (daoKey, hatId, termStatus) => {
    const currentHatsTree = get().roles[daoKey]?.hatsTree;
    if (!currentHatsTree) return;

    set(
      state => {
        const prev = state.roles[daoKey] || EMPTY_ROLES;
        state.roles[daoKey] = {
          ...prev,
          hatsTree: {
            ...currentHatsTree,
            roleHats: currentHatsTree.roleHats.map(roleHat => {
              if (roleHat.id !== hatId) return roleHat;
              return {
                ...roleHat,
                roleTerms: {
                  ...roleHat.roleTerms,
                  currentTerm: roleHat.roleTerms.currentTerm
                    ? {
                        ...roleHat.roleTerms.currentTerm,
                        isActive: termStatus === 'active',
                      }
                    : undefined,
                },
              };
            }),
          },
        };
      },
      false,
      'roles/updateCurrentTermStatus',
    );
  },

  resetRoles: daoKey =>
    set(
      state => {
        const prev = state.roles[daoKey] || EMPTY_ROLES;
        state.roles[daoKey] = {
          ...EMPTY_ROLES,
          hatsTreeId: prev.hatsTreeId,
          contextChainId: prev.contextChainId,
        };
      },
      false,
      'roles/resetRoles',
    ),
});
