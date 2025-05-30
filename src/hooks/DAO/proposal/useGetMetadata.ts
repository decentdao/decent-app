import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { decodeAbiParameters, parseAbiParameters, Hash } from 'viem';
import useIPFSClient from '../../../providers/App/hooks/useIPFSClient';
import { FractalProposal, CreateProposalMetadata } from '../../../types';
import { CacheKeys } from '../../utils/cache/cacheDefaults';
import { DBObjectKeys, useIndexedDB } from '../../utils/cache/useLocalDB';

interface DataDecoded {
  parameters: Parameter[];
}

interface Parameter {
  valueDecoded: Transaction[];
}

interface Transaction {
  data: Hash;
}

const useGetMultisigMetadata = (proposal: FractalProposal | null | undefined) => {
  const ipfsClient = useIPFSClient();
  const [multisigMetadata, setMultisigMetadata] = useState<
    CreateProposalMetadata | null | undefined
  >(undefined);
  const [setValue, getValue] = useIndexedDB(DBObjectKeys.DECODED_TRANSACTIONS);

  const fetchMultisigMetadata = useCallback(async () => {
    if (!proposal) return;

    const cached: CreateProposalMetadata = await getValue(
      CacheKeys.MULTISIG_METADATA_PREFIX + proposal.proposalId,
    );
    if (cached) {
      setMultisigMetadata(cached);
      return;
    }

    if (!proposal.transaction) return;

    // transactionType either isn't SafeMultisigTransactionResponse, or
    // there is no dataDecoded field on it
    if (!proposal.transaction?.dataDecoded) return;

    // find the last transaction in the multiSend batch, which *should* be the metadata
    // transaction, which contains the IPFS hash as its data array
    const dataDecoded: DataDecoded = JSON.parse(proposal.transaction.dataDecoded);
    const transactions: Transaction[] = dataDecoded.parameters[0]?.valueDecoded;

    if (!transactions) return;

    const encodedMetadata = transactions[transactions.length - 1].data;

    // if there is data there, see if it's the hash (it should be), then get the JSON
    // data from IPFS
    if (encodedMetadata) {
      try {
        const decoded = decodeAbiParameters(parseAbiParameters('string'), encodedMetadata);
        const ipfsHash = decoded[0];
        const meta: CreateProposalMetadata = await ipfsClient.cat(ipfsHash);

        // cache the metadata JSON
        await setValue(CacheKeys.MULTISIG_METADATA_PREFIX + proposal.proposalId, meta);

        setMultisigMetadata(meta);
      } catch (e) {
        setMultisigMetadata(null);
      }
    }
  }, [getValue, ipfsClient, proposal, setValue]);

  useEffect(() => {
    if (multisigMetadata === undefined) fetchMultisigMetadata();
  }, [multisigMetadata, fetchMultisigMetadata, proposal?.proposalId]);

  return { multisigMetadata };
};

export const useGetMetadata = (
  proposal: FractalProposal | null | undefined,
): CreateProposalMetadata => {
  const { multisigMetadata } = useGetMultisigMetadata(proposal);
  const { t } = useTranslation('dashboard');

  return {
    title: multisigMetadata?.title || proposal?.data?.metaData?.title || '',
    description:
      multisigMetadata?.description ||
      proposal?.data?.metaData?.description ||
      t('proposalDescription', {
        count: proposal?.targets.length,
      }),
    documentationUrl:
      multisigMetadata?.documentationUrl || proposal?.data?.metaData?.documentationUrl || '',
  };
};
