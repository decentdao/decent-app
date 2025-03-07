import { useState, useCallback } from 'react';
import { Address, isAddress, getAddress, zeroAddress } from 'viem';
import { normalize } from 'viem/ens';
import { useNetworkEnsAddressAsync } from '../useNetworkEnsAddress';

type ResolveENSNameReturnType = {
  resolvedAddress: Address;
  isValid: boolean;
};
export const useResolveENSName = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { getEnsAddress } = useNetworkEnsAddressAsync();

  const resolveENSName = useCallback(
    async (input: string, chainId?: number): Promise<ResolveENSNameReturnType> => {
      setIsLoading(true);

      const returnedResult: ResolveENSNameReturnType = {
        resolvedAddress: zeroAddress,
        isValid: false,
      };

      if (input === '') {
        throw new Error('ENS name is empty');
      }

      if (isAddress(input)) {
        // @dev if its a valid address, its valid on all networks
        returnedResult.isValid = true;
        returnedResult.resolvedAddress = getAddress(input);
        setIsLoading(false);
        return returnedResult;
      }

      // @dev if its not an address, try to resolve as possible ENS name on all networks
      let normalizedName: string;
      try {
        normalizedName = normalize(input);
      } catch {
        setIsLoading(false);
        return returnedResult;
      }

      const resolvedAddress = await getEnsAddress({ name: normalizedName, chainId });
      if (resolvedAddress) {
        returnedResult.resolvedAddress = resolvedAddress;
        returnedResult.isValid = true;
      }

      setIsLoading(false);
      return returnedResult;
    },
    [getEnsAddress],
  );

  return { resolveENSName, isLoading };
};
