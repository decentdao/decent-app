import { VStack, HStack, Text, Button, Flex } from '@chakra-ui/react';
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Address, isAddress } from 'viem';
import { BigIntInput } from '../../../../../components/ui/forms/BigIntInput';
import { TokenAddressInput } from '../../../../../components/ui/forms/TokenAddressInput';
import { BigIntValuePair } from '../../../../../types';
import { TokenBuyerRequirement } from '../../../../../types/tokenSale';

interface TokenRequirementFormProps {
  onSubmit: (requirement: TokenBuyerRequirement) => void;
  onCancel: () => void;
  initialData?: TokenBuyerRequirement;
}

interface TokenInfo {
  name: string;
  symbol: string;
  decimals: number;
}

export function TokenRequirementForm({ onSubmit, initialData }: TokenRequirementFormProps) {
  const { t } = useTranslation('tokenSale');
  const [tokenAddress, setTokenAddress] = useState<string>(initialData?.tokenAddress || '');
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(
    initialData
      ? {
          name: initialData.tokenName || '',
          symbol: initialData.tokenSymbol || '',
          decimals: initialData.tokenDecimals || 18,
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

  // Real-time validation for token address format
  useEffect(() => {
    if (!tokenAddress.trim()) {
      setInputError('');
      setHasAttemptedLookup(false);
      return;
    }

    // Basic address format validation - this should show immediately
    if (!isAddress(tokenAddress.trim())) {
      setInputError(t('tokenAddressInvalidError'));
      setHasAttemptedLookup(false);
      return;
    }

    setInputError('');
    // Reset lookup state when address changes
    setHasAttemptedLookup(false);
  }, [tokenAddress, t]);

  // Handle token info updates from TokenAddressInput - use useCallback to prevent re-fetching
  const handleTokenInfo = useCallback(
    (info: TokenInfo | null) => {
      setTokenInfo(info);
      setHasAttemptedLookup(true);

      // If we have a valid address but no token info after lookup, show error
      if (tokenAddress && isAddress(tokenAddress) && !info) {
        setInputError(t('tokenAddressInvalidError'));
      } else if (info) {
        // Clear error when we successfully get token info
        setInputError('');
      }

      setError('');
    },
    [tokenAddress, t],
  );

  // Show loading state or error based on lookup status
  const shouldShowError = inputError && (hasAttemptedLookup || !isAddress(tokenAddress));

  const handleSubmit = () => {
    if (!tokenAddress) {
      setError(t('tokenAddressRequiredError'));
      return;
    }

    if (!tokenInfo) {
      setError(t('tokenAddressInvalidError'));
      return;
    }

    if (!minimumBalance.bigintValue || minimumBalance.bigintValue <= 0n) {
      setError(t('minimumBalanceGreaterThanZeroError'));
      return;
    }

    const requirement: TokenBuyerRequirement = {
      type: 'token',
      tokenAddress: tokenAddress as Address,
      tokenName: tokenInfo.name,
      tokenSymbol: tokenInfo.symbol,
      tokenDecimals: tokenInfo.decimals,
      minimumBalance: minimumBalance.bigintValue,
    };

    onSubmit(requirement);
  };

  const isValid =
    tokenAddress && tokenInfo && minimumBalance.bigintValue && minimumBalance.bigintValue > 0n;

  return (
    <VStack
      spacing={4}
      align="stretch"
    >
      {/* Token Field */}
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
            {t('tokenFieldLabel')}
          </Text>
          <Text
            fontSize="sm"
            color="color-error-400"
          >
            *
          </Text>
        </HStack>
        <TokenAddressInput
          value={tokenAddress}
          onChange={e => {
            setTokenAddress(e.target.value);
            setError('');
          }}
          onTokenInfo={handleTokenInfo}
          placeholder={t('tokenAddressPlaceholder')}
          isInvalid={!!(shouldShowError || (error && error.includes('address')))}
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
          decimals={tokenInfo?.decimals || 18}
          isInvalid={!!error && error.includes('balance')}
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
