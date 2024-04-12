import { useCallback } from 'react';
import { useFractal } from '../../../providers/App/AppProvider';
import useIPFSClient from '../../../providers/App/hooks/useIPFSClient';
import { ProposalExecuteData } from '../../../types';
import { CreateProposalTemplateForm } from '../../../types/createProposalTemplate';
import { couldBeENS } from '../../../utils/url';
import useSafeContracts from '../../safe/useSafeContracts';
import useSignerOrProvider from '../../utils/useSignerOrProvider';

export default function useCreateProposalTemplate() {
  const signerOrProvider = useSignerOrProvider();

  const keyValuePairsContract = useSafeContracts()?.keyValuePairsContract;
  const client = useIPFSClient();
  const {
    governance: { proposalTemplates },
  } = useFractal();

  const prepareProposalTemplateProposal = useCallback(
    async (values: CreateProposalTemplateForm) => {
      if (proposalTemplates && signerOrProvider && keyValuePairsContract) {
        const proposalMetadata = {
          title: 'Create Proposal Template',
          description:
            'Execution of this proposal will create a new proposal template, attached to this Safe.',
          documentationUrl: '',
        };

        const proposalTemplateData = {
          title: values.proposalTemplateMetadata.title.trim(),
          description: values.proposalTemplateMetadata.description.trim(),
          transactions: await Promise.all(
            values.transactions.map(async tx => ({
              ...tx,
              targetAddress: couldBeENS(tx.targetAddress)
                ? await signerOrProvider.resolveName(tx.targetAddress)
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

        const { Hash } = await client.add(JSON.stringify(updatedTemplatesList));

        const proposal: ProposalExecuteData = {
          metaData: proposalMetadata,
          targets: [keyValuePairsContract.asProvider.address],
          values: [0n],
          calldatas: [
            keyValuePairsContract.asProvider.interface.encodeFunctionData('updateValues', [
              ['proposalTemplates'],
              [Hash],
            ]),
          ],
        };

        return proposal;
      }
    },
    [proposalTemplates, keyValuePairsContract, client, signerOrProvider],
  );

  return { prepareProposalTemplateProposal };
}
