import { VStack, HStack, Text, Button, Flex } from '@chakra-ui/react';
import { useState } from 'react';
import { Address } from 'viem';
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

  const handleSubmit = () => {
    if (!tokenAddress) {
      setError('Token address is required');
      return;
    }

    if (!tokenInfo) {
      setError('Invalid token address');
      return;
    }

    if (!minimumBalance.bigintValue || minimumBalance.bigintValue <= 0n) {
      setError('Minimum balance must be greater than 0');
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
            Token
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
          onTokenInfo={setTokenInfo}
          placeholder="Select Token"
          isInvalid={!!error && error.includes('address')}
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
          Minimum Amount
        </Text>
        <BigIntInput
          value={minimumBalance}
          onChange={setMinimumBalance}
          decimals={tokenInfo?.decimals || 18}
          isInvalid={!!error && error.includes('balance')}
        />
      </VStack>

      {/* Error Display */}
      {error && (
        <Text
          fontSize="sm"
          color="color-error-400"
        >
          {error}
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
          Add Requirement
        </Button>
      </Flex>
    </VStack>
  );
}
