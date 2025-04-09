import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Address, getContract, isHex, parseEther } from 'viem';
import MultiSendCallOnlyAbi from '../../assets/abi/MultiSendCallOnly';
import useFeatureFlag from '../../helpers/environmentFeatureFlags';
import { useNetworkConfigStore } from '../../providers/NetworkConfig/useNetworkConfigStore';
import { AzoriusERC20DAO, AzoriusERC721DAO, SafeMultisigDAO } from '../../types';
import { useNetworkWalletClient } from '../useNetworkWalletClient';
import { useTransaction } from '../utils/useTransaction';
import useBuildDAOTx from './useBuildDAOTx';

const useDeployDAO = () => {
  const [contractCall, pending] = useTransaction();
  const [build] = useBuildDAOTx();

  const { t } = useTranslation('transaction');

  const {
    addressPrefix,
    contracts: { multiSendCallOnly },
    gaslessVoting,
  } = useNetworkConfigStore();
  const gaslessStakingFeatureEnabled =
    useFeatureFlag('flag_gasless_staking') && gaslessVoting?.rundlerMinimumStake !== undefined;

  const { data: walletClient } = useNetworkWalletClient();

  const deployDao = useCallback(
    (
      daoData: SafeMultisigDAO | AzoriusERC20DAO | AzoriusERC721DAO,
      successCallback: (addressPrefix: string, safeAddress: Address, daoName: string) => void,
    ) => {
      const deploy = async () => {
        if (!walletClient) {
          return;
        }

        const builtSafeTx = await build(daoData);
        if (!builtSafeTx) {
          return;
        }

        const { predictedSafeAddress, safeTx } = builtSafeTx;

        if (!isHex(safeTx)) {
          throw new Error('built transaction is not a hex string');
        }

        const multiSendCallOnlyContract = getContract({
          abi: MultiSendCallOnlyAbi,
          address: multiSendCallOnly,
          client: walletClient,
        });

        const sendDeploymentTransaction = () => {
          contractCall({
            contractFn: () => multiSendCallOnlyContract.write.multiSend([safeTx]),
            pendingMessage: t('pendingDeploySafe'),
            failedMessage: t('failedDeploySafe'),
            successMessage: t('successDeploySafe'),
            successCallback: () =>
              successCallback(addressPrefix, predictedSafeAddress, daoData.daoName),
          });
        };

        // Send ETH to Safe before deployment, these ETH
        //   will be used to stake for paymaster later in deployment txn.
        if (daoData.gaslessVoting && gaslessStakingFeatureEnabled) {
          contractCall({
            contractFn: () =>
              walletClient.sendTransaction({
                to: predictedSafeAddress,
                value: gaslessVoting.rundlerMinimumStake,
              }),
            pendingMessage: t('pendingSendEthToSafe'),
            failedMessage: t('failedSendEthToSafe'),
            successMessage: t('successSendEthToSafe'),
            successCallback: sendDeploymentTransaction,
          });
          return;
        }

        sendDeploymentTransaction();
      };

      deploy();
    },
    [
      addressPrefix,
      build,
      contractCall,
      gaslessStakingFeatureEnabled,
      multiSendCallOnly,
      t,
      walletClient,
    ],
  );

  return [deployDao, pending] as const;
};

export default useDeployDAO;
