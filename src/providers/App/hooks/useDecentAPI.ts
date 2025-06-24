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
