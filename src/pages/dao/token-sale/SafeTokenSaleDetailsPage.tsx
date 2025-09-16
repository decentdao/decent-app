import { Box, Flex, Text, VStack, Icon } from '@chakra-ui/react';
import { CheckCircle } from '@phosphor-icons/react';
import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { formatUnits } from 'viem';
import { TokenSaleBanner } from '../../../components/TokenSales/TokenSaleBanner';
import { TokenSaleCountdown } from '../../../components/TokenSales/TokenSaleCountdown';
import { TokenSaleInfoCard } from '../../../components/TokenSales/TokenSaleInfoCard';
import { TokenSaleProgressCard } from '../../../components/TokenSales/TokenSaleProgressCard';
import PageHeader from '../../../components/ui/page/Header/PageHeader';
import { CONTENT_MAXW } from '../../../constants/common';
import { useTokenSaleClaimFunds } from '../../../hooks/DAO/proposal/useTokenSaleClaimFunds';
import { useCurrentDAOKey } from '../../../hooks/DAO/useCurrentDAOKey';
import { useDAOStore } from '../../../providers/App/AppProvider';

export function SafeTokenSaleDetailsPage() {
  const { saleId } = useParams<{ saleId: string }>();
  const { daoKey } = useCurrentDAOKey();
  const { tokenSales } = useDAOStore({ daoKey });
  const { claimFunds, pending } = useTokenSaleClaimFunds();

  const tokenSale = useMemo(() => {
    if (!saleId || !tokenSales) return null;
    return tokenSales.find(sale => sale.address.toLowerCase() === saleId.toLowerCase()) || null;
  }, [saleId, tokenSales]);

  if (!tokenSale) {
    return (
      <Box
        maxW={CONTENT_MAXW}
        mx="auto"
      >
        <Text>Token sale not found</Text>
      </Box>
    );
  }

  const formatCurrency = (value: bigint, decimals: number = 6) => {
    const formatted = parseFloat(formatUnits(value, decimals));
    return `$${formatted.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  };

  const formatTokenAmount = (value: bigint, decimals: number) => {
    const formatted = parseFloat(formatUnits(value, decimals));
    return formatted.toLocaleString('en-US', { maximumFractionDigits: 0 });
  };

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const tokenPrice = formatUnits(tokenSale.saleTokenPrice, 6); // Assuming price is in USDC (6 decimals)
  const totalSupply = formatTokenAmount(
    tokenSale.maximumTotalCommitment / tokenSale.saleTokenPrice,
    tokenSale.tokenDecimals,
  );
  const valuation = parseFloat(formatUnits(tokenSale.maximumTotalCommitment, 6)) * 1.6; // Assuming 1.6x multiple for valuation

  return (
    <Box
      maxW={CONTENT_MAXW}
      mx="auto"
    >
      <PageHeader
        breadcrumbs={[
          {
            terminus: 'My DAO',
            path: '',
          },
          {
            terminus: 'Token Sales',
            path: '',
          },
          {
            terminus: tokenSale.name,
            path: '',
          },
        ]}
      />

      <VStack
        spacing={6}
        align="stretch"
        mt={6}
      >
        {/* Progress Section */}
        <VStack
          spacing={4}
          align="stretch"
        >
          <Flex
            justify="space-between"
            align="center"
          >
            <Text
              textStyle="text-2xl-semibold"
              color="color-content-content1-foreground"
            >
              {tokenSale.name}
            </Text>
            <TokenSaleCountdown endTimestamp={tokenSale.saleEndTimestamp} />
          </Flex>

          <TokenSaleProgressCard
            raised={tokenSale.totalCommitments}
            goal={tokenSale.maximumTotalCommitment}
            minimum={tokenSale.maximumTotalCommitment / 2n} // Assuming minimum is half of max
            commitmentTokenDecimals={6} // Assuming USDC
          />

          {/* Fundraising Goal Not Met Banner */}
          {tokenSale.saleState > 3 &&
            tokenSale.totalCommitments < tokenSale.maximumTotalCommitment / 2n && (
              <TokenSaleBanner
                title="You did not meet your minimum fundraising goal."
                description={`You only raised ${formatCurrency(tokenSale.totalCommitments)}. Reclaim your sale tokens to return funds.`}
                buttonText="Reclaim Tokens"
                onButtonClick={() => {
                  claimFunds(tokenSale.address, tokenSale.name);
                }}
                variant="fundraisingBanner"
                buttonDisabled={pending}
              />
            )}

          {/* Successful Sale Banner */}
          {tokenSale.saleState === 2 &&
            tokenSale.totalCommitments >= tokenSale.maximumTotalCommitment / 2n && (
              <TokenSaleBanner
                title="Congratulations, your sale was successful!"
                description={`You raised ${formatCurrency(tokenSale.totalCommitments)}. Your funds are ready to be claimed.`}
                buttonText="Claim Funds"
                onButtonClick={() => {
                  claimFunds(tokenSale.address, tokenSale.name);
                }}
                variant="successBanner"
                buttonDisabled={pending}
              />
            )}
        </VStack>

        {/* Sale Configuration */}
        <TokenSaleInfoCard title="Sale Configuration">
          <TokenSaleInfoCard.Section>
            <TokenSaleInfoCard.Item
              label="Token:"
              value={tokenSale.tokenSymbol}
            />
            <TokenSaleInfoCard.Item
              label="Total Supply:"
              value={totalSupply}
            />
            <TokenSaleInfoCard.Item
              label="Price:"
              value={`$${tokenPrice}`}
            />
          </TokenSaleInfoCard.Section>

          <TokenSaleInfoCard.Divider />

          <TokenSaleInfoCard.Section>
            <TokenSaleInfoCard.Item
              label="Closing Date:"
              value={formatDate(tokenSale.saleEndTimestamp)}
            />
            <TokenSaleInfoCard.Item
              label="Minimum Raise:"
              value={formatCurrency(tokenSale.maximumTotalCommitment / 2n)} // Assuming minimum is half
            />
            <TokenSaleInfoCard.Item
              label="Fundraising Cap:"
              value={formatCurrency(tokenSale.maximumTotalCommitment)}
            />
            <TokenSaleInfoCard.Item
              label="Valuation:"
              value={`$${valuation.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
            />
          </TokenSaleInfoCard.Section>

          <TokenSaleInfoCard.Divider />

          <TokenSaleInfoCard.Section>
            <TokenSaleInfoCard.Item
              label="Min Purchase:"
              value={formatCurrency(tokenSale.minimumCommitment)}
            />
            <TokenSaleInfoCard.Item
              label="Max Purchase:"
              value={formatCurrency(tokenSale.maximumCommitment)}
            />
          </TokenSaleInfoCard.Section>
        </TokenSaleInfoCard>
        {/* TODO this needs to be live data */}
        {/* Buyer Requirements */}
        <TokenSaleInfoCard title="Buyer Requirements">
          <TokenSaleInfoCard.Section>
            <TokenSaleInfoCard.Item
              label="Requires KYC/KYB"
              value="Yes"
            />
          </TokenSaleInfoCard.Section>
        </TokenSaleInfoCard>

        {/* Requirements List */}
        <Box
          border="1px solid"
          borderColor="color-layout-border-10"
          borderRadius="12px"
          p={3}
        >
          <VStack
            spacing={2}
            align="stretch"
          >
            <Text
              textStyle="text-sm-regular"
              color="color-content-content1-foreground"
            >
              Buyer must meet 2 out of 3 requirements:
            </Text>

            <Flex
              justify="space-between"
              align="center"
            >
              <Text
                textStyle="text-sm-regular"
                color="color-content-muted"
              >
                Must hold at least 1,000 USDC
              </Text>
              <Icon
                as={CheckCircle}
                color="color-base-success"
                boxSize={4}
              />
            </Flex>

            <Flex
              justify="space-between"
              align="center"
            >
              <Text
                textStyle="text-sm-regular"
                color="color-content-muted"
              >
                Must hold at least 1 Founder&apos;s Club NFT
              </Text>
              <Icon
                as={CheckCircle}
                color="color-base-success"
                boxSize={4}
              />
            </Flex>

            <Flex
              justify="space-between"
              align="center"
            >
              <Text
                textStyle="text-sm-regular"
                color="color-content-muted"
              >
                Must be whitelisted
              </Text>
              <Icon
                as={CheckCircle}
                color="color-base-success"
                boxSize={4}
              />
            </Flex>
          </VStack>
        </Box>
      </VStack>
    </Box>
  );
}
