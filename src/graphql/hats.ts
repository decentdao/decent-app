import { HatsSubgraphClient } from '@hatsprotocol/sdk-v1-subgraph';

const theGraphAPIKey = import.meta.env.VITE_APP_THEGRAPH_API_KEY;
const subgraphIdsByNetwork = {
  [1]: 'AtrhAMCcVfPbmejxTez3G59Kdfu5tMFoiPsTUjdCzpKx',
  [8453]: 'FWeAqrp36QYqv9gDWLwr7em8vtvPnPrmRRQgnBb6QbBs',
  [137]: '7MxsRb1p4UQNET8AgrWd93h3GUgeQ7NWrk5SHLEPCxBP',
  [10]: '9nmXXk3ysDVY4sFygWQNQknwiJLCPnrUNzDRw8bxw61q',
  [11155111]: 'GphqDnDUibK3keP5vNSDgnKxidvLKtdM7j9FA1Lpe6sX',
};
const baseEndpoint = `https://gateway.thegraph.com/api/subgraphs/id/`;

export const hatsSubgraphClient = new HatsSubgraphClient({
  config: {
    // mainnet
    [1]: {
      endpoint: `${baseEndpoint}${subgraphIdsByNetwork[1]}`,
      authToken: theGraphAPIKey,
    },
    // base
    [8453]: {
      endpoint: `${baseEndpoint}${subgraphIdsByNetwork[8453]}`,
      authToken: theGraphAPIKey,
    },
    // polygon
    [137]: {
      endpoint: `${baseEndpoint}${subgraphIdsByNetwork[137]}`,
      authToken: theGraphAPIKey,
    },
    // optimism
    [10]: {
      endpoint: `${baseEndpoint}${subgraphIdsByNetwork[10]}`,
      authToken: theGraphAPIKey,
    },
    [11155111]: {
      endpoint: `${baseEndpoint}${subgraphIdsByNetwork[11155111]}`,
      authToken: theGraphAPIKey,
    },
  },
});
