import { createContext } from 'react';
import { TransactionWithId } from '../types';

type SafeInjectContextType = {
  /**
   * Address which will be connected to dApp inside iframe
   */
  address: string | undefined;
  /**
   * Url of iframe
   */
  appUrl: string | undefined;
  /**
   * Whether the app is still connecting
   */
  connecting: boolean;
  /**
   * Last url which received getSafeInfo request,
   *   we can use it to determine if the app is supported by the Safe
   */
  connectedAppUrl: string | undefined;
  iframeRef: React.RefObject<HTMLIFrameElement> | null;
  /**
   * Transactions intercepted from iframe
   */
  latestTransactions: TransactionWithId[];
  setLatestTransactions: (transactions: TransactionWithId[]) => void;
  setAddress: React.Dispatch<React.SetStateAction<string | undefined>>;
  setAppUrl: React.Dispatch<React.SetStateAction<string | undefined>>;
  /**
   * Send a formatted SafeSDK message to iframe
   */
  sendMessageToIFrame: Function;
};

export const SafeInjectContext = createContext<SafeInjectContextType>({
  address: undefined,
  appUrl: undefined,
  connecting: false,
  connectedAppUrl: '',
  iframeRef: null,
  latestTransactions: [],
  setLatestTransactions: () => {},
  setAddress: () => {},
  setAppUrl: () => {},
  sendMessageToIFrame: () => {},
});
