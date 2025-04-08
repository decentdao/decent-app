import { abis } from '@fractal-framework/fractal-contracts';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { encodeFunctionData, isHex } from 'viem';
import MultiSendCallOnlyAbi from '../../assets/abi/MultiSendCallOnly';
import { useDecentStore } from '../../providers/App/AppProvider';
import { useNetworkConfigStore } from '../../providers/NetworkConfig/useNetworkConfigStore';
import { useDaoInfoStore } from '../../store/daoInfo/useDaoInfoStore';
import {
  AzoriusERC20DAO,
  AzoriusERC721DAO,
  AzoriusGovernance,
  SafeMultisigDAO,
  SubDAO,
} from '../../types';
import { ProposalExecuteData } from '../../types/daoProposal';
import useCurrentDAOKey from '../useCurrentDAOKey';
import { useCanUserCreateProposal } from '../utils/useCanUserSubmitProposal';
import useSubmitProposal from './proposal/useSubmitProposal';
import useBuildDAOTx from './useBuildDAOTx';

export const useCreateSubDAOProposal = () => {
  const { t } = useTranslation(['daoCreate', 'proposal', 'proposalMetadata']);

  const { submitProposal, pendingCreateTx } = useSubmitProposal();
  const { canUserCreateProposal } = useCanUserCreateProposal();
  const [build] = useBuildDAOTx();
  const { daoKey } = useCurrentDAOKey();
  const { governance } = useDecentStore({ daoKey });
  const { safe } = useDaoInfoStore();
  const {
    contracts: { multiSendCallOnly, keyValuePairs },
  } = useNetworkConfigStore();
  const azoriusGovernance = governance as AzoriusGovernance;

  const safeAddress = safe?.address;

  const proposeDao = useCallback(
    (
      daoData: AzoriusERC20DAO | AzoriusERC721DAO | SafeMultisigDAO | SubDAO,
      nonce: number | undefined,
      successCallback: (addressPrefix: string, safeAddress: string) => void,
    ) => {
      const propose = async () => {
        if (!safeAddress) {
          return;
        }

        const builtSafeTx = await build(
          daoData,
          safeAddress,
          azoriusGovernance.votesToken?.address,
        );
        if (!builtSafeTx) {
          return;
        }

        const { safeTx, predictedSafeAddress } = builtSafeTx;

        if (!isHex(safeTx)) {
          throw new Error('Built safeTx is not a hex string');
        }

        const encodedMultisend = encodeFunctionData({
          abi: MultiSendCallOnlyAbi,
          functionName: 'multiSend',
          args: [safeTx],
        });

        if (!isHex(encodedMultisend)) {
          throw new Error('encodedMultisend data is not hex??');
        }

        const encodedDeclareSubDAO = encodeFunctionData({
          abi: abis.KeyValuePairs,
          functionName: 'updateValues',
          args: [['childDao'], [predictedSafeAddress]],
        });

        const proposalData: ProposalExecuteData = {
          targets: [multiSendCallOnly, keyValuePairs],
          values: [0n, 0n],
          calldatas: [encodedMultisend, encodedDeclareSubDAO],
          metaData: {
            title: t('createChildSafe', { ns: 'proposalMetadata' }),
            description: '',
            documentationUrl: '',
          },
        };
        submitProposal({
          proposalData,
          nonce,
          pendingToastMessage: t('createSubDAOPendingToastMessage'),
          successToastMessage: t('proposalCreateSuccessToastMessage', { ns: 'proposal' }),
          failedToastMessage: t('proposalCreateFailureToastMessage', { ns: 'proposal' }),
          successCallback,
        });
      };
      propose();
    },
    [
      azoriusGovernance.votesToken?.address,
      build,
      safeAddress,
      keyValuePairs,
      multiSendCallOnly,
      submitProposal,
      t,
    ],
  );

  return { proposeDao, pendingCreateTx, canUserCreateProposal } as const;
};
