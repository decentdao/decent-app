// For assets/dapps.json
import * as yup from 'yup';

export interface Dapp {
  id: number;
  url: string;
  name: string;
  iconUrl: string;
  description: string;
  chainIds: string[];
  tags: string[];
  features: string[];
  featured?: boolean | undefined;
  enableWalletConnect?: boolean | undefined;
}

export const dappSchema = yup.object().shape({
  id: yup.number().required(),
  url: yup.string().url().required(),
  name: yup.string().required(),
  iconUrl: yup.string().url().required(),
  description: yup.string().required(),
  chainIds: yup.array().of(yup.string().required()).required(),
  tags: yup.array().of(yup.string().required()).required(),
  features: yup.array().of(yup.string().required()).required(),
  featured: yup.boolean(),
  enableWalletConnect: yup.boolean(),
});

export const dappsSchema = yup.array().of(dappSchema).required();
