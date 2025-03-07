import { cacheExchange, createClient, fetchExchange } from 'urql';
import { NetworkConfig, TheGraphConfig } from '../types/network';

// Cache to store client instances by their unique URL
const clientCache = new Map<string, ReturnType<typeof createClient>>();

const createTheGraphClient = (config: TheGraphConfig) => {
  const theGraphAPIKey = import.meta.env.VITE_APP_THEGRAPH_API_KEY;

  const url = import.meta.env.DEV
    ? `https://api.studio.thegraph.com/query/${config.space}/${config.slug}/version/latest`
    : `https://gateway.thegraph.com/api/${theGraphAPIKey}/subgraphs/id/${config.id}`;

  // Check if we already have a client for this URL
  const cachedClient = clientCache.get(url);
  if (cachedClient) {
    return cachedClient;
  }

  // Create new client if not cached
  const client = createClient({
    url,
    exchanges: [cacheExchange, fetchExchange],
  });

  // Cache the new client
  clientCache.set(url, client);
  return client;
};

export const createDecentSubgraphClient = (networkConfig: NetworkConfig) => {
  return createTheGraphClient(networkConfig.decentSubgraph);
};

export const createSablierSubgraphClient = (networkConfig: NetworkConfig) => {
  return createTheGraphClient(networkConfig.sablierSubgraph);
};

const SNAPSHOT_URL = 'https://hub.snapshot.org/graphql';

export const createSnapshotSubgraphClient = () => {
  // Check if we already have a Snapshot client
  const cachedClient = clientCache.get(SNAPSHOT_URL);
  if (cachedClient) {
    return cachedClient;
  }

  // Create new Snapshot client if not cached
  const client = createClient({
    url: SNAPSHOT_URL,
    exchanges: [cacheExchange, fetchExchange],
  });

  // Cache the new client
  clientCache.set(SNAPSHOT_URL, client);
  return client;
};
