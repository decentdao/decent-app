import { useState, useEffect } from 'react';
import * as yup from 'yup';
import dappsData from '../../../assets/dapps.json';
import { Dapp, dappsSchema } from '../../../types';

export function useSupportedDapps(chainId: number) {
  const [dapps, setDapps] = useState<Dapp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDapps() {
      try {
        setLoading(true);
        // Validate the dapps data using the schema
        const validatedDapps = await dappsSchema.validate(dappsData, {
          abortEarly: false, // Validate all fields
        });
        const supportedDapps =
          validatedDapps.filter(dapp => dapp.chainIds.includes(chainId.toString())) || [];
        setDapps(supportedDapps);
      } catch (err) {
        if (err instanceof yup.ValidationError) {
          console.error('Validation errors:', err.errors);
          setError('Validation errors: ' + err.errors.join(', '));
        } else {
          console.error('Unexpected error:', err);
          setError('Failed to load and validate dapps data');
        }
      } finally {
        setLoading(false);
      }
    }

    fetchDapps();
  }, [chainId]);

  return { dapps, loading, error };
}
