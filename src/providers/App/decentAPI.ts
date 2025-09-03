// @todo this file, and the types defined here, should be replaced with decent-sdk package once it's ready

import axios, { AxiosResponse } from 'axios';
import { Address } from 'viem';
import { logError } from '../../helpers/errorLogging';
import { RevenueSharingWallet } from '../../types/revShare';

const DECENT_API_URL = import.meta.env.VITE_APP_DECENT_API_URL;

const axiosClient = axios.create({ baseURL: DECENT_API_URL });

interface GovernanceModule {
  address: Address;
  type: 'AZORIUS' | 'FRACTAL';
}

interface DAOBasic {
  name: string;
  address: Address;
  chainId: number;
  snapshotENS: string | null;
  parentAddress: Address | null;
  proposalTemplatesCID: string;
  governanceModules: GovernanceModule[];
}

interface Token {
  address: Address;
  symbol: string;
  name: string;
  balance: string;
  decimals: number;
}

interface DAOWithTokens extends DAOBasic {
  token: Token;
  stakedToken?: Token;
}

interface DAOQueryResponse {
  success: boolean;
  data: DAOBasic[];
}

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
    return {
      parentAddress: null,
      childAddresses: [],
      name: null,
      snapshotENS: null,
      proposalTemplatesCID: null,
      governanceModules: [],
    };
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
