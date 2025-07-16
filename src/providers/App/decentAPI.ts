// @todo this file should be replaced with decent-sdk package once it's ready

import axios, { AxiosResponse } from 'axios';
import { Address } from 'viem';
import { RevenueSharingDaoData } from '../../types';
import { StakingTokenData } from '../../types/revenueSharing';

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

interface TokenStakingDataResponse {
  success: boolean;
  data: StakingTokenData;
}

interface RevenueSharingDataResponse {
  success: boolean;
  data: RevenueSharingDaoData;
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

export async function queryDaosByName(name: string) {
  const response: AxiosResponse<DAOQueryResponse> = await axiosClient.get('/d', {
    params: { name },
  });
  return response.data.data;
}

export async function getTokenStakingData(chainId: number, tokenAddress: Address) {
  const response: AxiosResponse<TokenStakingDataResponse> = await axiosClient.get(
    `/t/${chainId}/${tokenAddress}`,
  );
  return response.data;
}

export async function getDaoRevenueSharingData(chainId: number, daoAddress: Address) {
  const response: AxiosResponse<RevenueSharingDataResponse> = await axiosClient.get(
    `/d/${chainId}/${daoAddress}/splits`,
  );
  return response.data.data;
}
