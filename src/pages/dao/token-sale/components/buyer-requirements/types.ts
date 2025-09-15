export interface BuyerRequirement {
  id: string;
  type: 'token' | 'nft' | 'whitelist';
  name: string;
  description: string;
}
