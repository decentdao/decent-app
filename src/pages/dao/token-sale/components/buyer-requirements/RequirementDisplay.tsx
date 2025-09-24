import { useTranslation } from 'react-i18next';
import { formatUnits } from 'viem';
import { BuyerRequirement } from '../../../../../types/tokenSale';

const getRequirementDisplay = (requirement: BuyerRequirement, t: any): string => {
  if (!requirement || !requirement.type) {
    console.warn('Invalid requirement passed to getRequirementDisplay:', requirement);
    return '';
  }

  switch (requirement.type) {
    case 'token':
      const decimals = requirement.tokenDecimals || 18;
      const tokenAmount = formatUnits(requirement.minimumBalance, decimals);
      const tokenSymbol = requirement.tokenName || requirement.tokenSymbol || 'Token';
      return t('holdAtLeastToken', { amount: tokenAmount, symbol: tokenSymbol });

    case 'nft':
      const nftAmount = requirement.minimumBalance.toString();
      const nftName =
        requirement.collectionName || `${requirement.tokenStandard || 'NFT'} Collection`;

      // For ERC1155, include token ID in the display
      if (requirement.tokenStandard === 'ERC1155' && requirement.tokenId !== undefined) {
        return t('holdAtLeastNftWithTokenId', {
          amount: nftAmount,
          name: nftName,
          tokenId: requirement.tokenId.toString(),
        });
      }

      return t('holdAtLeastNft', { amount: nftAmount, name: nftName });

    case 'whitelist':
      return t('beIncludedInWhitelist');

    default:
      console.warn('Unknown requirement type:', (requirement as any).type);
      return '';
  }
};

export const useRequirementDisplay = () => {
  const { t } = useTranslation('tokenSale');

  return {
    getRequirementDisplay: (requirement: BuyerRequirement) => getRequirementDisplay(requirement, t),
  };
};
