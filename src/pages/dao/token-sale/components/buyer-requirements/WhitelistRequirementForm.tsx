import { VStack, Flex, Text, Button, Box, IconButton, Icon } from '@chakra-ui/react';
import { Plus, Trash } from '@phosphor-icons/react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Address, isAddress } from 'viem';
import { AddressInputInfoTable } from '../../../../../components/ui/forms/AddressInputInfoTable';
import { WhitelistBuyerRequirement } from '../../../../../types/tokenSale';
import { validateENSName } from '../../../../../utils/url';
import { WhitelistDropzone } from './WhitelistDropzone';

interface WhitelistRequirementFormProps {
  onSubmit: (requirement: WhitelistBuyerRequirement) => void;
  onCancel: () => void;
  initialData?: WhitelistBuyerRequirement;
}

export function WhitelistRequirementForm({ onSubmit, initialData }: WhitelistRequirementFormProps) {
  const { t } = useTranslation('tokenSale');
  const [addresses, setAddresses] = useState<Address[]>(initialData?.addresses || []);
  const [newAddress, setNewAddress] = useState<string>('');
  const [inputError, setInputError] = useState<string>('');
  const [submitError, setSubmitError] = useState<string>('');

  // Validate input in real-time
  useEffect(() => {
    if (!newAddress.trim()) {
      setInputError('');
      return;
    }

    const trimmedAddress = newAddress.trim();

    // Check if it's a valid address or ENS name
    if (!isAddress(trimmedAddress) && !validateENSName(trimmedAddress)) {
      setInputError(t('whitelistInvalidAddressError'));
      return;
    }

    // Check for duplicates
    const isDuplicate = addresses.some(existing => {
      if (isAddress(existing) && isAddress(trimmedAddress)) {
        return existing.toLowerCase() === trimmedAddress.toLowerCase();
      }
      return existing === trimmedAddress;
    });

    if (isDuplicate) {
      setInputError(t('whitelistAddressExistsError'));
      return;
    }

    setInputError('');
  }, [newAddress, addresses, t]);

  const handleAddFromDropzone = (newAddresses: Address[]) => {
    const uniqueAddresses = [...addresses];
    newAddresses.forEach(addr => {
      if (!uniqueAddresses.some(existing => existing.toLowerCase() === addr.toLowerCase())) {
        uniqueAddresses.push(addr);
      }
    });
    setAddresses(uniqueAddresses);
    setSubmitError('');
  };

  const handleAddAddress = () => {
    if (!newAddress.trim()) {
      return;
    }

    const address = newAddress.trim() as Address;
    // Only add if there's no input error
    if (inputError) {
      return;
    }

    setAddresses([...addresses, address]);
    setNewAddress('');
    setInputError('');
  };

  const handleRemoveAddress = (index: number) => {
    setAddresses(addresses.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (addresses.length === 0) {
      setSubmitError(t('whitelistMinOneAddressError'));
      return;
    }

    const requirement: WhitelistBuyerRequirement = {
      type: 'whitelist',
      addresses,
    };

    onSubmit(requirement);
  };

  return (
    <VStack
      spacing={4}
      align="stretch"
    >
      {/* File Upload Section */}
      <WhitelistDropzone onAddresses={handleAddFromDropzone} />

      {/* Table Section */}
      <Box
        border="1px solid"
        borderColor="color-neutral-800"
        borderRadius="12px"
        overflow="hidden"
      >
        {/* Table Header */}
        <Flex
          bg="color-content-content2"
          borderBottom="1px solid"
          borderBottomColor="color-layout-divider"
          h="40px"
          align="center"
        >
          <Box
            flex={1}
            px={3}
          >
            <Text
              fontSize="sm"
              fontWeight="medium"
              color="color-content-content2-foreground"
            >
              {t('walletAddressTableHeader')}
            </Text>
          </Box>
          <Box
            w="92px"
            px={3}
            textAlign="right"
          >
            <Text
              fontSize="sm"
              fontWeight="medium"
              color="color-content-content2-foreground"
            >
              {t('actionsTableHeader')}
            </Text>
          </Box>
        </Flex>

        {/* Existing Addresses */}
        {addresses.map((address, index) => (
          <Flex
            key={address}
            bg="color-content-content1"
            borderBottom="1px solid"
            borderBottomColor="color-layout-divider"
            align="center"
            h="40px"
          >
            <Box
              flex={1}
              h="full"
            >
              <AddressInputInfoTable
                value={address}
                isReadOnly={true}
              />
            </Box>
            <Box
              w="92px"
              px={0.5}
              display="flex"
              justifyContent="center"
            >
              <IconButton
                aria-label={t('removeAddressAriaLabel')}
                icon={
                  <Icon
                    as={Trash}
                    boxSize="1rem"
                  />
                }
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveAddress(index)}
                color="color-error-400"
                _hover={{ bg: 'color-error-950' }}
              />
            </Box>
          </Flex>
        ))}

        {/* Input Row for new address */}
        <Flex
          bg="color-content-content1"
          borderBottom="1px solid"
          borderBottomColor="color-layout-divider"
          align="center"
          h="40px"
        >
          <Box
            flex={1}
            h="full"
          >
            <AddressInputInfoTable
              value={newAddress}
              onChange={e => {
                setNewAddress(e.target.value);
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddAddress();
                }
              }}
              placeholder={t('whitelistAddressPlaceholder')}
              isInvalid={!!inputError}
            />
          </Box>
          <Box
            w="92px"
            px={0.5}
            display="flex"
            justifyContent="center"
          >
            <IconButton
              aria-label={t('clearInputAriaLabel', 'Clear input')}
              icon={
                <Icon
                  as={Trash}
                  boxSize="1rem"
                />
              }
              variant="ghost"
              size="sm"
              onClick={() => {
                setNewAddress('');
                setInputError('');
              }}
              color="color-error-400"
              _hover={{ bg: 'color-error-950' }}
              visibility={newAddress ? 'visible' : 'hidden'}
            />
          </Box>
        </Flex>

        {/* Add Address Row */}
        <Flex
          bg="color-content-content1"
          align="center"
          cursor="pointer"
          onClick={handleAddAddress}
          _hover={{ bg: 'color-neutral-800' }}
        >
          <Box
            flex={1}
            p={0.5}
          >
            <Flex
              align="center"
              h="36px"
              px={3}
              gap={2}
            >
              <Icon
                as={Plus}
                boxSize="1rem"
                color="color-base-secondary-foreground"
              />
              <Text
                fontSize="sm"
                color="color-base-secondary-foreground"
                fontWeight="regular"
              >
                {t('addAddressText')}
              </Text>
            </Flex>
          </Box>
        </Flex>
      </Box>

      {/* Error Display */}
      {(inputError || submitError) && (
        <Text
          fontSize="sm"
          color="color-error-400"
        >
          {inputError || submitError}
        </Text>
      )}

      {/* Action Button */}
      <Flex
        justify="flex-end"
        pt={4}
      >
        <Button
          variant="primary"
          onClick={handleSubmit}
        >
          {t('addRequirementButton')}
        </Button>
      </Flex>
    </VStack>
  );
}
