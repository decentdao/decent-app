import { HatsSubgraphClient } from '@hatsprotocol/sdk-v1-subgraph';

const theGraphAPIKey = import.meta.env.VITE_APP_THEGRAPH_API_KEY;
const hatsSubgraphId = 'D1kbQSGSt165189Vh1CoQWjk33mSYyi5aLc3Dvb92gX7';
export const hatsSubgraphClient = new HatsSubgraphClient({
  config: {
    // mainnet
    [1]: {
      endpoint: `https://gateway.thegraph.com/api/subgraphs/id/${hatsSubgraphId}`,
      authToken: theGraphAPIKey,
    },
    // base
    [8453]: {
      endpoint: `https://gateway.thegraph.com/api/subgraphs/id/${hatsSubgraphId}`,
      authToken: theGraphAPIKey,
    },
    // polygon
    [137]: {
      endpoint: `https://gateway.thegraph.com/api/subgraphs/id/${hatsSubgraphId}`,
      authToken: theGraphAPIKey,
    },
    // optimism
    [10]: {
      endpoint: `https://gateway.thegraph.com/api/subgraphs/id/${hatsSubgraphId}`,
      authToken: theGraphAPIKey,
    },
    // sepolia is handled normally.
  },
});
