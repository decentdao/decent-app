import SafeApiKit, {
  ProposeTransactionProps,
  SafeInfoResponse,
  SafeMultisigTransactionListResponse,
  SignatureResponse,
  TokenInfoResponse,
  TransferWithTokenInfoResponse,
} from '@safe-global/api-kit';
import { ListResponse } from '@safe-global/safe-core-sdk-types';
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

/*
Interface to map the response from Safe Client's transactions/history
*/
interface ITransferInfo {
  type: string;
  value: string;

  tokenAddress: string;
  tokenName: string;
  tokenSymbol: string;
  decimals: number;
  logoUri: string;

  trusted: true;
  imitation: false;
}

interface ITxDestination {
  name?: string;
  logoUri?: string;
  value: string; // address
}

interface ITxInfo {
  direction: string;
  type: string;
  recipient?: ITxDestination;
  sender?: ITxDestination;
  transferInfo?: ITransferInfo;
}

interface ITransaction {
  timestamp: number;
  txHash: string;
  txStatus: string;
  txInfo: ITxInfo;
}

interface ISafeTransaction {
  type: string;
  transaction: ITransaction;
}

class EnhancedSafeApiKit {
  readonly safeApiKit: SafeApiKit;
  readonly publicClient: PublicClient;
  readonly networkConfig: NetworkConfig;
  readonly safeClientBaseUrl: string;
  readonly safeClientSafesPrefix: string;
  readonly safeClientTransactionsPrefix: string;

  // holds requests that have yet to return, to avoid calling the same
  // endpoint more than once
  requestMap = new Map<string, Promise<any> | null>();

  constructor(networkConfig: NetworkConfig) {
    this.safeApiKit = new SafeApiKit({
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

  private _timestampToString(timestamp: number): string | undefined {
    try {
      const date = new Date(timestamp);
      return date.toISOString();
    } catch (err) {
      return undefined;
    }
  }

  private _transferOf(transaction: ISafeTransaction): TransferWithTokenInfoResponse | undefined {
    const transfer = transaction.transaction?.txInfo?.transferInfo;
    if (transfer) {
      const timestamp = transaction.transaction?.timestamp;
      const timeText = timestamp != undefined ? this._timestampToString(timestamp) : undefined;
      if (timeText) {
        return {
          type: transaction.transaction?.txInfo.type,
          executionDate: timeText,
          blockNumber: timestamp,
          transactionHash: transaction.transaction?.txHash,
          to: transaction.transaction?.txInfo?.recipient?.value ?? '',
          value: transfer.value,
          tokenId: transfer.tokenAddress,
          tokenAddress: transfer.tokenAddress,
          from: transaction.transaction?.txInfo?.sender?.value ?? '',
          tokenInfo: {
            address: transfer.tokenAddress,
            name: transfer.tokenName,
            symbol: transfer.tokenSymbol,
            decimals: transfer.decimals,
            logoUri: transfer.logoUri,
          },
        };
      }
    }
    return undefined;
  }

  async getSafeInfo(safeAddress: Address): Promise<SafeInfoResponse> {
    const checksummedSafeAddress = getAddress(safeAddress);

    try {
      // Fetch necessary details from the contract
      const [nonce, threshold, owners, version] = await this.publicClient.multicall({
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

      // Fetch modules
      let startAddress: Address = SENTINEL_ADDRESS;
      let nextAddress: Address = zeroAddress; // placeholder
      const modules: Address[] = [];

      while (nextAddress !== SENTINEL_ADDRESS) {
        const lastModuleResponse = await this.publicClient.readContract({
          address: checksummedSafeAddress,
          abi: GnosisSafeL2Abi,
          functionName: 'getModulesPaginated',
          args: [startAddress, 1n], // get one module per page
        });
        const strategies = lastModuleResponse[0]; // "one page" of modules
        const next = lastModuleResponse[1]; // cursor for next page

        // a Safe might not have any modules installed
        if (strategies.length > 0) {
          modules.push(strategies[0]); // only one module per page
        }

        nextAddress = next;
        startAddress = nextAddress;
      }

      return {
        address: checksummedSafeAddress,
        nonce: Number(nonce ? nonce : 0),
        threshold: Number(threshold ? threshold : 0),
        owners: owners as string[],
        modules: modules,
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

  async getNextNonce(safeAddress: Address): Promise<number> {
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

  async getToken(tokenAddress: Address): Promise<TokenInfoResponse> {
    // leaving this for now, because the onchain fallback is not a FULL replacement
    // for the safe-transaction service call.
    //
    // export type TokenInfoResponse = {
    //   readonly type?: string;
    //   readonly address: string;
    //   readonly name: string;
    //   readonly symbol: string;
    //   readonly decimals: number;
    //   readonly logoUri?: string;
    // };
    //
    // a question though... now that the safe-transaction-service seems to be
    // turning back on after the bybit hack, does the actual response type
    // of this call still match the type we're using here?
    try {
      return await this.safeApiKit.getToken(tokenAddress);
    } catch (error) {
      console.error('Error fetching getToken from safe-transaction:', error);
    }

    try {
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
    } catch (error) {
      console.error('Error fetching getToken from contract:', error);
    }

    throw new Error('Failed to getToken()');
  }

  async confirmTransaction(safeTxHash: string, signature: string): Promise<SignatureResponse> {
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

  async getMultisigTransactions(
    safeAddress: Address,
  ): Promise<SafeMultisigTransactionListResponse> {
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

  async proposeTransaction({
    safeAddress,
    safeTransactionData,
    safeTxHash,
    senderAddress,
    senderSignature,
    origin,
  }: ProposeTransactionProps): Promise<void> {
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

  async decodeData(data: string): Promise<any> {
    try {
      const body = {
        data: data,
      };
      const value = await axios.post(`${this.safeClientBaseUrl}/data-decoder`, body, {
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

  async getTransfers(safeAddress: Address): Promise<TransferWithTokenInfoResponse[]> {
    try {
      const response: ListResponse<ISafeTransaction> = await this._safeClientGet(
        safeAddress,
        '/transactions/history',
      );

      const transfers = response.results.flatMap(tx => this._transferOf(tx) ?? []);

      return transfers;
    } catch (error) {
      console.error('Error fetching getTransfers from safe-client:', error);
    }

    return [];
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
