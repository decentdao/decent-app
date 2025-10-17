import { SubscriptionTier } from '../types/subscription';

export interface PricingTier {
  tier: SubscriptionTier;
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  badge?: 'popular' | 'save';
  features: string[];
  ctaText: string;
  ctaUrl?: string; // TODO: Replace with actual sales contact URLs
}

export const SUBSCRIPTION_PRICING: Record<SubscriptionTier, PricingTier> = {
  [SubscriptionTier.Free]: {
    tier: SubscriptionTier.Free,
    name: 'Free',
    monthlyPrice: 0,
    annualPrice: 0,
    features: [
      'Token, NFT, Multsig deployments',
      'Token imports',
      'Basic transfers',
      'Custom proposal templates',
    ],
    ctaText: 'Current Plan',
  },
  [SubscriptionTier.Pro]: {
    tier: SubscriptionTier.Pro,
    name: 'Pro',
    monthlyPrice: 250,
    annualPrice: 210, // 15% discount: 250 * 12 * 0.85 / 12
    badge: 'popular',
    features: [
      'SubDAOs',
      'Roles & Permissions',
      'Elections',
      'Payroll',
      'DeFi integrations',
      'Token Sales',
    ],
    ctaText: 'Contact Sales',
    ctaUrl: '#', // TODO: Replace with actual Pro tier sales URL
  },
  [SubscriptionTier.Advanced]: {
    tier: SubscriptionTier.Advanced,
    name: 'Advanced',
    monthlyPrice: 1500,
    annualPrice: 1250, // 15% discount: 1500 * 12 * 0.85 / 12
    features: ['Additional tokens', 'Gasless voting', 'Airdrops', 'Staking', 'Revenue Share'],
    ctaText: 'Contact Sales',
    ctaUrl: '#', // TODO: Replace with actual Advanced tier sales URL
  },
  [SubscriptionTier.Enterprise]: {
    tier: SubscriptionTier.Enterprise,
    name: 'Enterprise',
    monthlyPrice: 0, // Custom pricing
    annualPrice: 0, // Custom pricing
    features: ['Whitelabel solution', 'Custom DAO design', 'Custom features', 'Dedicated support'],
    ctaText: 'Contact Sales',
    ctaUrl: '#', // TODO: Replace with actual Enterprise tier sales URL
  },
};

export const ANNUAL_DISCOUNT_PERCENTAGE = 15;
