import { Core } from '@walletconnect/core';
import type { ProposalTypes, SessionTypes } from '@walletconnect/types';
import { getSdkError, parseUri } from '@walletconnect/utils';
import { Web3Wallet, IWeb3Wallet } from '@walletconnect/web3wallet';

import { useState } from 'react';
import { walletConnectProjectId } from '../../../providers/NetworkConfig/web3-modal.config';
import { TransactionWithId } from '../context/SafeInjectedContext';

const WCMetadata = {
  name: 'Decent DAO',
  description: 'Govern at startup speed.',
  url: 'decentdao.org',
  icons: ['https://decentdao.org/favicon.ico'],
};

const core = new Core({
  projectId: walletConnectProjectId,
});

export default function useWalletConnect({
  uri,
  address,
  setLatestTransactions,
}: {
  uri: string;
  address: string;
  setLatestTransactions: (tx: TransactionWithId[]) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [walletConnector, setWalletConnector] = useState<IWeb3Wallet>();
  const [walletConnectSession, setWalletConnectSession] = useState<SessionTypes.Struct>();

  const connect = async () => {
    setLoading(true);
    const { version } = parseUri(uri);
    if (version === 1) {
      // legacy
      setError('legacy walletconnect are not supported');
      console.warn('legacy walletconnect are not supported');
    } else {
      // initialize
      const web3wallet = await Web3Wallet.init({
        core,
        metadata: WCMetadata,
      });
      setWalletConnector(web3wallet);

      // subscribe to events
      web3wallet.on('session_proposal', async proposal => {
        if (loading) {
          setLoading(false);
        }
        console.debug('EVENT', 'session_proposal', proposal);

        const { requiredNamespaces, optionalNamespaces } = proposal.params;
        const namespaceKey = 'eip155';
        const requiredNamespace = requiredNamespaces[namespaceKey] as
          | ProposalTypes.BaseRequiredNamespace
          | undefined;
        const optionalNamespace = optionalNamespaces ? optionalNamespaces[namespaceKey] : undefined;

        let chains: string[] | undefined =
          requiredNamespace === undefined ? undefined : requiredNamespace.chains;
        if (optionalNamespace && optionalNamespace.chains) {
          if (chains) {
            // merge chains from requiredNamespace & optionalNamespace, while avoiding duplicates
            chains = Array.from(new Set(chains.concat(optionalNamespace.chains)));
          } else {
            chains = optionalNamespace.chains;
          }
        }

        const accounts: string[] = [];
        chains?.map(chain => {
          accounts.push(`${chain}:${address}`);
          return null;
        });
        const namespace: SessionTypes.Namespace = {
          accounts,
          chains: chains,
          methods: requiredNamespace === undefined ? [] : requiredNamespace.methods,
          events: requiredNamespace === undefined ? [] : requiredNamespace.events,
        };

        if (requiredNamespace && requiredNamespace.chains) {
          //const chainId = parseInt(requiredNamespace.chains[0].split(':')[1]);
          // TODO: this is chain using by dApp connected
        }

        console.debug('approve before', namespace);
        const session = await web3wallet.approveSession({
          id: proposal.id,
          namespaces: {
            [namespaceKey]: namespace,
          },
        });
        setWalletConnectSession(session);
        setLoading(false);
      });
      // pair with uri
      try {
        await web3wallet.core.pairing.pair({ uri });
      } catch (e: any) {
        console.warn('WalletConnect pair error', e, uri);
        setLoading(false);
        setError(e?.message);
      }

      web3wallet.on('session_request', async event => {
        const { topic, params: eventParams, id } = event;
        const { request } = eventParams;
        const params = request.params;

        console.debug('EVENT', 'session_request', event);

        if (request.method === 'eth_sendTransaction') {
          const newTxn = {
            id: id,
            from: params[0].from,
            to: params[0].to,
            data: params[0].data,
            value: params[0].value ? parseInt(params[0].value, 16).toString() : '0',
          };
          setLatestTransactions([newTxn]);
          if (web3wallet && topic) {
            await web3wallet.respondSessionRequest({
              topic,
              response: {
                jsonrpc: '2.0',
                id: id,
                error: {
                  code: 0,
                  message: 'Method not supported by Impersonator',
                },
              },
            });
          }
        } else {
          await web3wallet.respondSessionRequest({
            topic,
            response: {
              jsonrpc: '2.0',
              id: id,
              error: {
                code: 0,
                message: 'Method not supported by Impersonator',
              },
            },
          });
        }
      });

      web3wallet.on('session_delete', () => {
        console.debug('EVENT', 'session_delete');

        setWalletConnectSession(undefined);
      });
    }
  };

  const updateSession = async ({
    newChainId,
    newAddress,
  }: {
    newChainId?: number;
    newAddress?: string;
  }) => {
    if (walletConnector && walletConnectSession) {
      await walletConnector.emitSessionEvent({
        topic: walletConnectSession.topic,
        event: {
          name: newChainId ? 'chainChanged' : 'accountsChanged',
          data: [newAddress],
        },
        chainId: `eip155:${newChainId}`,
      });
      setLoading(false);
    } else {
      setLoading(false);
    }
  };

  const disconnect = async () => {
    console.debug('ACTION', 'killSession');

    if (walletConnector && walletConnectSession) {
      try {
        await walletConnector.disconnectSession({
          topic: walletConnectSession.topic,
          reason: getSdkError('USER_DISCONNECTED'),
        });
      } catch (e) {
        console.error('killSession', e);
      }
      setWalletConnectSession(undefined);
    }
  };

  return {
    loading,
    error,
    walletConnector,
    updateChainOrAddress: updateSession,
    isConnected: !!walletConnectSession,
    connect,
    disconnect,
  };
}
