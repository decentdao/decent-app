import { useEffect, useState } from 'react';
import { Address, isAddress, getAddress } from 'viem';
import { normalize } from 'viem/ens';
import { useNetworkEnsAddressAsync } from '../useNetworkEnsAddress';

const useAddress = (addressInput: string) => {
  const { getEnsAddress } = useNetworkEnsAddressAsync();
  const [address, setAddress] = useState<Address>();
  const [isValid, setIsValid] = useState<boolean>();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    setAddress(undefined);
    setIsValid(undefined);
    setIsLoading(false);

    if (addressInput === '') {
      return;
    }

    setIsLoading(true);

    if (isAddress(addressInput)) {
      // addressInput is a string, so if it's a valid address but not checksummed
      // we want it to be checksummed, which getAddress does
      setAddress(getAddress(addressInput));
      setIsValid(true);
      setIsLoading(false);
      return;
    }

    let normalizedAddress: string;
    try {
      normalizedAddress = normalize(addressInput);
    } catch (error) {
      setAddress(undefined);
      setIsValid(false);
      setIsLoading(false);
      return;
    }
    // @todo this should be mainnet?
    getEnsAddress({ name: normalizedAddress })
      .then(resolvedAddress => {
        if (resolvedAddress) {
          setAddress(resolvedAddress);
          setIsValid(true);
        } else {
          setAddress(undefined);
          setIsValid(false);
        }
      })
      .catch(() => {
        setAddress(undefined);
        setIsValid(false);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [addressInput, getEnsAddress]);

  return { address, isValid, isLoading };
};

export default useAddress;
