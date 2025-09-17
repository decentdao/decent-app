import { VStack, HStack, Text, Button, Flex } from '@chakra-ui/react';
import { useState } from 'react';
import { Address } from 'viem';
import { BigIntInput } from '../../../../../components/ui/forms/BigIntInput';
import { NFTAddressInput } from '../../../../../components/ui/forms/NFTAddressInput';
import { BigIntValuePair } from '../../../../../types';
import { NFTBuyerRequirement } from '../../../../../types/tokenSale';

interface NFTRequirementFormProps {
  onSubmit: (requirement: NFTBuyerRequirement) => void;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onCancel: () => void;
  initialData?: NFTBuyerRequirement;
}

interface NFTInfo {
  name: string;
  symbol: string;
  standard: 'ERC721' | 'ERC1155';
}

export function NFTRequirementForm({
  onSubmit,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onCancel,
  initialData,
}: NFTRequirementFormProps) {
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

  const handleSubmit = () => {
    if (!contractAddress) {
      setError('NFT contract address is required');
      return;
    }

    if (!nftInfo) {
      setError('Please enter a valid NFT contract address (ERC721 or ERC1155)');
      return;
    }

    if (!minimumBalance.bigintValue || minimumBalance.bigintValue <= 0n) {
      setError('Minimum amount must be greater than 0');
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
            NFT
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
          onNFTInfo={info => {
            setNFTInfo(info);
            setError('');
          }}
          placeholder="Paste NFT contract address"
          isInvalid={!!error && (error.includes('address') || error.includes('valid NFT'))}
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
          decimals={0}
          isInvalid={!!error && error.includes('amount')}
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
