import csv from 'csvtojson';
export function floatStringToBigInt(str: string, decimals: number): bigint {
  // Step 1: Split integer and fraction
  const [intPart, fracPart = ''] = str.split('.');

  // Step 2: Normalize fractional part to desired decimals
  const normalizedFrac = (fracPart + '0'.repeat(decimals)).slice(0, decimals);

  // Step 3: Combine parts and convert to BigInt
  const combined = intPart + normalizedFrac;

  return BigInt(combined);
}

export const parseCsvText = (text: string, tabDelimited: boolean) => {
  const converter = csv({
    delimiter: tabDelimited ? '\t' : 'auto',
    noheader: true,
    trim: true,
    output: 'csv', // Output as array of arrays
  });
  return converter.fromString(text);
};
