import { VStack, Flex, Text, Button, Box, IconButton, Icon } from '@chakra-ui/react';
import { Plus, Trash } from '@phosphor-icons/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Address } from 'viem';
import { AddressInputInfoTable } from '../../../../../components/ui/forms/AddressInputInfoTable';
import { WhitelistBuyerRequirement } from '../../../../../types/tokenSale';
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
  const [error, setError] = useState<string>('');

  const handleAddFromDropzone = (newAddresses: Address[]) => {
    const uniqueAddresses = [...addresses];
    newAddresses.forEach(addr => {
      if (!uniqueAddresses.some(existing => existing.toLowerCase() === addr.toLowerCase())) {
        uniqueAddresses.push(addr);
      }
    });
    setAddresses(uniqueAddresses);
    setError('');
  };

  const handleAddAddress = () => {
    if (!newAddress.trim()) {
      return;
    }

    const address = newAddress.trim() as Address;
    setAddresses([...addresses, address]);
    setNewAddress('');
    setError('');
  };

  const handleRemoveAddress = (index: number) => {
    setAddresses(addresses.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    const requirement: WhitelistBuyerRequirement = {
      type: 'whitelist',
      name: `Whitelist (${addresses.length} addresses)`,
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
                setError('');
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddAddress();
                }
              }}
              placeholder={t('whitelistAddressPlaceholder')}
              isInvalid={!!error}
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
                setError('');
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
      {error && (
        <Text
          fontSize="sm"
          color="color-error-400"
        >
          {error}
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
