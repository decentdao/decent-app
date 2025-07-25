import { legacy } from '@decentdao/decent-contracts';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { encodeFunctionData } from 'viem';
import { normalize } from 'viem/ens';
import { useDAOStore } from '../../../providers/App/AppProvider';
import useIPFSClient from '../../../providers/App/hooks/useIPFSClient';
import { useNetworkConfigStore } from '../../../providers/NetworkConfig/useNetworkConfigStore';
import { ProposalExecuteData } from '../../../types';
import { CreateProposalForm } from '../../../types/proposalBuilder';
import { bigintSerializer } from '../../../utils/bigintSerializer';
import { validateENSName } from '../../../utils/url';
import { useNetworkEnsAddressAsync } from '../../useNetworkEnsAddress';
import { useCurrentDAOKey } from '../useCurrentDAOKey';

export default function useCreateProposalTemplate() {
  const { getEnsAddress } = useNetworkEnsAddressAsync();
  const client = useIPFSClient();
  const { daoKey } = useCurrentDAOKey();
  const {
    governance: { proposalTemplates },
  } = useDAOStore({ daoKey });

  const {
    contracts: { keyValuePairs },
  } = useNetworkConfigStore();

  const { t } = useTranslation('proposalMetadata');

  const prepareProposalTemplateProposal = useCallback(
    async (values: CreateProposalForm) => {
      if (proposalTemplates) {
        const proposalMetadata = {
          title: t('createProposalTemplateTitle'),
          description: t('createProposalTemplateDescription'),
          documentationUrl: '',
        };

        const proposalTemplateData = {
          title: values.proposalMetadata.title.trim(),
          description: values.proposalMetadata.description.trim(),
          transactions: await Promise.all(
            values.transactions.map(async tx => ({
              ...tx,
              targetAddress: validateENSName(tx.targetAddress)
                ? await getEnsAddress({ name: normalize(tx.targetAddress) })
                : tx.targetAddress,
              parameters: tx.parameters
                .map(param => {
                  if (param.signature) {
                    return param;
                  } else {
                    // This allows submitting transaction function with no params
                    return undefined;
                  }
                })
                .filter(param => param),
            })),
          ),
        };

        const updatedTemplatesList = [...proposalTemplates, proposalTemplateData];

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
    [client, getEnsAddress, keyValuePairs, proposalTemplates, t],
  );

  return { prepareProposalTemplateProposal };
}
