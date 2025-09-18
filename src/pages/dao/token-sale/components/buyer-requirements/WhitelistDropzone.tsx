import { Box, Flex, Text, Button, Icon } from '@chakra-ui/react';
import { UploadSimple } from '@phosphor-icons/react';
import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useTranslation } from 'react-i18next';
import { isAddress, Address } from 'viem';

interface WhitelistDropzoneProps {
  onAddresses: (addresses: Address[]) => void;
}

const parseAddressesFromText = (text: string): Address[] => {
  const lines = text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  const validAddresses: Address[] = [];

  lines.forEach(line => {
    // Handle CSV format (address, or address,name, etc.)
    const address = line.split(',')[0].trim();
    if (isAddress(address)) {
      validAddresses.push(address as Address);
    }
  });

  return validAddresses;
};

export function WhitelistDropzone({ onAddresses }: WhitelistDropzoneProps) {
  const { t } = useTranslation('tokenSale');
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      const reader = new FileReader();

      reader.onload = e => {
        const text = e.target?.result as string;
        const addresses = parseAddressesFromText(text);
        onAddresses(addresses);
      };

      reader.readAsText(file);
    },
    [onAddresses],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'text/plain': ['.txt'],
    },
    multiple: false,
  });

  return (
    <Box
      {...getRootProps()}
      p={3}
      border="1px dashed"
      borderColor="color-neutral-800"
      borderRadius="8px"
      cursor="pointer"
      transition="border-color 0.2s ease-in-out"
      _hover={{ borderColor: 'color-neutral-700' }}
      bg={isDragActive ? 'color-neutral-900' : 'transparent'}
    >
      <input {...getInputProps()} />
      <Flex
        align="center"
        gap={4}
      >
        <Button
          size="sm"
          variant="secondary"
          leftIcon={
            <Icon
              as={UploadSimple}
              boxSize="1rem"
            />
          }
          bg="color-content-content2"
          color="color-base-secondary-foreground"
          fontSize="xs"
          fontWeight="medium"
          h="32px"
          px={3}
          _hover={{ bg: 'color-content-content2' }}
        >
          {t('whitelistUploadButtonText')}
        </Button>
        <Box>
          <Text
            fontSize="sm"
            fontWeight="medium"
            color="color-base-secondary-foreground"
            lineHeight="20px"
          >
            {t('whitelistDropzoneText')}
          </Text>
          <Text
            fontSize="xs"
            color="color-content-muted-foreground"
            lineHeight="16px"
          >
            {t('whitelistDropzoneSubtext')}
          </Text>
        </Box>
      </Flex>
    </Box>
  );
}
