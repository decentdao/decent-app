// @todo this file, and the types defined here, should be replaced with decent-sdk package once it's ready

import axios, { AxiosResponse } from 'axios';
import { Address, Hex } from 'viem';
import { logError } from '../../helpers/errorLogging';
import { RevenueSharingWallet } from '../../types/revShare';

const DECENT_API_URL = import.meta.env.VITE_APP_DECENT_API_URL;

const axiosClient = axios.create({ baseURL: DECENT_API_URL });

type SubDaoInfo = {
  address: Address;
  name: string | null;
  isAzorius: boolean;
  subDaos: SubDaoInfo[];
};

type DAOBasic = {
  name: string;
  address: Address;
  safe: {
    nonce: number;
    threshold: number;
    owners: Address[];
  };
  chainId: number;
  snapshotENS: string | null;
  parentAddress: Address | null;
  proposalTemplatesCID: string;
  governanceModules: {
    address: Address;
    type: 'AZORIUS' | 'FRACTAL';
    executionPeriod: number | null;
    timelockPeriod: number | null;
    strategies: {
      address: Address;
      version: number;
      requiredProposerWeight: number | null;
      votingPeriod: number | null;
      basisNumerator: number | null;
      quorumNumerator: number | null;
      votingTokens: {
        address: Address;
        type: 'ERC20' | 'ERC721';
        weight: number | undefined;
      }[];
    }[];
  }[];
  governanceGuard: {
    address: Address;
    executionPeriod: number | null;
    timelockPeriod: number | null;
    freezeVotingStrategy: {
      address: Address;
      freezePeriod: number | null;
      freezeProposalPeriod: number | null;
      freezeVotesThreshold: number | null;
      freezeVoteType: string | null;
    } | null;
  } | null;
  roles: {
    terms:
      | {
          active: boolean;
          wearerAddress: Address | null;
          eligibility: Address;
          termEnd: number;
        }[]
      | undefined;
    daoChainId: number;
    daoAddress: Address;
    hatId: string;
    detailsCID: string | null;
    wearerAddress: Address | null;
    eligibility: Address | null;
  }[];
  creatorAddress: Address | null;
  createdAt: number;
  updatedAt: number | null;
  subDaos: SubDaoInfo[];
};

type Token = {
  address: Address;
  symbol: string;
  name: string;
  balance: string;
  decimals: number;
};

type DAOWithTokens = DAOBasic & {
  token: Token;
  stakedToken?: Token;
};

type DAOQueryResponse = {
  success: boolean;
  data: DAOBasic[];
};

export async function queryDaosByName(name: string) {
  const response: AxiosResponse<DAOQueryResponse> = await axiosClient.get('/d', {
    params: { name },
  });
  return response.data.data;
}

export async function getDaoData(chainId: number, daoAddress: Address) {
  const response: AxiosResponse<{ success: boolean; data: DAOWithTokens }> = await axiosClient.get(
    `/d/${chainId}/${daoAddress}`,
  );

  if (!response.data.success) {
    return null;
  }

  return response.data.data;
}

export async function getDaoRevenueSharingWallets(
  chainId: number,
  daoAddress: Address,
): Promise<RevenueSharingWallet[]> {
  try {
    const response: AxiosResponse<{
      success: boolean;
      data: {
        name: string;
        address: Address;
        tokens: Address[];
        splits: { address: Address; percentage: number }[];
      }[];
    }> = await axiosClient.get(`/d/${chainId}/${daoAddress}/splits`);

    if (!response.data.success) {
      return [];
    }

    return response.data.data;
  } catch (e) {
    // if status is 404, return empty array
    if (axios.isAxiosError(e) && e.response?.status === 404) {
      return [];
    }
    logError(e);
    return [];
  }
}

type ProposalTransaction = {
  to: Address;
  value: string;
  data: Hex;
  operation: number;
};

type DAOProposal = {
  id: number;
  title: string;
  description: string;
  proposer: Address;
  votingStrategyAddress: Address;
  transactions: ProposalTransaction[];
  proposedTxHash: string;
  executedTxHash: string | null;
  createdAt: number;
};

export async function getDaoProposals(chainId: number, daoAddress: Address) {
  try {
    const response: AxiosResponse<{
      success: boolean;
      data: DAOProposal[];
    }> = await axiosClient.get(`/d/${chainId}/${daoAddress}/proposals`);

    if (!response.data.success) {
      return [];
    }

    return response.data.data;
  } catch (e) {
    logError(e);
    return [];
  }
}

export async function syncAllSafeProposals(chainId: number, daoAddress: Address) {
  try {
    const response: AxiosResponse<{
      success: boolean;
      data: {
        daoChainId: number;
        daoAddress: Address;
        safeTxHash: string;
        title: string;
        description: string;
        safeNonce: number;
      }[];
    }> = await axiosClient.post(`/d/${chainId}/${daoAddress}/safe-proposals`);

    if (!response.data.success) {
      return [];
    }

    return response.data.data;
  } catch (e) {
    // if status is 404, return empty array
    if (axios.isAxiosError(e) && e.response?.status === 404) {
      return [];
    }
    logError(e);
    return [];
  }
}
