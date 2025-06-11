import { useCallback } from 'react';
import { useAccount } from 'wagmi';
import { TxBuilderFactory } from '../../models/TxBuilderFactory';
import { useNetworkConfigStore } from '../../providers/NetworkConfig/useNetworkConfigStore';
import { AzoriusERC20DAO, CreateProposalTransaction } from '../../types';
import useNetworkPublicClient from '../useNetworkPublicClient';
import { useNetworkWalletClient } from '../useNetworkWalletClient';
import { useCurrentDAOKey } from './useCurrentDAOKey';

export default function useDeployTokenTx() {
  const {
    contracts: {
      compatibilityFallbackHandler,
      votesErc20MasterCopy,
      votesErc20LockableMasterCopy,
      keyValuePairs,
      gnosisSafeProxyFactory,
      gnosisSafeL2Singleton,
      zodiacModuleProxyFactory,
      multiSendCallOnly,
      claimErc20MasterCopy,
      moduleFractalMasterCopy,
      linearVotingErc20MasterCopy,
      linearVotingErc721MasterCopy,
      moduleAzoriusMasterCopy,
      freezeGuardAzoriusMasterCopy,
      freezeGuardMultisigMasterCopy,
      freezeVotingErc20MasterCopy,
      freezeVotingErc721MasterCopy,
      freezeVotingMultisigMasterCopy,
    },
  } = useNetworkConfigStore();
  const user = useAccount();
  const publicClient = useNetworkPublicClient();
  const { data: walletClient } = useNetworkWalletClient();
  const { safeAddress } = useCurrentDAOKey();

  const deployToken = useCallback(
    async (daoData: AzoriusERC20DAO) => {
      if (!user.address || !walletClient || !safeAddress) {
        return;
      }

      const txBuilderFactory = new TxBuilderFactory(
        publicClient,
        false,
        daoData,
        compatibilityFallbackHandler,
        votesErc20MasterCopy,
        keyValuePairs,
        gnosisSafeProxyFactory,
        gnosisSafeL2Singleton,
        zodiacModuleProxyFactory,
        freezeGuardAzoriusMasterCopy,
        freezeGuardMultisigMasterCopy,
        freezeVotingErc20MasterCopy,
        freezeVotingErc721MasterCopy,
        freezeVotingMultisigMasterCopy,
        multiSendCallOnly,
        claimErc20MasterCopy,
        moduleFractalMasterCopy,
        linearVotingErc20MasterCopy,
        linearVotingErc721MasterCopy,
        moduleAzoriusMasterCopy,
        votesErc20LockableMasterCopy,
        undefined,
        undefined,
      );
      txBuilderFactory.setSafeContract(safeAddress);
      const azoriusTxBuilder = await txBuilderFactory.createAzoriusTxBuilder();
      const txs: CreateProposalTransaction[] = [];

      // deploy(and allocate) token if token is not imported
      if (!daoData.isTokenImported) {
        txs.push(azoriusTxBuilder.getCreateTokenTx());
      }
      txs.push(azoriusTxBuilder.getUpdateERC20AddressTx(keyValuePairs));

      return txs;
    },
    [
      claimErc20MasterCopy,
      compatibilityFallbackHandler,
      freezeGuardAzoriusMasterCopy,
      freezeGuardMultisigMasterCopy,
      freezeVotingErc20MasterCopy,
      freezeVotingErc721MasterCopy,
      freezeVotingMultisigMasterCopy,
      gnosisSafeL2Singleton,
      gnosisSafeProxyFactory,
      keyValuePairs,
      linearVotingErc20MasterCopy,
      linearVotingErc721MasterCopy,
      moduleAzoriusMasterCopy,
      moduleFractalMasterCopy,
      multiSendCallOnly,
      publicClient,
      safeAddress,
      user.address,
      votesErc20LockableMasterCopy,
      votesErc20MasterCopy,
      walletClient,
      zodiacModuleProxyFactory,
    ],
  );

  return { deployToken };
}
