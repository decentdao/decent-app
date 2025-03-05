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
  readonly safeClientBaseUrl: string;
  readonly safeClientSafesPrefix: string;
  readonly safeClientTransactionsPrefix: string;

  // holds requests that have yet to return, to avoid calling the same
  // endpoint more than once
  requestMap = new Map<string, Promise<any> | null>();

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
    this.safeClientBaseUrl = `https://safe-client.safe.global/v1/chains/${networkConfig.chain.id}`;
    this.safeClientSafesPrefix = `${this.safeClientBaseUrl}/safes/`;
    this.safeClientTransactionsPrefix = `${this.safeClientBaseUrl}/transactions/`;
  }

  private async _safeClientGet<T>(safeAddress: string, path: string): Promise<T> {
    const url = `${this.safeClientSafesPrefix}${safeAddress}${path}`;
    const value = await axios.get<T>(url, {
      headers: {
        accept: 'application/json',
      },
    });

    return value.data;
  }

  private async _safeTransactionsPost(safeAddress: string, path: string, data: any) {
    const url = `${this.safeClientTransactionsPrefix}${safeAddress}${path}`;
    await axios.post(url, data, {
      headers: {
        accept: 'application/json',
      },
    });
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

      const response = await this._safeClientGet<SafeClientNonceResponse>(safeAddress, '/nonces');

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
      const body = {
        signature: signature,
      };
      await this._safeTransactionsPost(safeTxHash, '/confirmations', body);

      // The Safe Client returns a different response, but in keeping in line with the interface of
      // Safe Transaction Service, we return the signature as is.
      return { signature };
    } catch (error) {
      console.error('Error posting confirmTransaction from safe-client:', error);
    }

    // Note: because Safe requires all necessary signatures to be provided
    // at the time of the transaction, we can't implement an onchain fallback here.
    //
    // Note2: is this correct? What about the "approveHash" function?
    // https://github.com/safe-global/safe-smart-account/blob/186a21a74b327f17fc41217a927dea7064f74604/contracts/GnosisSafe.sol#L333C14-L333C25

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

    // /multisig-transactions/raw response matches SafeMultisigTransactionListResponse
    try {
      const response = await this._safeClientGet<SafeMultisigTransactionListResponse>(
        safeAddress,
        '/multisig-transactions/raw',
      );

      return response;
    } catch (error) {
      console.error('Error fetching getMultisigTransactions from safe-client:', error);
    }

    // We need to return *something* here, else stuff breaks downstream
    return {
      count: 0,
      results: [],
    };
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
      const body = {
        to: safeTransactionData.to,
        value: safeTransactionData.value,
        data: safeTransactionData.data,
        nonce: `${safeTransactionData.nonce}`,
        operation: safeTransactionData.operation,
        safeTxGas: safeTransactionData.safeTxGas,
        baseGas: safeTransactionData.baseGas,
        gasPrice: safeTransactionData.gasPrice,
        gasToken: safeTransactionData.gasToken,
        refundReceiver: safeTransactionData.refundReceiver,
        safeTxHash: safeTxHash,
        sender: senderAddress,
        signature: senderSignature,
        origin: origin,
      };
      return await this._safeTransactionsPost(safeAddress, '/propose', body);
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
      const body = {
        data: data,
      };
      const value = await axios.post<any>(`${this.safeClientBaseUrl}/data-decoder`, body, {
        headers: {
          accept: 'application/json',
        },
      });

      return value.data;
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
  const networkConfig = useNetworkConfigStore();

  const safeAPI = useMemo(() => {
    return new EnhancedSafeApiKit(networkConfig);
  }, [networkConfig]);

  return safeAPI;
}

export function getSafeAPI(networkConfig: NetworkConfig) {
  return new EnhancedSafeApiKit(networkConfig);
}
