type DAORoutes = {
  [route: string]: { relative: (...args: any) => string; path: string };
};

export const DAO_ROUTES: DAORoutes = {
  daos: {
    relative: () => '/daos',
    path: 'daos/:address/*',
  },
  daosNew: {
    relative: () => '/daos/new',
    path: 'new',
  },
  dao: {
    relative: (daoAddress: string) => `/daos/${daoAddress}`,
    path: '*',
  },
  newSubDao: {
    relative: (daoAddress: string) => `/daos/${daoAddress}/new`,
    path: 'new',
  },
  nodes: {
    relative: (daoAddress: string) => `/daos/${daoAddress}/nodes`,
    path: 'nodes',
  },
  treasury: {
    relative: (daoAddress: string) => `/daos/${daoAddress}/treasury`,
    path: 'treasury',
  },
  proposals: {
    relative: (daoAddress: string) => `/daos/${daoAddress}/proposals`,
    path: 'proposals',
  },
  proposal: {
    relative: (daoAddress: string, proposalNumber: string) =>
      `/daos/${daoAddress}/proposals/${proposalNumber}`,
    path: 'proposals/:proposalNumber',
  },
  proposalNew: {
    relative: (daoAddress: string) => `/daos/${daoAddress}/proposals/new`,
    path: 'proposals/new',
  },
  delegate: {
    relative: (daoAddress: string) => `/daos/${daoAddress}/delegate`,
    path: 'delegate',
  },
};
