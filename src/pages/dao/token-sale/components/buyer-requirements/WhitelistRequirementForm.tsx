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

  // Update addresses when initialData changes (for editing mode)
  useEffect(() => {
    if (initialData?.addresses) {
      setAddresses([...initialData.addresses]); // Create a copy to avoid reference issues
    } else {
      // Reset to empty when not editing (new requirement)
      setAddresses([]);
    }
    // Also clear any errors and input when switching modes
    setInputError('');
    setSubmitError('');
    setNewAddress('');
  }, [initialData]);

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
    setSubmitError(''); // Clear any submit errors when addresses are added
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
    setSubmitError(''); // Clear any submit errors when a new address is added
  };

  const handleRemoveAddress = (index: number) => {
    const updatedAddresses = addresses.filter((_, i) => i !== index);
    setAddresses(updatedAddresses);
    // Clear submit error if we still have addresses, or if we're removing the last one
    if (updatedAddresses.length > 0) {
      setSubmitError('');
    }
  };

  const handleSubmit = () => {
    // Clear any previous submit errors
    setSubmitError('');
    
    // Check if there's a valid address in the input field that hasn't been added yet
    let finalAddresses = [...addresses];
    if (newAddress.trim() && !inputError) {
      const address = newAddress.trim() as Address;
      // Check if it's not already in the list
      const isDuplicate = finalAddresses.some(existing => {
        if (isAddress(existing) && isAddress(address)) {
          return existing.toLowerCase() === address.toLowerCase();
        }
        return existing === address;
      });
      
      if (!isDuplicate) {
        finalAddresses.push(address);
      }
    }
    
    if (finalAddresses.length === 0) {
      setSubmitError(t('whitelistMinOneAddressError'));
      return;
    }

    // Create a fresh copy of addresses to avoid any reference issues
    const requirement: WhitelistBuyerRequirement = {
      type: 'whitelist',
      addresses: finalAddresses,
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
