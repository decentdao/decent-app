export enum FeatureGatedType {
  AIRDROP = 'AIRDROP',
  DAPP_EXPLORER = 'DAPP_EXPLORER',
  HIERARCHY = 'HIERARCHY',
  ROLES = 'ROLES',
  STAKING = 'STAKING',
  STREAMS = 'STREAMS',
  TOKEN_SALES = 'TOKEN_SALES',
}

export interface FeatureGatedConfig {
  image: string;
  title: string;
  description: string;
}

export const getFeatureGatedConfig = (featureType: FeatureGatedType): FeatureGatedConfig => {
  const configs: Record<FeatureGatedType, FeatureGatedConfig> = {
    [FeatureGatedType.AIRDROP]: {
      image: '/images/feature-card_airdrop.png',
      title: 'Unlock Airdrop',
      description:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    },
    [FeatureGatedType.DAPP_EXPLORER]: {
      image: '/images/feature-card_dapp-explorer.png',
      title: 'Unlock DApp Explorer',
      description:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    },
    [FeatureGatedType.HIERARCHY]: {
      image: '/images/feature-card_hierarchy.png',
      title: 'Unlock Hierarchy',
      description:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    },
    [FeatureGatedType.ROLES]: {
      image: '/images/feature-card_roles.png',
      title: 'Unlock Roles',
      description:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    },
    [FeatureGatedType.STAKING]: {
      image: '/images/feature-card_staking.png',
      title: 'Unlock Staking',
      description:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    },
    [FeatureGatedType.STREAMS]: {
      image: '/images/feature-card_streams.png',
      title: 'Unlock Streams',
      description:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    },
    [FeatureGatedType.TOKEN_SALES]: {
      image: '/images/feature-card_token-sales.png',
      title: 'Unlock Token Sales',
      description:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    },
  };

  return configs[featureType];
};
