import { legacy } from '@decentdao/decent-contracts';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Address, Hex, getContract } from 'viem';
import { useDAOStore } from '../../../providers/App/AppProvider';
import { AzoriusProposal, FractalProposal, MetaTransaction } from '../../../types';
import { useNetworkWalletClient } from '../../useNetworkWalletClient';
import { useTransaction } from '../../utils/useTransaction';
import { useCurrentDAOKey } from '../useCurrentDAOKey';

export default function useExecuteProposal() {
  const { t } = useTranslation('transaction');
  const { daoKey } = useCurrentDAOKey();
  const { governanceContracts } = useDAOStore({ daoKey });
  const { moduleAzoriusAddress } = governanceContracts;
  const { data: walletClient } = useNetworkWalletClient();
  const [contractCall, pending] = useTransaction();

  const executeProposal = useCallback(
    (proposal: FractalProposal) => {
      const azoriusProposal = proposal as AzoriusProposal;
      if (
        !moduleAzoriusAddress ||
        !azoriusProposal.data ||
        !azoriusProposal.data.transactions ||
        !walletClient
      ) {
        return;
      }

      const azoriusContract = getContract({
        abi: legacy.abis.Azorius,
        address: moduleAzoriusAddress,
        client: walletClient,
      });

      const targets: Address[] = [];
      const values: MetaTransaction['value'][] = [];
      const data: Hex[] = [];
      const operations: number[] = [];

      azoriusProposal.data.transactions.forEach(tx => {
        targets.push(tx.to);
        values.push(tx.value);
        data.push(tx.data);
        operations.push(tx.operation);
      });

      contractCall({
        contractFn: () =>
          azoriusContract.write.executeProposal([
            Number(proposal.proposalId),
            targets,
            values,
            data,
            operations,
          ]),
        pendingMessage: t('pendingExecute'),
        failedMessage: t('failedExecute'),
        successMessage: t('successExecute'),
        successCallback: async () => {},
      });
    },
    [moduleAzoriusAddress, contractCall, t, walletClient],
  );

  return {
    pending,
    executeProposal,
  };
}
