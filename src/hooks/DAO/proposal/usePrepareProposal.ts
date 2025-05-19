import { useCallback } from 'react';
import { Hex, getAddress } from 'viem';
import { encodeFunction } from '../../../helpers';
import { CreateProposalForm } from '../../../types/proposalBuilder';
import { validateENSName, isValidUrl } from '../../../utils/url';
import { useNetworkEnsAddressAsync } from '../../useNetworkEnsAddress';

export function usePrepareProposal() {
  const { getEnsAddress } = useNetworkEnsAddressAsync();
  const prepareProposal = useCallback(
    async (values: CreateProposalForm) => {
      const { transactions, proposalMetadata } = values;
      const transactionsWithEncoding = transactions.map(tx => {
        if (!tx.functionName) {
          return {
            ...tx,
            calldata: '0x' as Hex,
          };
        } else {
          const signature = tx.parameters.map(parameter => parameter.signature.trim()).join(', ');

          const processValue = (value: string) =>
            isValidUrl(value.trim())
              ? encodeURIComponent(value.trim()) // If parameter.value is valid URL with special symbols like ":" or "?" - decoding might fail, thus we need to encode URL
              : value.trim();

          const parameters = tx.parameters
            .map(parameter =>
              parameter.valueArray
                ? `[${parameter.valueArray.map(processValue)}]`
                : processValue(parameter.value!),
            )
            .join(', ');

          return {
            ...tx,
            calldata: encodeFunction(tx.functionName, signature, parameters),
          };
        }
      });
      const targets = await Promise.all(
        transactionsWithEncoding.map(async tx => {
          if (tx.targetAddress && validateENSName(tx.targetAddress)) {
            const address = await getEnsAddress({ name: tx.targetAddress });
            if (address) {
              return address;
            }
          }
          return getAddress(tx.targetAddress);
        }),
      );

      return {
        targets,
        values: transactionsWithEncoding.map(transaction => transaction.ethValue.bigintValue || 0n),
        calldatas: transactionsWithEncoding.map(transaction => transaction.calldata || '0x'),
        metaData: {
          title: proposalMetadata.title,
          description: proposalMetadata.description,
          documentationUrl: proposalMetadata.documentationUrl,
        },
      };
    },
    [getEnsAddress],
  );
  return { prepareProposal };
}
