import axios, { AxiosResponse } from 'axios';
import { Address } from 'viem';
import { StakingTokenData } from '../../../types/revenueSharing';

const DECENT_API_BASE_URL = 'https://api.decent.build';

const axiosClient = axios.create({ baseURL: DECENT_API_BASE_URL });

interface DAO {
  name: string;
  address: Address;
  chainId: number;
}

interface DAOQueryResponse {
  success: boolean;
  data: DAO[];
}

// @todo this file should be replaced with decent-sdk package once it's ready
export async function queryDaosByName(name: string) {
  const response: AxiosResponse<DAOQueryResponse> = await axiosClient.get('/d', {
    params: { name },
  });
  return response.data.data;
}

export interface DAOSplitWallet {
  address: Address;
  name: string;
  splits: {
    address: Address;
    percentage: number;
  }[];
}

interface DAOSplitsQueryResponse {
  success: boolean;
  data: DAOSplitWallet[];
}

export async function getDaoSplits(
  chainId: number,
  daoAddress: Address,
): Promise<DAOSplitWallet[]> {
  const response: AxiosResponse<DAOSplitsQueryResponse> = await axiosClient.get(
    `/d/${chainId}/${daoAddress}/splits`,
  );

  if (!response.data.success) {
    throw new Error('Failed to fetch DAO splits');
  }

  return response.data.data;
}

interface TokenStakingDataResponse {
  success: boolean;
  data: StakingTokenData;
}

export async function getTokenStakingData(chainId: number, tokenAddress: Address) {
  const response: AxiosResponse<TokenStakingDataResponse> = await axiosClient.get(
    `/t/${chainId}/${tokenAddress}`,
  );
  return response.data;
}
