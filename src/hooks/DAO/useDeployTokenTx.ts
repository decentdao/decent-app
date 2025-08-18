import { legacy } from '@decentdao/decent-contracts';
import { useCallback } from 'react';
import {
  encodeAbiParameters,
  encodeFunctionData,
  encodePacked,
  getCreate2Address,
  keccak256,
  parseAbiParameters,
} from 'viem';
import { useAccount } from 'wagmi';
import { getRandomBytes } from '../../helpers';
import { calculateTokenAllocations } from '../../models/AzoriusTxBuilder';
import { generateContractByteCodeLinear, generateSalt } from '../../models/helpers/utils';
import { useNetworkConfigStore } from '../../providers/NetworkConfig/useNetworkConfigStore';
import { AzoriusERC20DAO, CreateProposalTransaction } from '../../types';
import { useNetworkWalletClient } from '../useNetworkWalletClient';
import { useCurrentDAOKey } from './useCurrentDAOKey';

export default function useDeployTokenTx() {
  const {
    contracts: { votesErc20MasterCopy, keyValuePairs, zodiacModuleProxyFactory },
  } = useNetworkConfigStore();
  const user = useAccount();
  const { data: walletClient } = useNetworkWalletClient();
  const { safeAddress } = useCurrentDAOKey();

  const deployToken = useCallback(
    async (daoData: AzoriusERC20DAO) => {
      if (!user.address || !walletClient || !safeAddress) {
        return;
      }

      const txs: CreateProposalTransaction[] = [];
      let predictedTokenAddress = daoData.tokenImportAddress;

      // deploy(and allocate) token if token is not imported
      if (!daoData.isTokenImported) {
        if (!votesErc20MasterCopy) {
          throw new Error('VotesErc20MasterCopy is not deployed');
        }

        const azoriusGovernanceDaoData = daoData as AzoriusERC20DAO;
        const [tokenAllocationsOwners, tokenAllocationsValues] = calculateTokenAllocations(
          azoriusGovernanceDaoData,
          safeAddress,
        );
        const encodedInitTokenData = encodeAbiParameters(
          parseAbiParameters('string, string, address[], uint256[]'),
          [
            azoriusGovernanceDaoData.tokenName,
            azoriusGovernanceDaoData.tokenSymbol,
            tokenAllocationsOwners,
            tokenAllocationsValues,
          ],
        );
        const tokenNonce = getRandomBytes();
        const encodedSetupTokenData = encodeFunctionData({
          abi: legacy.abis.VotesERC20,
          functionName: 'setUp',
          args: [encodedInitTokenData],
        });
        txs.push({
          targetAddress: zodiacModuleProxyFactory,
          ethValue: {
            bigintValue: 0n,
            value: '0',
          },
          functionName: 'deployModule',
          parameters: [
            {
              signature: 'address',
              value: votesErc20MasterCopy,
            },
            {
              signature: 'bytes',
              value: encodedSetupTokenData,
            },
            {
              signature: 'uint256',
              value: tokenNonce.toString(),
            },
          ],
        });

        const tokenByteCodeLinear = generateContractByteCodeLinear(votesErc20MasterCopy);
        const tokenSalt = generateSalt(encodedSetupTokenData, tokenNonce);
        predictedTokenAddress = getCreate2Address({
          from: zodiacModuleProxyFactory,
          salt: tokenSalt,
          bytecodeHash: keccak256(encodePacked(['bytes'], [tokenByteCodeLinear])),
        });
      }

      // Update ERC20 address in key-value pairs
      txs.push({
        targetAddress: keyValuePairs,
        ethValue: {
          bigintValue: 0n,
          value: '0',
        },
        functionName: 'updateValues',
        parameters: [
          {
            signature: 'string[]',
            valueArray: ['erc20Address'],
          },
          {
            signature: 'string[]',
            valueArray: [predictedTokenAddress!],
          },
        ],
      });

      return txs;
    },
    [
      keyValuePairs,
      safeAddress,
      user.address,
      votesErc20MasterCopy,
      walletClient,
      zodiacModuleProxyFactory,
    ],
  );

  return { deployToken };
}
