import { ProposeTransactionProps } from '@safe-global/api-kit';
import {
  hashTypedData,
  Hash,
  zeroAddress,
  toHex,
  toBytes,
  encodePacked,
  Address,
  bytesToBigInt,
  Hex,
  WalletClient,
  encodeFunctionData,
  parseAbiParameters,
  isHex,
} from 'viem';

import { MetaTransaction, SafeTransaction } from '../types/transaction';

export interface SafeSignature {
  signer: string;
  data: Hex;
}

export const EIP712_SAFE_TX_TYPE = {
  // "SafeTx(address to,uint256 value,bytes data,uint8 operation,uint256 safeTxGas,uint256 baseGas,uint256 gasPrice,address gasToken,address refundReceiver,uint256 nonce)"
  SafeTx: [
    { type: 'address', name: 'to' },
    { type: 'uint256', name: 'value' },
    { type: 'bytes', name: 'data' },
    { type: 'uint8', name: 'operation' },
    { type: 'uint256', name: 'safeTxGas' },
    { type: 'uint256', name: 'baseGas' },
    { type: 'uint256', name: 'gasPrice' },
    { type: 'address', name: 'gasToken' },
    { type: 'address', name: 'refundReceiver' },
    { type: 'uint256', name: 'nonce' },
  ],
};

export function getRandomBytes() {
  return bytesToBigInt(self.crypto.getRandomValues(new Uint8Array(32)));
}

export const calculateSafeTransactionHash = (
  safeAddress: Address,
  safeTx: SafeTransaction,
  chainId: number,
): string => {
  return hashTypedData({
    domain: { verifyingContract: safeAddress, chainId },
    types: EIP712_SAFE_TX_TYPE,
    primaryType: 'SafeTx',
    message: { ...safeTx },
  });
};

export const buildSignatureBytes = (signatures: SafeSignature[]) => {
  signatures.sort((left, right) =>
    left.signer.toLowerCase().localeCompare(right.signer.toLowerCase()),
  );
  let signatureBytes: Hash = '0x';
  for (const sig of signatures) {
    signatureBytes += sig.data.slice(2);
  }
  return signatureBytes;
};

export const buildSafeTransaction = (template: {
  to: Address;
  value?: bigint;
  data?: Hex;
  operation?: 0 | 1;
  safeTxGas?: number | string;
  baseGas?: number | string;
  gasPrice?: number | string;
  gasToken?: Address;
  refundReceiver?: Address;
  nonce: number;
}): SafeTransaction => {
  return {
    to: template.to,
    value: template.value || 0n,
    data: template.data || '0x',
    operation: template.operation || 0,
    safeTxGas: `${template.safeTxGas || 0}`,
    baseGas: `${template.baseGas || 0}`,
    gasPrice: `${template.gasPrice || 0}`,
    gasToken: template.gasToken || zeroAddress,
    refundReceiver: template.refundReceiver || zeroAddress,
    nonce: template.nonce,
  };
};

export const safeSignTypedData = async (
  walletClient: WalletClient,
  contractAddress: Address,
  safeTx: SafeTransaction,
  chainId: number,
): Promise<SafeSignature> => {
  if (!walletClient.account) throw new Error("Signer doesn't have account");

  const signerAddress = walletClient.account.address;
  const signedData = await walletClient.signTypedData({
    account: signerAddress,
    domain: { verifyingContract: contractAddress, chainId },
    types: EIP712_SAFE_TX_TYPE,
    primaryType: 'SafeTx',
    message: {
      to: safeTx.to,
      value: safeTx.value,
      data: safeTx.data,
      operation: safeTx.operation,
      safeTxGas: safeTx.safeTxGas,
      baseGas: safeTx.baseGas,
      gasPrice: safeTx.gasPrice,
      gasToken: safeTx.gasToken,
      refundReceiver: safeTx.refundReceiver,
      nonce: safeTx.nonce,
    },
  });

  return {
    signer: signerAddress,
    data: signedData,
  };
};

export const buildSafeAPIPost = async (
  safeAddress: Address,
  walletClient: WalletClient,
  chainId: number,
  template: {
    to: Address;
    value?: bigint;
    data?: Hex;
    operation?: 0 | 1;
    safeTxGas?: number | string;
    baseGas?: number | string;
    gasPrice?: number | string;
    gasToken?: Address;
    refundReceiver?: Address;
    nonce: number;
  },
): Promise<ProposeTransactionProps> => {
  if (!walletClient.account) throw new Error("Signer doesn't have account");

  const safeTx = buildSafeTransaction(template);
  const txHash = calculateSafeTransactionHash(safeAddress, safeTx, chainId);
  const sig = [await safeSignTypedData(walletClient, safeAddress, safeTx, chainId)];
  const signatureBytes = buildSignatureBytes(sig);
  return {
    safeAddress: safeAddress,
    safeTransactionData: {
      to: safeTx.to,
      value: safeTx.value ? safeTx.value.toString() : '0',
      data: safeTx.data,
      operation: safeTx.operation,
      safeTxGas: `${safeTx.safeTxGas}`,
      baseGas: `${safeTx.baseGas}`,
      gasPrice: `${safeTx.gasPrice}`,
      gasToken: safeTx.gasToken,
      refundReceiver: safeTx.refundReceiver,
      nonce: safeTx.nonce,
    },
    safeTxHash: txHash,
    senderAddress: walletClient.account.address,
    senderSignature: signatureBytes,
  };
};

export const buildContractCall = ({
  target,
  encodedFunctionData,
  overrides,
}: {
  target: Address;
  encodedFunctionData: Hex;
  overrides?: Partial<SafeTransaction>;
}): SafeTransaction => {
  // If ever in the future some caller of `buildContractCall` needs to specify delegateCall, add a `delegateCall` param to this function
  const operation: 0 | 1 = 0;

  return buildSafeTransaction(
    Object.assign(
      {
        to: target,
        data: encodedFunctionData,
        operation,
        nonce: 0,
      },
      overrides,
    ),
  );
};

const encodeMetaTransaction = (tx: MetaTransaction): string => {
  const txDataBytes = toBytes(tx.data);
  const txDataHex = toHex(txDataBytes);
  const encoded = encodePacked(
    ['uint8', 'address', 'uint256', 'uint256', 'bytes'],
    [tx.operation, tx.to, BigInt(tx.value), BigInt(txDataBytes.length), txDataHex],
  );
  return encoded.slice(2);
};

export const encodeMultiSend = (txs: MetaTransaction[]): Hex => {
  return `0x${txs.map(tx => encodeMetaTransaction(tx)).join('')}`;
};

export const buildSignatures = (multiSendCallOnlyAddress: Address): Hex => {
  const signatureData =
    '0x000000000000000000000000' +
    multiSendCallOnlyAddress.slice(2) +
    '0000000000000000000000000000000000000000000000000000000000000000' +
    '01';

  if (!isHex(signatureData)) {
    throw new Error('Invalid signature data');
  }

  return signatureData;
};

function splitIgnoreBrackets(str: string): string[] {
  const result = str
    .match(/[^,\[\]]+|\[[^\]]*\]/g)!
    .filter(match => {
      return match.trim().length > 0;
    })
    .map(match => (match = match.trim()));
  return result;
}
/**
 * Encodes a smart contract function, given the provided function name, input types, and input values.
 *
 * @param _functionName the name of the smart contact function
 * @param _functionSignature the comma delimited input types and optionally their names, e.g. `uint256 amount, string note`
 * @param _parameters the actual values for the given _functionSignature
 * @returns the encoded function data, as a string
 */
export const encodeFunction = (
  _functionName: string,
  _functionSignature: string,
  _parameters: string,
) => {
  const parameters = !!_parameters
    ? splitIgnoreBrackets(_parameters).map(p => (p = p.trim()))
    : undefined;
  const parametersFixed: Array<string | string[]> | undefined = parameters ? [] : undefined;
  let tupleIndex: number | undefined = undefined;
  parameters?.forEach((param, i) => {
    if (param.replaceAll(' ', '') === '[]') {
      // Handle empty array explicitly
      parametersFixed!!.push([]);
    } else if (param.startsWith('[') && param.endsWith(']')) {
      parametersFixed!!.push(
        param
          .substring(1, param.length - 1)
          .split(',')
          .map(p => (p = p.trim())),
      );
    } else if (param.startsWith('(')) {
      // This is part of tuple param, we need to re-assemble it. There should be better solution to this within splitIgnoreBrackets with regex.
      // However, we probably want to rebuild proposal builder to be more like ProposalTemplate builder
      tupleIndex = i;
      parametersFixed!!.push([param.replace('(', '')]);
    } else if (typeof tupleIndex === 'number' && !param.endsWith(')')) {
      (parametersFixed!![tupleIndex!] as string[]).push(param);
    } else if (param.endsWith(')')) {
      (parametersFixed!![tupleIndex!] as string[]).push(param.replace(')', ''));
      tupleIndex = undefined;
    } else if (
      (param.startsWith('"') && param.endsWith('"')) ||
      (param.startsWith("'") && param.endsWith("'"))
    ) {
      // Only remove outer quotes if the entire string is quoted
      return parametersFixed!!.push(param.substring(1, param.length - 1));
    } else {
      parametersFixed!!.push(param);
    }
  });
  const boolify = (parameter: string) => {
    if (['false'].includes(parameter.toLowerCase())) {
      return false;
    } else if (['true'].includes(parameter.toLowerCase())) {
      return true;
    } else {
      return parameter;
    }
  };
  const parametersFixedWithBool = parametersFixed?.map(parameter => {
    if (typeof parameter === 'string') {
      return boolify(parameter);
    } else if (Array.isArray(parameter)) {
      return parameter.map(innerParameter => {
        return boolify(innerParameter);
      });
    } else {
      throw new Error('parameter type not as expected');
    }
  });

  const abi = [
    {
      inputs: _functionSignature ? parseAbiParameters(_functionSignature) : [],
      name: _functionName,
      type: 'function',
    },
  ];

  const functionData = encodeFunctionData({
    args: parametersFixedWithBool,
    abi,
  });

  return functionData;
};
