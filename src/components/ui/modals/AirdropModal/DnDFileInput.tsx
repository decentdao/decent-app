import { Box, Flex, Text } from '@chakra-ui/react';
import { useFormikContext } from 'formik';
import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useTranslation } from 'react-i18next';
import { isAddress } from 'viem';
import { AirdropFormValues } from './AirdropModal';

export const parseRecipients = (csvText: string, decimals: number) => {
  const rows = csvText
    .split('\n')
    .map(row => row.trim())
    .filter(row => {
      if (!row) return false;
      const [address, amount] = row.split(',').map(cell => cell.trim());
      return isAddress(address) && parseFloat(amount) > 0;
    });

  return rows.map(row => {
    const [address, amount] = row.split(',').map(cell => cell.trim());
    return {
      address,
      amount: {
        value: amount,
        bigintValue: BigInt(parseFloat(amount) * 10 ** decimals),
      },
    };
  });
};

export function DnDFileInput() {
  const { setFieldValue, values } = useFormikContext<AirdropFormValues>();
  const { t } = useTranslation(['modals']);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      const reader = new FileReader();

      reader.onload = e => {
        const text = e.target?.result as string;
        try {
          const recipients = parseRecipients(text, values.selectedAsset.decimals);
          setFieldValue('recipients', recipients);
        } catch (error) {
          console.error('Error processing CSV:', error);
        }
      };

      reader.readAsText(file);
    },
    [setFieldValue, values.selectedAsset.decimals],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
    },
    multiple: false,
  });

  return (
    <Flex
      direction="column"
      gap="1rem"
    >
      <Box
        {...getRootProps()}
        p="1rem"
        border="1px dashed"
        borderColor={isDragActive ? 'lilac-0' : 'neutral-3'}
        borderRadius="sm"
        bg="neutral-1"
        cursor="pointer"
        textAlign="center"
        transition="border-color 0.2s ease-in-out"
        _hover={{ borderColor: 'lilac-0' }}
      >
        <input {...getInputProps()} />
        <Text>{isDragActive ? t('dropCSVHere') : t('dragDropCSV')}</Text>
        <Text
          fontSize="sm"
          color="neutral-7"
          mt="0.5rem"
        >
          {t('csvFormat')}
        </Text>
      </Box>
    </Flex>
  );
}
