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

export const getFeatureGatedConfig = (
  featureType: FeatureGatedType,
  t: (key: string) => string,
): FeatureGatedConfig => {
  const configs: Record<FeatureGatedType, FeatureGatedConfig> = {
    [FeatureGatedType.AIRDROP]: {
      image: '/images/feature-card_airdrop.png',
      title: t('featureAirdropTitle'),
      description: t('featureAirdropDescription'),
    },
    [FeatureGatedType.DAPP_EXPLORER]: {
      image: '/images/feature-card_dapp-explorer.png',
      title: t('featureDappExplorerTitle'),
      description: t('featureDappExplorerDescription'),
    },
    [FeatureGatedType.HIERARCHY]: {
      image: '/images/feature-card_hierarchy.png',
      title: t('featureHierarchyTitle'),
      description: t('featureHierarchyDescription'),
    },
    [FeatureGatedType.ROLES]: {
      image: '/images/feature-card_roles.png',
      title: t('featureRolesTitle'),
      description: t('featureRolesDescription'),
    },
    [FeatureGatedType.STAKING]: {
      image: '/images/feature-card_staking.png',
      title: t('featureStakingTitle'),
      description: t('featureStakingDescription'),
    },
    [FeatureGatedType.STREAMS]: {
      image: '/images/feature-card_streams.png',
      title: t('featureStreamsTitle'),
      description: t('featureStreamsDescription'),
    },
    [FeatureGatedType.TOKEN_SALES]: {
      image: '/images/feature-card_token-sales.png',
      title: t('featureTokenSalesTitle'),
      description: t('featureTokenSalesDescription'),
    },
  };

  return configs[featureType];
};
