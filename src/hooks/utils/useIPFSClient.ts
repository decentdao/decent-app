import axios from 'axios';
import { useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

const INFURA_AUTH =
  'Basic ' +
  Buffer.from(
    `${import.meta.env.VITE_APP_INFURA_IPFS_API_KEY}:${import.meta.env.VITE_APP_INFURA_IPFS_API_SECRET}`,
  ).toString('base64');
const BASE_URL = 'https://ipfs.infura.io:5001/api/v0';

const axiosClient = axios.create({ baseURL: BASE_URL, headers: { Authorization: INFURA_AUTH } });

export default function useIPFSClient() {
  const { t } = useTranslation('common');

  const cat = useCallback(
    async (hash: string) => {
      return axiosClient
        .post(`${BASE_URL}/cat?arg=${hash}`)
        .then(response => response.data)
        .catch(error => {
          console.error(error);
          toast.error(t('ipfsLoadingErrorMessage'));
        });
    },
    [t],
  );

  const add = useCallback(async (data: string) => {
    const formData = new FormData();
    formData.append('file', data);

    return axiosClient
      .post(`${BASE_URL}/add`, formData)
      .then(response => response.data)
      .catch(error => {
        console.error(error);
        toast.error('ipfsSavingErrorMessage');
      });
  }, []);

  const client = useMemo(
    () => ({
      cat,
      add,
    }),
    [cat, add],
  );

  return client;
}
