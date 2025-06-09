import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { getContract, isHex } from 'viem';
import { useAccount } from 'wagmi';
import MultiSendCallOnlyAbi from '../../assets/abi/MultiSendCallOnly';
import { encodeMultiSend } from '../../helpers';
import { TxBuilderFactory } from '../../models/TxBuilderFactory';
import { useNetworkConfigStore } from '../../providers/NetworkConfig/useNetworkConfigStore';
import { AzoriusERC20DAO, SafeTransaction } from '../../types';
import useNetworkPublicClient from '../useNetworkPublicClient';
import { useNetworkWalletClient } from '../useNetworkWalletClient';
import { useTransaction } from '../utils/useTransaction';
import { useCurrentDAOKey } from './useCurrentDAOKey';

export default function useDeployToken() {
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
  const [contractCall, pending] = useTransaction();
  const { t } = useTranslation('transaction');
  const { safeAddress } = useCurrentDAOKey();

  const deployToken = useCallback(
    async (daoData: AzoriusERC20DAO, successCallback: () => void) => {
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
      const txs: SafeTransaction[] = [];

      // deploy(and allocate) token if token is not imported
      if (!daoData.isTokenImported) {
        txs.push(azoriusTxBuilder.buildCreateTokenTx());
      }
      txs.push(azoriusTxBuilder.buildUpdateERC20AddressTx(keyValuePairs));
      const safeTx = encodeMultiSend(txs);

      if (!isHex(safeTx)) {
        throw new Error('built transaction is not a hex string');
      }

      const multiSendCallOnlyContract = getContract({
        abi: MultiSendCallOnlyAbi,
        address: multiSendCallOnly,
        client: walletClient,
      });

      contractCall({
        contractFn: () => multiSendCallOnlyContract.write.multiSend([safeTx]),
        pendingMessage: t('pendingDeployToken'),
        failedMessage: t('failedDeployToken'),
        successMessage: t('successDeployToken'),
        successCallback,
      });
    },
    [
      claimErc20MasterCopy,
      compatibilityFallbackHandler,
      contractCall,
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
      t,
      user.address,
      votesErc20LockableMasterCopy,
      votesErc20MasterCopy,
      walletClient,
      zodiacModuleProxyFactory,
    ],
  );

  return { deployToken, pending };
}
