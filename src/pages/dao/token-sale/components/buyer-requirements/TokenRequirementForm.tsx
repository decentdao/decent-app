import { VStack, Button, Flex } from '@chakra-ui/react';
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Address, isAddress, formatUnits } from 'viem';
import { BigIntInput } from '../../../../../components/ui/forms/BigIntInput';
import { LabelComponent } from '../../../../../components/ui/forms/InputComponent';
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
      ? {
          value: formatUnits(initialData.minimumBalance, initialData.tokenDecimals || 18),
          bigintValue: initialData.minimumBalance,
        }
      : { value: '', bigintValue: undefined },
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
        <LabelComponent
          isRequired
          label={t('tokenFieldLabel')}
          gridContainerProps={{
            templateColumns: '1fr',
          }}
        >
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
        </LabelComponent>
      </VStack>

      {/* Minimum Amount Field */}
      <VStack
        align="stretch"
        spacing={2}
      >
        <LabelComponent
          isRequired
          label={t('minimumAmountLabel')}
          errorMessage={error || (shouldShowError ? inputError : undefined)}
          gridContainerProps={{
            templateColumns: '1fr',
          }}
        >
          <BigIntInput
            value={minimumBalance}
            onChange={value => {
              setMinimumBalance(value);
              setError('');
            }}
            decimals={tokenInfo?.decimals || 18}
            isInvalid={!!error && error.includes('balance')}
          />
        </LabelComponent>
      </VStack>

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
