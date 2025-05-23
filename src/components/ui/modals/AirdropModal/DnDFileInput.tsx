import { Box, Flex, Text } from '@chakra-ui/react';
import csv from 'csvtojson';
import { useFormikContext } from 'formik';
import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useTranslation } from 'react-i18next';
import { formatUnits, isAddress } from 'viem';
import { AirdropFormValues } from './AirdropModal';

function floatStringToBigInt(str: string, decimals: number): bigint {
  // Step 1: Split integer and fraction
  const [intPart, fracPart = ''] = str.split('.');

  // Step 2: Normalize fractional part to desired decimals
  const normalizedFrac = (fracPart + '0'.repeat(decimals)).slice(0, decimals);

  // Step 3: Combine parts and convert to BigInt
  const combined = intPart + normalizedFrac;

  return BigInt(combined);
}

const zeroBigInt = BigInt(0);

const parseCsvText = (text: string, tabDelimited: boolean) => {
  const converter = csv({
    delimiter: tabDelimited ? '\t' : 'auto',
    noheader: true,
    trim: true,
    output: 'csv', // Output as array of arrays
  });
  return converter.fromString(text);
};

const parseRecipientLines = (text: string[][], decimals: number) => {
  return text
    .map((row: any) => {
      const [address, amount] = row;
      const trimmedAmount = amount.replace(/[^\d.]/g, ''); // Remove commas
      const parsed = floatStringToBigInt(trimmedAmount, decimals);
      if (isAddress(address) && parsed > zeroBigInt) {
        return {
          address,
          amount: {
            value: formatUnits(parsed, decimals),
            bigintValue: parsed,
          },
        };
      } else {
        return null;
      }
    })
    .filter(row => row != null);
};

export const parseRecipients = async (text: string, decimals: number) => {
  return parseRecipientLines(await parseCsvText(text, text.includes('\t')), decimals);
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
        parseRecipients(text, values.selectedAsset.decimals)
          .then(recipients => {
            setFieldValue('recipients', recipients);
          })
          .catch(error => {
            console.error('Error processing CSV:', error);
          });
      };

      reader.readAsText(file);
    },
    [setFieldValue, values.selectedAsset.decimals],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'text/tsv': ['.tsv'],
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
        borderColor={isDragActive ? 'color-lilac-100' : 'neutral-3'}
        borderRadius="sm"
        bg="color-black"
        cursor="pointer"
        textAlign="center"
        transition="border-color 0.2s ease-in-out"
        _hover={{ borderColor: 'color-lilac-100' }}
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
