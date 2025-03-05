import SafeApiKit, {
  AllTransactionsListResponse,
  AllTransactionsOptions,
  ProposeTransactionProps,
  SafeInfoResponse,
  SafeMultisigTransactionListResponse,
  SignatureResponse,
  TokenInfoResponse,
} from '@safe-global/api-kit';
import axios from 'axios';
import { useMemo } from 'react';
import {
  Address,
  createPublicClient,
  erc20Abi,
  getAddress,
  http,
  PublicClient,
  zeroAddress,
} from 'viem';
import GnosisSafeL2Abi from '../../../assets/abi/GnosisSafeL2';
import { SENTINEL_ADDRESS } from '../../../constants/common';
import { SafeWithNextNonce } from '../../../types';
import { NetworkConfig } from '../../../types/network';
import { useNetworkConfigStore } from '../../NetworkConfig/useNetworkConfigStore';

class EnhancedSafeApiKit extends SafeApiKit {
  readonly publicClient: PublicClient;
  readonly networkConfig: NetworkConfig;
  readonly safeClientUrlPrefix: string;

  // holds requests that have yet to return, to avoid calling the same
  // endpoint more than once
  requestMap = new Map<string, Promise<any> | null>();

  // # Safe API function calls
  //
  // - overridden functions
  //   - getSafeInfo ✅
  //   - getAllTransactions 🟨 ENG-292
  //   - getNextNonce 🟨 ENG-293
  //   - getToken ✅
  //   - confirmTransaction 🟨 ENG-294
  //   - getMultisigTransactions 🟨 ENG-295
  //   - proposeTransaction 🟨 ENG-296
  //   - decodeData 🟨 ENG-297
  // - custom functions
  //   - getSafeData ✅ (this is actually not an overriden function of SafeApiKit, but a custom function)

  // other file todos:
  //   - /multisig-transactions/ in useSubmitProposal.ts
  //   - /data-decoder/ in useSafeDecoder.ts

  constructor(networkConfig: NetworkConfig) {
    super({
      chainId: BigInt(networkConfig.chain.id),
      txServiceUrl: `${networkConfig.safeBaseURL}/api`,
    });
    this.networkConfig = networkConfig;
    this.publicClient = createPublicClient({
      chain: networkConfig.chain,
      transport: http(networkConfig.rpcEndpoint),
    });
    this.safeClientUrlPrefix = `https://safe-client.safe.global/v1/chains/${networkConfig.chain.id}/safes/`;
  }

  override async getSafeInfo(safeAddress: Address): Promise<SafeInfoResponse> {
    const checksummedSafeAddress = getAddress(safeAddress);

    try {
      return await super.getSafeInfo(checksummedSafeAddress);
    } catch (error) {
      console.error('Error fetching getSafeInfo from safeAPI:', error);
    }

    try {
      // Fetch necessary details from the contract
      const [nonce, threshold, modules, owners, version] = await this.publicClient.multicall({
        contracts: [
          {
            abi: GnosisSafeL2Abi,
            address: checksummedSafeAddress,
            functionName: 'nonce',
          },
          {
            abi: GnosisSafeL2Abi,
            address: checksummedSafeAddress,
            functionName: 'getThreshold',
          },
          {
            abi: GnosisSafeL2Abi,
            address: checksummedSafeAddress,
            functionName: 'getModulesPaginated',
            args: [SENTINEL_ADDRESS, 10n],
          },
          {
            abi: GnosisSafeL2Abi,
            address: checksummedSafeAddress,
            functionName: 'getOwners',
          },
          {
            abi: GnosisSafeL2Abi,
            address: checksummedSafeAddress,
            functionName: 'VERSION',
          },
        ],
        allowFailure: false,
      });

      // Fetch guard using getStorageAt
      const GUARD_STORAGE_SLOT = '0x3a'; // Slot defined in Safe contracts (could vary)
      const guardStorageValue = await this.publicClient.getStorageAt({
        address: checksummedSafeAddress,
        slot: GUARD_STORAGE_SLOT,
      });

      return {
        address: checksummedSafeAddress,
        nonce: Number(nonce ? nonce : 0),
        threshold: Number(threshold ? threshold : 0),
        owners: owners as string[],
        modules: [...modules[0], modules[1]],
        fallbackHandler: zeroAddress, // not used
        guard: guardStorageValue ? getAddress(`0x${guardStorageValue.slice(-40)}`) : zeroAddress,
        version: version,
        singleton: zeroAddress, // not used
      };
    } catch (error) {
      console.error('Error fetching getSafeInfo from contract:', error);
    }

    throw new Error('Failed to getSafeInfo()');
  }

  private async _safeClientGet(safeAddress: Address, path: string): Promise<any> {
    const value = await axios.get(`${this.safeClientUrlPrefix}${safeAddress}${path}`, {
      headers: {
        accept: 'application/json',
      },
    });

    return value.data;
  }

  /*
  TODO: Handle the request body
  private async _safeClientPost(safeAddress: Address, path: string, data: string): Promise<any> {
    const value = await axios.post(`${this.safeClientUrlPrefix}${safeAddress}${path}`, {
      headers: {
        accept: 'application/json',
      },
      body: data,
    });

    return value.data;
  }
    */

  override async getAllTransactions(
    safeAddress: Address,
    options?: AllTransactionsOptions,
  ): Promise<AllTransactionsListResponse> {
    try {
      return await super.getAllTransactions(safeAddress, options);
    } catch (error) {
      console.error('Error fetching getAllTransactions from safeAPI:', error);
    }

    try {
      // TODO ENG-292
      // implement safe-client fallback
    } catch (error) {
      console.error('Error fetching getAllTransactions from safe-client:', error);
    }

    return {
      count: 0,
      results: [],
    };
  }

  override async getNextNonce(safeAddress: Address): Promise<number> {
    try {
      return await super.getNextNonce(safeAddress);
    } catch (error) {
      console.error('Error fetching getNextNonce from safeAPI:', error);
    }

    try {
      type SafeClientNonceResponse = {
        readonly currentNonce: number;
        readonly recommendedNonce: number;
      };

      const response: SafeClientNonceResponse = await this._safeClientGet(safeAddress, '/nonces');

      return response.recommendedNonce;
    } catch (error) {
      console.error('Error fetching getNextNonce from safe-client:', error);
    }

    try {
      const nonce = await this.publicClient.readContract({
        address: safeAddress,
        abi: GnosisSafeL2Abi,
        functionName: 'nonce',
      });

      return Number(nonce.toString());
    } catch (error) {
      console.error('Error fetching getNextNonce from contract:', error);
    }

    throw new Error('Failed to getNextNonce()');
  }

  override async getToken(tokenAddress: Address): Promise<TokenInfoResponse> {
    try {
      return await super.getToken(tokenAddress);
    } catch (error) {
      console.error('Error fetching getToken from safeAPI:', error);

      const [name, symbol, decimals] = await this.publicClient.multicall({
        contracts: [
          { address: tokenAddress, abi: erc20Abi, functionName: 'name' },
          { address: tokenAddress, abi: erc20Abi, functionName: 'symbol' },
          { address: tokenAddress, abi: erc20Abi, functionName: 'decimals' },
        ],
        allowFailure: false,
      });

      return {
        address: tokenAddress,
        name,
        symbol,
        decimals,
      };
    }
  }

  override async confirmTransaction(
    safeTxHash: string,
    signature: string,
  ): Promise<SignatureResponse> {
    try {
      return await super.confirmTransaction(safeTxHash, signature);
    } catch (error) {
      console.error('Error posting confirmTransaction from safeAPI:', error);
    }

    try {
      // TODO ENG-294
      // implement safe-client fallback
    } catch (error) {
      console.error('Error posting confirmTransaction from safe-client:', error);
    }

    // Note: because Safe requires all necessary signatures to be provided
    // at the time of the transaction, we can't implement an onchain fallback here.

    throw new Error('Failed to confirmTransaction()');
  }

  override async getMultisigTransactions(
    safeAddress: Address,
  ): Promise<SafeMultisigTransactionListResponse> {
    try {
      return await super.getMultisigTransactions(safeAddress);
    } catch (error) {
      console.error('Error fetching getMultisigTransactions from safeAPI:', error);
    }

    try {
      // TODO ENG-295
      // implement safe-client fallback
    } catch (error) {
      console.error('Error fetching getMultisigTransactions from safe-client:', error);
    }

    throw new Error('Failed to getMultisigTransactions()');
  }

  override async proposeTransaction({
    safeAddress,
    safeTransactionData,
    safeTxHash,
    senderAddress,
    senderSignature,
    origin,
  }: ProposeTransactionProps): Promise<void> {
    try {
      return await super.proposeTransaction({
        safeAddress,
        safeTransactionData,
        safeTxHash,
        senderAddress,
        senderSignature,
        origin,
      });
    } catch (error) {
      console.error('Error posting proposeTransaction from safeAPI:', error);
    }

    try {
      // TODO ENG-29
      // implement safe-client fallback
      // transactions/{address}/propose
    } catch (error) {
      console.error('Error posting proposeTransaction from safe-client:', error);
    }

    throw new Error('Failed to proposeTransaction()');
  }

  override async decodeData(data: string): Promise<any> {
    try {
      return await super.decodeData(data);
    } catch (error) {
      console.error('Error decoding data from safeAPI:', error);
    }

    try {
      // TODO ENG-297
      // implement safe-client fallback
      // /data-decoder/
    } catch (error) {
      console.error('Error decoding data from safe-client:', error);
    }

    throw new Error('Failed to decodeData()');
  }

  async getSafeData(safeAddress: Address): Promise<SafeWithNextNonce> {
    const checksummedSafeAddress = getAddress(safeAddress);
    const safeInfoResponse = await this.getSafeInfo(checksummedSafeAddress);
    const nextNonce = await this.getNextNonce(checksummedSafeAddress);
    return { ...safeInfoResponse, nextNonce };
  }
}

export function useSafeAPI() {
  const { getConfigByChainId, chain } = useNetworkConfigStore();
  const networkConfig = getConfigByChainId(chain.id);

  const safeAPI = useMemo(() => {
    return new EnhancedSafeApiKit(networkConfig);
  }, [networkConfig]);

  return safeAPI;
}

export function getSafeAPI(networkConfig: NetworkConfig) {
  return new EnhancedSafeApiKit(networkConfig);
}
