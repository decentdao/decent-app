import { StateCreator } from 'zustand';
import { DAOKey } from '../../types';
import { TokenSaleData } from '../../types/tokenSale';
import { GlobalStore, StoreSlice, StoreMiddleware } from '../store';

export type TokenSalesSlice = {
  tokenSales: StoreSlice<TokenSaleData[]>;
  setTokenSales: (daoKey: DAOKey, tokenSales: TokenSaleData[]) => void;
  getTokenSales: (daoKey: DAOKey) => TokenSaleData[];
  addTokenSale: (daoKey: DAOKey, tokenSale: TokenSaleData) => void;
  updateTokenSale: (
    daoKey: DAOKey,
    tokenSaleAddress: string,
    updates: Partial<TokenSaleData>,
  ) => void;
  setTokenSale: (daoKey: DAOKey, tokenSale: TokenSaleData) => void;
};

export const createTokenSalesSlice: StateCreator<
  GlobalStore,
  StoreMiddleware,
  [],
  TokenSalesSlice
> = (set, get) => ({
  tokenSales: {},
  setTokenSales: (daoKey, tokenSales) => {
    set(
      state => {
        state.tokenSales[daoKey] = tokenSales;
      },
      false,
      'setTokenSales',
    );
  },
  getTokenSales: daoKey => {
    const tokenSales = get().tokenSales[daoKey];
    if (!tokenSales) {
      return [];
    }
    return tokenSales;
  },
  addTokenSale: (daoKey, tokenSale) => {
    set(
      state => {
        const existing = state.tokenSales[daoKey] || [];
        state.tokenSales[daoKey] = [...existing, tokenSale];
      },
      false,
      'addTokenSale',
    );
  },
  updateTokenSale: (daoKey, tokenSaleAddress, updates) => {
    set(
      state => {
        const existing = state.tokenSales[daoKey] || [];
        const index = existing.findIndex(
          (sale: TokenSaleData) => sale.address === tokenSaleAddress,
        );
        if (index !== -1) {
          state.tokenSales[daoKey] = existing.map((sale: TokenSaleData, i: number) =>
            i === index ? { ...sale, ...updates } : sale,
          );
        }
      },
      false,
      'updateTokenSale',
    );
  },
  setTokenSale: (daoKey, tokenSale) => {
    set(
      state => {
        const existing = state.tokenSales[daoKey] || [];
        const index = existing.findIndex(
          (sale: TokenSaleData) => sale.address === tokenSale.address,
        );
        if (index !== -1) {
          // Update existing token sale
          state.tokenSales[daoKey] = existing.map((sale: TokenSaleData, i: number) =>
            i === index ? tokenSale : sale,
          );
        } else {
          // Add new token sale
          state.tokenSales[daoKey] = [...existing, tokenSale];
        }
      },
      false,
      'setTokenSale',
    );
  },
});
