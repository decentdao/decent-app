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
   * Last url which received getSafeInfo request,
   *   we can use it to determine if the app is supported by the Safe
   */
  lastAppUrlSupported: string | undefined;
  iframeRef: React.RefObject<HTMLIFrameElement> | null;
  /**
   * Transactions intercepted from iframe
   */
  latestTransactions: TransactionWithId[] | undefined;
  setLatestTransactions: React.Dispatch<React.SetStateAction<TransactionWithId[] | undefined>>;
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
  lastAppUrlSupported: undefined,
  iframeRef: null,
  latestTransactions: undefined,
  setLatestTransactions: () => {},
  setAddress: () => {},
  setAppUrl: () => {},
  sendMessageToIFrame: () => {},
});
