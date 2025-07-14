import { legacy } from '@decentdao/decent-contracts';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { encodeFunctionData } from 'viem';
import { useDAOStore } from '../../../providers/App/AppProvider';
import useIPFSClient from '../../../providers/App/hooks/useIPFSClient';
import { useNetworkConfigStore } from '../../../providers/NetworkConfig/useNetworkConfigStore';
import { ProposalExecuteData } from '../../../types';
import { bigintSerializer } from '../../../utils/bigintSerializer';
import { useCurrentDAOKey } from '../useCurrentDAOKey';

export default function useRemoveProposalTemplate() {
  const client = useIPFSClient();
  const { daoKey } = useCurrentDAOKey();
  const {
    governance: { proposalTemplates },
  } = useDAOStore({ daoKey });

  const {
    contracts: { keyValuePairs },
  } = useNetworkConfigStore();

  const { t } = useTranslation('proposalMetadata');

  const prepareRemoveProposalTemplateProposal = useCallback(
    async (templateIndex: number) => {
      if (proposalTemplates) {
        const proposalMetadata = {
          title: t('removeProposalTemplateTitle'),
          description: t('removeProposalTemplateDescription'),
          documentationUrl: '',
        };

        const updatedTemplatesList = proposalTemplates.filter(
          (_, index: number) => index !== templateIndex,
        );

        const { Hash } = await client.add(JSON.stringify(updatedTemplatesList, bigintSerializer));

        const encodedUpdateValues = encodeFunctionData({
          abi: legacy.abis.KeyValuePairs,
          functionName: 'updateValues',
          args: [['proposalTemplates'], [Hash]],
        });

        const proposal: ProposalExecuteData = {
          metaData: proposalMetadata,
          targets: [keyValuePairs],
          values: [0n],
          calldatas: [encodedUpdateValues],
        };

        return proposal;
      }
    },
    [client, keyValuePairs, proposalTemplates, t],
  );

  return { prepareRemoveProposalTemplateProposal };
}
