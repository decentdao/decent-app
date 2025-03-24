// For assets/dapps.json
export interface Dapp {
  id: number;
  url: string;
  name: string;
  iconUrl: string;
  description: string;
  chainIds: string[];
  tags: string[];
  features: string[];
  featured: boolean;
}
