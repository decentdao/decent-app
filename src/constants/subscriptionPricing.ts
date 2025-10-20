import { SubscriptionTier } from '../types/subscription';

export interface PricingTier {
  tier: SubscriptionTier;
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  badge?: 'popular' | 'save';
  features: string[];
  ctaText: string;
  ctaUrl?: string;
}

// Function to get subscription pricing with translations
export const getSubscriptionPricing = (
  t: (key: string) => string,
): Record<SubscriptionTier, PricingTier> => ({
  [SubscriptionTier.Free]: {
    tier: SubscriptionTier.Free,
    name: t('tiers.free'),
    monthlyPrice: 0,
    annualPrice: 0,
    features: [
      t('features.free.tokenDeployments'),
      t('features.free.tokenImports'),
      t('features.free.basicTransfers'),
      t('features.free.customTemplates'),
    ],
    ctaText: t('buttons.currentPlan'),
  },
  [SubscriptionTier.Pro]: {
    tier: SubscriptionTier.Pro,
    name: t('tiers.pro'),
    monthlyPrice: 250,
    annualPrice: 210, // 15% discount: 250 * 12 * 0.85 / 12
    badge: 'popular',
    features: [
      t('features.pro.subDAOs'),
      t('features.pro.rolesPermissions'),
      t('features.pro.elections'),
      t('features.pro.payroll'),
      t('features.pro.defiIntegrations'),
      t('features.pro.tokenSales'),
    ],
    ctaText: t('buttons.contactSales'),
    ctaUrl: '#', // TODO: Replace with actual Pro tier sales URL
  },
  [SubscriptionTier.Advanced]: {
    tier: SubscriptionTier.Advanced,
    name: t('tiers.advanced'),
    monthlyPrice: 1500,
    annualPrice: 1250, // 15% discount: 1500 * 12 * 0.85 / 12
    features: [
      t('features.advanced.additionalTokens'),
      t('features.advanced.gaslessVoting'),
      t('features.advanced.airdrops'),
      t('features.advanced.staking'),
      t('features.advanced.revenueShare'),
    ],
    ctaText: t('buttons.contactSales'),
    ctaUrl: '#', // TODO: Replace with actual Advanced tier sales URL
  },
  [SubscriptionTier.Enterprise]: {
    tier: SubscriptionTier.Enterprise,
    name: t('tiers.enterprise'),
    monthlyPrice: 0, // Custom pricing
    annualPrice: 0, // Custom pricing
    features: [
      t('features.enterprise.whitelabelSolution'),
      t('features.enterprise.customDAODesign'),
      t('features.enterprise.customFeatures'),
      t('features.enterprise.dedicatedSupport'),
    ],
    ctaText: t('buttons.contactSales'),
    ctaUrl: '#', // TODO: Replace with actual Enterprise tier sales URL
  },
});

export const ANNUAL_DISCOUNT_PERCENTAGE = 15;
