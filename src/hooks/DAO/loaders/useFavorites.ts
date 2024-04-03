import { ethers } from 'ethers';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFractal } from '../../../providers/App/AppProvider';
import { CacheKeys, CacheExpiry } from '../../utils/cache/cacheDefaults';
import { useLocalStorage } from '../../utils/cache/useLocalStorage';

/**
 * handles loading favorites data into Fractal state
 */
export const useAccountFavorites = () => {
  const {
    node: { daoAddress },
  } = useFractal();

  const { setValue, getValue } = useLocalStorage();
  const [favoritesList, setFavoritesList] = useState<string[]>([]);

  useEffect(() => {
    let favorites = getValue(CacheKeys.FAVORITES);
    if (!!daoAddress && Array.isArray(favorites) && favorites.includes(daoAddress)) {
      favorites = favorites.filter((favorite: string) => favorite !== daoAddress);
    }
    setFavoritesList(favorites);
  }, [getValue, daoAddress]);

  /**
   * @returns favorited status of loaded safe
   */
  const isConnectedFavorited = useMemo(
    () => (!daoAddress ? false : favoritesList.includes(daoAddress)),
    [daoAddress, favoritesList],
  );

  /**
   * toggles the given address's favorited status
   *
   * if IS favorited it will remove from the address from local storage and state favorite lists
   * if NOT favorited, the address will be saved to local storage and state favorites
   */
  const toggleFavorite = useCallback(
    (address: string) => {
      const normalizedAddress = ethers.utils.getAddress(address);
      let updatedFavorites: string[] = [];

      if (favoritesList.includes(normalizedAddress)) {
        updatedFavorites = favoritesList.filter(favorite => favorite !== normalizedAddress);
      } else {
        updatedFavorites = favoritesList.concat([normalizedAddress]);
      }
      setFavoritesList(updatedFavorites);
      setValue(CacheKeys.FAVORITES, updatedFavorites, CacheExpiry.NEVER);
    },
    [favoritesList, setValue],
  );

  return { favoritesList, isConnectedFavorited, toggleFavorite };
};
