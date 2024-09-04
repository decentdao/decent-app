import { useMemo, useRef, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Address, PublicClient, getAddress, isAddress } from 'viem';
import { normalize } from 'viem/ens';
import { usePublicClient } from 'wagmi';
import { AnyObject } from 'yup';
import { useFractal } from '../../../providers/App/AppProvider';
import { useNetworkConfig } from '../../../providers/NetworkConfig/NetworkConfigProvider';
import { AddressValidationMap, ERC721TokenConfig } from '../../../types';
import { validateENSName } from '../../../utils/url';

export async function validateAddress({
  publicClient,
  address,
  checkENS = true,
}: {
  publicClient: PublicClient;
  address: string;
  checkENS?: boolean;
}): Promise<{
  validation: { address: string; isValidAddress: boolean };
  isValid: boolean;
}> {
  if (checkENS && !isAddress(address)) {
    const resolvedAddress = await publicClient.getEnsAddress({ name: normalize(address) });
    if (resolvedAddress) {
      return {
        validation: {
          address: resolvedAddress,
          isValidAddress: true,
        },
        isValid: false,
      };
    } else {
      return {
        validation: {
          address: '',
          isValidAddress: false,
        },
        isValid: false,
      };
    }
  }
  const isValidAddress = isAddress(address);
  console.log('🚀 ~ isValidAddress:', isValidAddress);
  if (isValidAddress) {
    return {
      validation: {
        address,
        isValidAddress,
      },
      isValid: true,
    };
  } else {
    return {
      validation: {
        address: '',
        isValidAddress,
      },
      isValid: false,
    };
  }
}

export const useValidationAddress = () => {
  /**
   * addressValidationMap
   * @description holds ENS resolved addresses
   * @dev updated via the `addressValidation`
   * @dev this is used for any other functions contained within this hook, to lookup resolved addresses in this session without requesting again.
   */
  const addressValidationMap = useRef<AddressValidationMap>(new Map());
  // const signer = useEthersSigner();
  // const signerOrProvider = useSignerOrProvider();
  const { t } = useTranslation(['daoCreate', 'common', 'modals']);
  const {
    node: { safe },
  } = useFractal();
  const { chain } = useNetworkConfig();

  const publicClient = usePublicClient();

  const [isValidating, setIsValidating] = useState(false);

  const addressValidationTest = useMemo(() => {
    return {
      name: 'Address Validation',
      message: t('errorInvalidENSAddress', { ns: 'common', chain: chain.name }),
      test: async function (address: string | undefined) {
        if (!address || !publicClient) return false;
        setIsValidating(true);
        try {
          console.log('🚀 ~ address:', address);
          const { validation } = await validateAddress({ publicClient, address });
          console.log('🚀 ~ validation:', validation);
          if (validation.isValidAddress) {
            addressValidationMap.current.set(address, validation);
          }
          return validation.isValidAddress;
        } catch (error) {
          return false;
        } finally {
          setIsValidating(false);
        }
      },
    };
  }, [publicClient, addressValidationMap, t, chain.name]);

  const ensNameValidationTest = useMemo(() => {
    return {
      name: 'ENS Validation',
      message: t('errorInvalidENSName', { ns: 'common' }),
      test: async function (ensName: string | undefined) {
        if (ensName === undefined) return true;
        const isValid = validateENSName(ensName);
        return isValid;
      },
    };
  }, [t]);

  const addressValidationTestSimple = useMemo(() => {
    return {
      name: 'Address Validation',
      message: t('errorInvalidAddress', { ns: 'common' }),
      test: async function (address: string | undefined) {
        if (!address || !publicClient) return false;
        setIsValidating(true);
        const { validation } = await validateAddress({
          publicClient,
          address,
          checkENS: false,
        });
        if (validation.isValidAddress) {
          addressValidationMap.current.set(address, validation);
        }
        setIsValidating(false);
        return validation.isValidAddress;
      },
    };
  }, [publicClient, addressValidationMap, t]);

  const newSignerValidationTest = useMemo(() => {
    return {
      name: 'New Signer Validation',
      message: t('alreadySigner', { ns: 'modals' }),
      test: async function (addressOrENS: string | undefined) {
        if (!addressOrENS || !safe || !publicClient) return false;

        let resolvedAddress: Address | null;

        if (validateENSName(addressOrENS)) {
          resolvedAddress = await publicClient.getEnsAddress({
            name: normalize(addressOrENS),
          });

          if (!resolvedAddress) return false;
          return !safe.owners.includes(resolvedAddress);
        }

        resolvedAddress = getAddress(addressOrENS);
        return !safe.owners.includes(resolvedAddress);
      },
    };
  }, [safe, publicClient, t]);

  const testUniqueAddressArray = useCallback(
    async (value: string, addressArray: string[]) => {
      // looks up tested value
      let inputValidation = addressValidationMap.current.get(value);
      if (!!value && !inputValidation && publicClient) {
        inputValidation = (await validateAddress({ publicClient, address: value })).validation;
      }
      // converts all inputs to addresses to compare
      // uses addressValidationMap to save on requests
      const resolvedAddresses: string[] = await Promise.all(
        addressArray.map(async (address: string) => {
          // look up validated values
          const addressValidation = addressValidationMap.current.get(address);
          if (addressValidation && addressValidation.isValidAddress) {
            return addressValidation.address;
          }
          // because mapping is not 'state', this catches values that may not be resolved yet
          if (normalize(address) && publicClient) {
            const { validation } = await validateAddress({ publicClient, address });
            return validation.address;
          }
          return address;
        }),
      );

      const uniqueFilter = resolvedAddresses.filter(
        address => address === value || address === inputValidation?.address,
      );

      return uniqueFilter.length === 1;
    },
    [publicClient],
  );

  const uniqueAddressValidationTest = useMemo(() => {
    return {
      name: 'Unique Addresses',
      message: t('errorDuplicateAddress'),
      test: async function (value: string | undefined, context: AnyObject) {
        if (!value) return false;
        // retreive parent array
        const parentAddressArray = context.parent;
        const isUnique = await testUniqueAddressArray(value, parentAddressArray);
        return isUnique;
      },
    };
  }, [t, testUniqueAddressArray]);

  const uniqueNFTAddressValidationTest = useMemo(() => {
    return {
      name: 'Unique Address',
      message: t('errorDuplicateAddress'),
      test: async function (value: string | undefined, context: AnyObject) {
        if (!value) return false;
        // retreive parent array
        const parentAddressArray = context.from[1].value.nfts.map(
          ({ tokenAddress }: ERC721TokenConfig) => tokenAddress,
        );
        const isUnique = await testUniqueAddressArray(value, parentAddressArray);
        return isUnique;
      },
    };
  }, [t, testUniqueAddressArray]);

  return {
    addressValidationTestSimple,
    addressValidationTest,
    ensNameValidationTest,
    newSignerValidationTest,
    uniqueAddressValidationTest,
    uniqueNFTAddressValidationTest,
    isValidating,
  };
};
