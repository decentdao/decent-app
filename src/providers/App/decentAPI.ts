// @todo this file, and the types defined here, should be replaced with decent-sdk package once it's ready

import axios, { AxiosResponse } from 'axios';
import { Address } from 'viem';
import { logError } from '../../helpers/errorLogging';
import { RevenueSharingWallet } from '../../types/revShare';

const DECENT_API_BASE_URL = 'https://api.decent.build';

const axiosClient = axios.create({ baseURL: DECENT_API_BASE_URL });

interface DAOBasic {
  name: string;
  address: Address;
  chainId: number;
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
