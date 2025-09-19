import { VStack, HStack, Text, Button, Flex } from '@chakra-ui/react';
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Address, isAddress } from 'viem';
import { BigIntInput } from '../../../../../components/ui/forms/BigIntInput';
import { NFTAddressInput } from '../../../../../components/ui/forms/NFTAddressInput';
import { BigIntValuePair } from '../../../../../types';
import { NFTBuyerRequirement } from '../../../../../types/tokenSale';

interface NFTRequirementFormProps {
  onSubmit: (requirement: NFTBuyerRequirement) => void;
  onCancel: () => void;
  initialData?: NFTBuyerRequirement;
}

interface NFTInfo {
  name: string;
  symbol: string;
  standard: 'ERC721' | 'ERC1155';
}

export function NFTRequirementForm({ onSubmit, initialData }: NFTRequirementFormProps) {
  const { t } = useTranslation('tokenSale');
  const [contractAddress, setContractAddress] = useState<string>(
    initialData?.contractAddress || '',
  );
  const [nftInfo, setNFTInfo] = useState<NFTInfo | null>(
    initialData
      ? {
          name: initialData.collectionName || '',
          symbol: '',
          standard: initialData.tokenStandard,
        }
      : null,
  );
  const [minimumBalance, setMinimumBalance] = useState<BigIntValuePair>(
    initialData
      ? { value: initialData.minimumBalance.toString(), bigintValue: initialData.minimumBalance }
      : { value: '1', bigintValue: BigInt(1) },
  );
  const [error, setError] = useState<string>('');
  const [inputError, setInputError] = useState<string>('');
  const [hasAttemptedLookup, setHasAttemptedLookup] = useState<boolean>(false);

  // Real-time validation for contract address format
  useEffect(() => {
    if (!contractAddress.trim()) {
      setInputError('');
      setHasAttemptedLookup(false);
      return;
    }

    // Basic address format validation - this should show immediately
    if (!isAddress(contractAddress.trim())) {
      setInputError(t('nftAddressInvalidError'));
      setHasAttemptedLookup(false);
      return;
    }

    setInputError('');
    // Reset lookup state when address changes
    setHasAttemptedLookup(false);
  }, [contractAddress, t]);

  // Handle NFT info updates from NFTAddressInput - use useCallback to prevent re-fetching
  const handleNFTInfo = useCallback(
    (info: NFTInfo | null) => {
      setNFTInfo(info);
      setHasAttemptedLookup(true);

      // If we have a valid address but no NFT info after lookup, show error
      if (contractAddress && isAddress(contractAddress) && !info) {
        setInputError(t('nftAddressInvalidError'));
      } else if (info) {
        // Clear error when we successfully get NFT info
        setInputError('');
      }

      setError('');
    },
    [contractAddress, t],
  );

  // Show loading state or error based on lookup status
  const shouldShowError = inputError && (hasAttemptedLookup || !isAddress(contractAddress));

  const handleSubmit = () => {
    if (!contractAddress) {
      setError(t('nftAddressRequiredError'));
      return;
    }

    if (!nftInfo) {
      setError(t('nftAddressInvalidError'));
      return;
    }

    if (!minimumBalance.bigintValue || minimumBalance.bigintValue <= 0n) {
      setError(t('minimumAmountGreaterThanZeroError'));
      return;
    }

    const requirement: NFTBuyerRequirement = {
      type: 'nft',
      contractAddress: contractAddress as Address,
      collectionName: nftInfo.name,
      tokenStandard: nftInfo.standard,
      minimumBalance: minimumBalance.bigintValue,
    };

    onSubmit(requirement);
  };

  const isValid =
    contractAddress && nftInfo && minimumBalance.bigintValue && minimumBalance.bigintValue > 0n;

  return (
    <VStack
      spacing={4}
      align="stretch"
    >
      {/* NFT Field */}
      <VStack
        align="stretch"
        spacing={2}
      >
        <HStack spacing={1}>
          <Text
            fontSize="sm"
            fontWeight="medium"
            color="color-white"
          >
            {t('nftFieldLabel')}
          </Text>
          <Text
            fontSize="sm"
            color="color-error-400"
          >
            *
          </Text>
        </HStack>
        <NFTAddressInput
          value={contractAddress}
          onChange={e => {
            setContractAddress(e.target.value);
            setError('');
          }}
          onNFTInfo={handleNFTInfo}
          placeholder={t('nftAddressPlaceholder')}
          isInvalid={
            !!(
              shouldShowError ||
              (error && (error.includes('address') || error.includes('valid NFT')))
            )
          }
        />
      </VStack>

      {/* Minimum Amount Field */}
      <VStack
        align="stretch"
        spacing={2}
      >
        <Text
          fontSize="sm"
          fontWeight="medium"
          color="color-white"
        >
          {t('minimumAmountLabel')}
        </Text>
        <BigIntInput
          value={minimumBalance}
          onChange={value => {
            setMinimumBalance(value);
            setError('');
          }}
          decimals={0}
          isInvalid={!!error && error.includes('amount')}
        />
      </VStack>

      {/* Error Display */}
      {(shouldShowError || error) && (
        <Text
          fontSize="sm"
          color="color-error-400"
        >
          {shouldShowError ? inputError : error}
        </Text>
      )}

      {/* Action Button - Single button aligned right */}
      <Flex
        justify="flex-end"
        pt={4}
      >
        <Button
          variant="primary"
          onClick={handleSubmit}
          isDisabled={!isValid}
        >
          {t('addRequirementButton')}
        </Button>
      </Flex>
    </VStack>
  );
}
