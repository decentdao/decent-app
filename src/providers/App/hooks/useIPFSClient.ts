import axios from 'axios';
import { useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

interface IPFSAddResponse {
  Hash: string;
  Name: string;
  Size: string;
}

export const INFURA_AUTH =
  'Basic ' +
  Buffer.from(
    `${import.meta.env.VITE_APP_INFURA_IPFS_API_KEY}:${import.meta.env.VITE_APP_INFURA_IPFS_API_SECRET}`,
  ).toString('base64');
export const GATEWAY_URL = 'https://ipfs.infura.io';
export const BASE_URL = GATEWAY_URL + ':5001/api/v0';

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

  const add = useCallback(
    async (data: string | Blob, onProgress?: (percent: number) => void) => {
      const formData = new FormData();
      formData.append('file', data);

      return axiosClient
        .post<IPFSAddResponse>(`${BASE_URL}/add`, formData, {
          onUploadProgress: (event: ProgressEvent) => {
            if (event.lengthComputable) {
              const percent = Math.round((event.loaded / event.total) * 100);
              onProgress?.(Math.min(percent, 80));
            } else {
              onProgress?.(50);
            }
          },
        })
        .then(response => {
          onProgress?.(0);
          return response.data;
        })
        .catch(error => {
          onProgress?.(0);
          console.error(error);
          toast.error(t('ipfsSavingErrorMessage'));
          throw error;
        });
    },
    [t],
  );

  const client = useMemo(
    () => ({
      cat,
      add,
    }),
    [cat, add],
  );

  return client;
}
