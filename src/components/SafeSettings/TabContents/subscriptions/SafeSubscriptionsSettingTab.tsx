import { Badge, Box, Button, Flex, Grid, Icon, Text, Tabs, TabList, Tab } from '@chakra-ui/react';
import { Check } from '@phosphor-icons/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Address } from 'viem';
import {
  ANNUAL_DISCOUNT_PERCENTAGE,
  getSubscriptionPricing,
} from '../../../../constants/subscriptionPricing';
import { useCurrentDAOKey } from '../../../../hooks/DAO/useCurrentDAOKey';
import { useSubscription } from '../../../../hooks/DAO/useSubscription';
import { useNetworkConfigStore } from '../../../../providers/NetworkConfig/useNetworkConfigStore';
import { SubscriptionTier } from '../../../../types/subscription';
import { BarLoader } from '../../../ui/loaders/BarLoader';
import { SettingsContentBox } from '../../SettingsContentBox';

// Shared components
interface BadgeChipProps {
  children: React.ReactNode;
  bg: string;
  color: string;
}

function BadgeChip({ children, bg, color }: BadgeChipProps) {
  return (
    <Badge
      bg={bg}
      color={color}
      borderRadius="0.5rem"
      px={1.5}
      py={0.5}
      textStyle="text-xs-medium"
      h="20px"
      minH="20px"
      display="flex"
      alignItems="center"
    >
      {children}
    </Badge>
  );
}

interface FeatureItemProps {
  children: string;
}

function FeatureItem({ children }: FeatureItemProps) {
  return (
    <Flex
      alignItems="flex-start"
      gap={3}
    >
      <Icon
        as={Check}
        color="color-lilac-100"
        boxSize={5}
        mt={0.5}
        flexShrink={0}
      />
      <Text
        textStyle="text-sm-regular"
        color="color-neutral-300"
      >
        {children}
      </Text>
    </Flex>
  );
}

// Helper functions
const getFeatureListTitle = (tier: SubscriptionTier): string => {
  switch (tier) {
    case SubscriptionTier.Free:
      return 'features.whatsIncluded';
    case SubscriptionTier.Pro:
      return 'features.everythingInFree';
    case SubscriptionTier.Advanced:
      return 'features.everythingInPro';
    case SubscriptionTier.Enterprise:
      return 'features.everythingIncluded';
    default:
      return 'features.whatsIncluded';
  }
};

const handleContactSales = (tierName: string) => {
  // TODO: Replace with actual sales contact URLs
  console.log(`Contact sales for ${tierName}`);
};

interface SubscriptionBannerProps {
  tier: SubscriptionTier;
  isActive: boolean;
  endDate: Date | null;
  isLoading: boolean;
}

function SubscriptionBanner({ tier, endDate, isLoading }: SubscriptionBannerProps) {
  const { t } = useTranslation('subscriptions');
  const pricing = getSubscriptionPricing(t)[tier];

  if (isLoading) {
    return (
      <Flex
        h="4rem"
        width="100%"
        alignItems="center"
        justifyContent="center"
      >
        <BarLoader />
      </Flex>
    );
  }

  return (
    <Box
      bg="color-alpha-white-950"
      border="1px solid"
      borderColor="color-layout-border"
      borderRadius="0.75rem"
      p={6}
      mb={6}
    >
      <Flex
        alignItems="center"
        justifyContent="space-between"
      >
        <Flex
          flexDirection="column"
          gap={2}
        >
          <Flex
            alignItems="center"
            gap={2}
          >
            <Text
              textStyle="text-lg-semibold"
              color="color-white"
            >
              {pricing.name}
            </Text>
            <BadgeChip
              bg="color-lilac-100"
              color="color-lilac-700"
            >
              {t('badges.active')}
            </BadgeChip>
          </Flex>
          <Text
            textStyle="text-sm-regular"
            color="color-neutral-300"
          >
            {tier === SubscriptionTier.Free ? t('descriptions.free') : t('descriptions.paid')}
          </Text>
        </Flex>
        {tier === SubscriptionTier.Free ? (
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              // TODO: Handle upgrade to Pro
              console.log('Upgrade to Pro clicked');
            }}
          >
            {t('buttons.upgradeToPro')}
          </Button>
        ) : (
          <Flex
            flexDirection="column"
            alignItems="flex-end"
            gap={1}
          >
            <Text
              textStyle="text-xs-medium"
              color="color-neutral-300"
            >
              {t('labels.nextRenewal')}
            </Text>
            <Text
              textStyle="text-sm-regular"
              color="color-white"
            >
              ${pricing.monthlyPrice} on{' '}
              {endDate?.toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              }) || 'N/A'}
            </Text>
          </Flex>
        )}
      </Flex>
    </Box>
  );
}

interface PricingCardProps {
  tier: SubscriptionTier;
  isCurrentPlan: boolean;
  isAnnual: boolean;
}

function PricingCard({ tier, isCurrentPlan, isAnnual }: PricingCardProps) {
  const { t } = useTranslation('subscriptions');
  const pricing = getSubscriptionPricing(t)[tier];
  const displayPrice = isAnnual ? pricing.annualPrice : pricing.monthlyPrice;
  const originalPrice = pricing.monthlyPrice;
  const showDiscount = isAnnual && pricing.annualPrice > 0 && pricing.annualPrice !== originalPrice;

  return (
    <Box
      bg={isCurrentPlan ? 'color-alpha-white-950' : 'color-secondary-950'}
      border="1px solid"
      borderColor="color-layout-border"
      borderRadius="0.75rem"
      p={3}
      h="100%"
      minH="400px"
    >
      <Flex
        flexDirection="column"
        gap={8}
        h="100%"
      >
        {/* Header */}
        <Flex
          flexDirection="column"
          gap={4}
        >
          <Flex
            alignItems="center"
            gap={2}
          >
            <Text
              textStyle="text-lg-semibold"
              color="color-white"
            >
              {pricing.name}
            </Text>
            {pricing.badge === 'popular' && (
              <BadgeChip
                bg="color-lilac-100"
                color="color-lilac-700"
              >
                {t('badges.popular')}
              </BadgeChip>
            )}
          </Flex>

          {/* Pricing */}
          <Flex
            flexDirection="column"
            gap={4}
            minH="120px"
            justifyContent="space-between"
          >
            <Flex
              flexDirection="column"
              gap={1}
              minH="60px"
              justifyContent="flex-start"
            >
              {/* Always reserve space for potential strikethrough text */}
              <Text
                textStyle="text-sm-regular"
                color={showDiscount ? 'color-neutral-400' : 'transparent'}
                textDecoration={showDiscount ? 'line-through' : 'none'}
                minH="20px"
                display="block"
              >
                {showDiscount ? `$${originalPrice} / month` : ' '}
              </Text>
              <Flex
                alignItems="baseline"
                gap={1}
              >
                <Text
                  textStyle="text-3xl-semibold"
                  color="color-white"
                >
                  {pricing.name === 'Enterprise' ? t('pricing.custom') : `$${displayPrice}`}
                </Text>
                {pricing.name !== 'Enterprise' && (
                  <Text
                    textStyle="text-sm-regular"
                    color="color-neutral-300"
                  >
                    {t('pricing.perMonth')}
                  </Text>
                )}
              </Flex>
            </Flex>

            {/* CTA Button */}
            <Button
              variant={isCurrentPlan ? 'secondaryV1' : 'secondaryV1'}
              size="sm"
              w="100%"
              isDisabled={isCurrentPlan}
              onClick={() => handleContactSales(pricing.name)}
            >
              {isCurrentPlan ? t('buttons.currentPlan') : t('buttons.contactSales')}
            </Button>
          </Flex>
        </Flex>

        {/* Features */}
        <Flex
          flexDirection="column"
          gap={2}
          minH="200px"
          justifyContent="flex-start"
        >
          <Text
            textStyle="text-sm-medium"
            color="color-white"
          >
            {t(getFeatureListTitle(tier))}
          </Text>
          <Flex
            flexDirection="column"
            gap={2}
          >
            {pricing.features.map((feature, index) => (
              <FeatureItem key={index}>{feature}</FeatureItem>
            ))}
          </Flex>
        </Flex>
      </Flex>
    </Box>
  );
}

export function SafeSubscriptionsSettingTab() {
  const { t } = useTranslation('subscriptions');
  const { safeAddress } = useCurrentDAOKey();
  const { chain } = useNetworkConfigStore();
  const { tier, isActive, endDate, isLoading } = useSubscription(
    (safeAddress as Address) || '0x0',
    chain.id,
  );
  const [isAnnual, setIsAnnual] = useState(false);

  const tiers = [
    SubscriptionTier.Free,
    SubscriptionTier.Pro,
    SubscriptionTier.Advanced,
    SubscriptionTier.Enterprise,
  ];

  return (
    <SettingsContentBox
      px={8}
      py={6}
    >
      <Flex
        flexDirection="column"
        gap={6}
      >
        {/* Current Subscription Banner */}
        <SubscriptionBanner
          tier={tier}
          isActive={isActive}
          endDate={endDate}
          isLoading={isLoading}
        />

        {/* All Plans Section */}
        <Flex
          flexDirection="column"
          gap={4}
        >
          <Flex
            alignItems="center"
            justifyContent="space-between"
          >
            <Text
              textStyle="text-lg-medium"
              color="color-white"
            >
              {t('labels.allPlans')}
            </Text>

            {/* Monthly/Annual Toggle */}
            <Tabs
              variant="solid"
              index={isAnnual ? 1 : 0}
              onChange={index => setIsAnnual(index === 1)}
            >
              <TabList>
                <Tab>{t('labels.monthly')}</Tab>
                <Tab>
                  <Flex
                    alignItems="center"
                    gap={2}
                    h="100%"
                  >
                    {t('labels.annual')}
                    <BadgeChip
                      bg="color-lilac-400"
                      color="color-white"
                    >
                      {t('badges.savePercentage', { percentage: ANNUAL_DISCOUNT_PERCENTAGE })}
                    </BadgeChip>
                  </Flex>
                </Tab>
              </TabList>
            </Tabs>
          </Flex>

          {/* Pricing Cards Grid */}
          <Grid
            templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }}
            gap={4}
            maxW="1024px"
          >
            {tiers.map(tierKey => (
              <PricingCard
                key={tierKey}
                tier={tierKey}
                isCurrentPlan={tierKey === tier}
                isAnnual={isAnnual}
              />
            ))}
          </Grid>
        </Flex>
      </Flex>
    </SettingsContentBox>
  );
}
