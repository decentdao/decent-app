import { abis } from '@decentdao/decent-contracts';
import { useCallback } from 'react';
import { Address, encodeFunctionData, encodePacked, getCreate2Address, keccak256 } from 'viem';
import { useAccount } from 'wagmi';
import { getRandomBytes } from '../../helpers';
import { calculateTokenAllocations } from '../../models/AzoriusTxBuilder';
import { generateContractByteCodeLinear, generateSalt } from '../../models/helpers/utils';
import { useNetworkConfigStore } from '../../providers/NetworkConfig/useNetworkConfigStore';
import { AzoriusERC20DAO, CreateProposalTransaction, TokenLockType } from '../../types';
import { useNetworkWalletClient } from '../useNetworkWalletClient';
import { useCurrentDAOKey } from './useCurrentDAOKey';

export default function useDeployTokenTx() {
  const {
    contracts: { votesErc20LockableMasterCopy, keyValuePairs, zodiacModuleProxyFactory },
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
        if (!votesErc20LockableMasterCopy) {
          throw new Error('VotesERC20LockableMasterCopy is not deployed');
        }

        const azoriusGovernanceDaoData = daoData as AzoriusERC20DAO;
        const [tokenAllocationsOwners, tokenAllocationsValues] = calculateTokenAllocations(
          azoriusGovernanceDaoData,
          safeAddress,
        );
        const allocations: { to: Address; amount: bigint }[] = tokenAllocationsOwners.map(
          (o, i) => ({
            to: o,
            amount: tokenAllocationsValues[i],
          }),
        );
        const tokenNonce = getRandomBytes();
        const encodedSetupTokenData = encodeFunctionData({
          abi: abis.deployables.VotesERC20V1,
          functionName: 'initialize',
          args: [
            // metadata_
            {
              name: azoriusGovernanceDaoData.tokenName,
              symbol: azoriusGovernanceDaoData.tokenSymbol,
            },
            allocations,
            // owner_
            safeAddress,
            // locked_
            azoriusGovernanceDaoData.locked === TokenLockType.LOCKED,
            // maxTotalSupply_
            azoriusGovernanceDaoData.maxTotalSupply,
          ],
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
              value: votesErc20LockableMasterCopy,
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

        const tokenByteCodeLinear = generateContractByteCodeLinear(votesErc20LockableMasterCopy);
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
      votesErc20LockableMasterCopy,
      walletClient,
      zodiacModuleProxyFactory,
    ],
  );

  return { deployToken };
}
