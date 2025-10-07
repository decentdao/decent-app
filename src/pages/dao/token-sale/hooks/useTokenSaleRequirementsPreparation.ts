import { useCallback } from 'react';
import { Address } from 'viem';
import { TokenSaleFormValues } from '../../../../types/tokenSale';

enum TokenSaleRequirementType {
  KYC = 'kyc',
  ERC20 = 'erc20',
  ERC721 = 'erc721',
  ERC1155 = 'erc1155',
  WHITELIST = 'whitelist',
}

type BaseRequirement = {
  type: TokenSaleRequirementType;
};

interface ERC20Requirement extends BaseRequirement {
  type: TokenSaleRequirementType.ERC20;
  tokenAddress: Address;
  amount: bigint;
}

interface ERC721Requirement extends BaseRequirement {
  type: TokenSaleRequirementType.ERC721;
  tokenAddress: Address;
  amount: bigint;
}

interface ERC1155Requirement extends BaseRequirement {
  type: TokenSaleRequirementType.ERC1155;
  tokenAddress: Address;
  tokenId: bigint;
  amount: bigint;
}

interface WhitelistRequirement extends BaseRequirement {
  type: TokenSaleRequirementType.WHITELIST;
  addresses: Address[];
}

interface KYCRequirement extends BaseRequirement {
  type: TokenSaleRequirementType.KYC;
  provider: string;
}

export interface TokenSaleRequirements {
  tokenSaleAddress: Address;
  tokenSaleName: string;
  buyerRequirements: (
    | ERC20Requirement
    | ERC721Requirement
    | ERC1155Requirement
    | WhitelistRequirement
  )[];
  kyc: KYCRequirement | null;
  orOutOf?: number; // Number of requirements that must be met, undefined means all
}

export function useTokenSaleRequirementsPreparation() {
  const prepareRequirements = useCallback(
    (values: TokenSaleFormValues, tokenSaleAddress: Address) => {
      if (!values.tokenAddress || !values.saleName) {
        throw new Error('Sale Form not ready');
      }

      let buyerRequirements: TokenSaleRequirements['buyerRequirements'] = [];
      for (const requirement of values.buyerRequirements) {
        if (requirement.type === 'token') {
          buyerRequirements.push({
            type: TokenSaleRequirementType.ERC20,
            tokenAddress: requirement.tokenAddress,
            amount: requirement.minimumBalance,
          });
        } else if (requirement.type === 'nft') {
          if (requirement.tokenStandard === 'ERC721') {
            buyerRequirements.push({
              type: TokenSaleRequirementType.ERC721,
              tokenAddress: requirement.contractAddress,
              amount: requirement.minimumBalance,
            });
          } else {
            if (!requirement.tokenId) {
              throw new Error('Token ID is required for ERC1155 requirement');
            }
            buyerRequirements.push({
              type: TokenSaleRequirementType.ERC1155,
              tokenAddress: requirement.contractAddress,
              tokenId: requirement.tokenId,
              amount: requirement.minimumBalance,
            });
          }
        } else if (requirement.type === 'whitelist') {
          buyerRequirements.push({
            type: TokenSaleRequirementType.WHITELIST,
            addresses: requirement.addresses,
          });
        }
      }
      let kyc: KYCRequirement | null = null;
      if (values.kycEnabled) {
        kyc = {
          type: TokenSaleRequirementType.KYC,
          provider: 'sumsub',
        };
      }
      // Calculate orOutOf value
      let orOutOf: number | undefined;
      if (values.buyerRequirements.length > 0 && values.orOutOf) {
        if (values.orOutOf === 'all') {
          // 'all' means all requirements must be met, so we send the full length
          orOutOf = values.buyerRequirements.length;
        } else {
          // Specific number of requirements that must be met
          orOutOf = values.orOutOf;
        }
      }

      return {
        tokenSaleAddress: tokenSaleAddress,
        tokenSaleName: values.saleName,
        buyerRequirements,
        kyc,
        orOutOf,
      };
    },
    [],
  );

  return {
    prepareRequirements,
  };
}
