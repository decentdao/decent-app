import { Flex, Text, Icon, Button, Input, Grid, GridItem } from '@chakra-ui/react';
import { CheckCircle, PencilSimple, Plus, TrashSimple, WarningCircle } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { Address, zeroAddress } from 'viem';
import { SettingsContentBox } from '../../../../components/SafeSettings/SettingsContentBox';
import { Badge } from '../../../../components/ui/badges/Badge';
import { AccordionDropdown } from '../../../../components/ui/containers/AccordionDropdown';
import { AddressInputInfo } from '../../../../components/ui/forms/AddressInputInfo';
import AddressCopier from '../../../../components/ui/links/AddressCopier';
import { BarLoader } from '../../../../components/ui/loaders/BarLoader';
import Divider from '../../../../components/ui/utils/Divider';
import { useCurrentDAOKey } from '../../../../hooks/DAO/useCurrentDAOKey';
import { createAccountSubstring } from '../../../../hooks/utils/useGetAccountName';
import { useDAOStore } from '../../../../providers/App/AppProvider';
import { DAOSplitWallet } from '../../../../providers/App/decentAPI';

interface RevenueShare {
  address: Address;
  percentage: number;
}

interface RevSplitWallet {
  address: Address;
  name?: string;
  daoShare: number;
  parentDaoShare: number;
  tokenHolderShare: number;
  splits: RevenueShare[];
}

// function RevenueSharingTableHeaderRowItem({
//   label,
//   isFirstColumn,
// }: {
//   label?: string;
//   isFirstColumn?: boolean;
// }) {
//   return (
//     <GridItem
//       px="0.75rem"
//       py="0.625rem"
//       h="2.25rem"
//       borderBottom="1px solid"
//       borderLeft={isFirstColumn ? '1px solid' : undefined}
//       textStyle="text-sm-medium"
//       borderColor="color-layout-border"
//       color="color-content-content2-foreground"
//       bg="color-content-content2"
//       textAlign="left"
//     >
//       {label}
//     </GridItem>
//   );
// }

function RevenueSharingTableRowItem({
  colSpan,
  rowContent,
  isEdgeItem,
  rightDivider,
  isFirstColumn,
  hasBottomRadius,
  removeBottomBorder,
}: {
  colSpan?: number;
  rightDivider?: boolean;
  rowContent?: React.ReactNode;
  isEdgeItem?: boolean;
  isFirstColumn?: boolean;
  hasBottomRadius?: 'left' | 'right' | 'full';
  removeBottomBorder?: boolean;
}) {
  const topDividerBorder = isEdgeItem ? { borderTop: '1px solid' } : {};
  const rightDividerBorder = rightDivider ? { borderRight: '1px solid' } : {};
  const borderBottomRadius = hasBottomRadius === 'full' ? { borderBottomRadius: '0.75rem' } : {};
  const borderBottomLeftRadius =
    hasBottomRadius === 'left' ? { borderBottomLeftRadius: '0.75rem' } : {};
  const borderBottomRightRadius =
    hasBottomRadius === 'right' ? { borderBottomRightRadius: '0.75rem' } : {};
  return (
    <GridItem
      display="flex"
      alignItems="center"
      position="relative"
      _focus={{
        outline: 'none',
      }}
      overflow="hidden"
      h="3rem"
      px="1rem"
      py="0.75rem"
      borderBottom={removeBottomBorder ? undefined : '1px solid'}
      {...borderBottomLeftRadius}
      {...borderBottomRightRadius}
      {...borderBottomRadius}
      {...topDividerBorder}
      {...rightDividerBorder}
      colSpan={colSpan}
      borderLeft={isFirstColumn ? '1px solid' : undefined}
      borderColor="color-layout-border"
      textStyle="text-sm-medium"
      color="color-layout-foreground"
    >
      {rowContent}
    </GridItem>
  );
}

function DefaultShareRow({ label, share }: { label: string; share: number }) {
  return (
    <>
      <RevenueSharingTableRowItem
        rowContent={<Text color="color-neutral-400">{label}</Text>}
        isFirstColumn
        rightDivider
        isEdgeItem
      />
      <RevenueSharingTableRowItem
        rowContent={<Text color="color-neutral-400">{share} %</Text>}
        rightDivider
        isEdgeItem
      />
      <RevenueSharingTableRowItem
        rowContent={null}
        rightDivider
        isEdgeItem
      />
    </>
  );
}

function WalletShareRow({
  address,
  percentage,
  isLastRow,
  allSplits,
}: RevenueShare & { isLastRow: boolean; allSplits: RevenueShare[] }) {
  const { t } = useTranslation('revenueSharing');
  const isDuplicateAddress = allSplits.filter(split => split.address === address).length > 1;
  return (
    <>
      <RevenueSharingTableRowItem
        hasBottomRadius={isLastRow ? 'left' : undefined}
        rowContent={
          <>
            <AddressInputInfo
              value={address}
              variant="tableStyle"
              // {...field}
            />
            {isDuplicateAddress && (
              <Text
                position="absolute"
                right="1rem"
                top="50%"
                transform="translateY(-50%)"
                fontSize="xs"
                color="color-error-400"
                px="0.5rem"
                py="0.25rem"
                borderRadius="0.25rem"
                zIndex={1}
                pointerEvents="none"
                whiteSpace="nowrap"
              >
                {t('addressAlreadyInUse')}
              </Text>
            )}
          </>
        }
        isFirstColumn
        rightDivider
        isEdgeItem
      />
      <RevenueSharingTableRowItem
        rowContent={<Text color="color-neutral-400">{percentage} %</Text>}
        rightDivider
        isEdgeItem
      />
      <RevenueSharingTableRowItem
        hasBottomRadius={isLastRow ? 'right' : undefined}
        rowContent={
          <Flex
            alignItems="center"
            justifyContent="flex-end"
            w="full"
          >
            <Button
              variant="unstyled"
              size="sm"
              color="color-error-400"
              _hover={{
                backgroundColor: 'color-layout-focus-destructive',
              }}
            >
              <Icon
                boxSize="1rem"
                as={TrashSimple}
              />
            </Button>
          </Flex>
        }
        rightDivider
        isEdgeItem
      />
    </>
  );
}

function TotalAndErrorBadgeRow({ wallet }: { wallet: RevSplitWallet }) {
  const { t } = useTranslation('revenueSharing');

  const revSplitTotal =
    wallet.splits.reduce((acc, split) => acc + split.percentage, 0) +
    wallet.daoShare +
    wallet.parentDaoShare +
    wallet.tokenHolderShare;

  const isTotalError = revSplitTotal > 100;

  return (
    <Flex
      my={2}
      px="1rem"
      alignItems="center"
    >
      <Icon
        mr={1}
        boxSize="1rem"
        as={CheckCircle}
        color={isTotalError ? 'color-error-400' : 'color-success-400'}
      />
      <Text>{revSplitTotal}%</Text>
      {isTotalError && <Text ml="1rem">{t('revShareTotalError')}</Text>}
    </Flex>
  );
}

function RevSplitWalletAccordion({ wallet }: { wallet: RevSplitWallet }) {
  const { t } = useTranslation('revenueSharing');

  const gridTemplateColumns = '1fr 0.5fr 0.2fr';
  return (
    <Flex
      flexDir="column"
      justifyContent="space-between"
      gap={2}
    >
      <AccordionDropdown
        sectionTitle={
          <Flex
            direction="row"
            alignItems="center"
            gap={1}
          >
            <Text color="color-white">{wallet.name || t('revSplitWallet')}</Text>
            <Button
              variant="tertiary"
              h="auto"
              minW="auto"
              color="color-lilac-100"
              p={1}
              onClick={e => {
                e.stopPropagation();
              }}
            >
              <Icon
                boxSize="1rem"
                as={PencilSimple}
              />
            </Button>
            <AddressCopier
              address={wallet.address}
              color="color-white"
              textStyle="text-sm-underlined"
              variant="secondary"
              ml="1rem"
            >
              {createAccountSubstring(wallet.address)}
            </AddressCopier>
          </Flex>
        }
        content={
          <Flex
            mx={'-1rem'}
            direction="column"
          >
            <Divider my={4} />

            <Text
              mb={4}
              color="color-neutral-50"
            >
              {t('counterparties')}
            </Text>

            <Grid
              templateColumns={gridTemplateColumns}
              borderTopRadius="0.75rem"
              whiteSpace="nowrap"
              borderTop="1px solid"
              borderColor="color-layout-border"
              className="scroll-dark"
              overflow={{ base: 'auto', md: 'hidden' }}
            >
              {/* Default Share Rows */}
              <DefaultShareRow
                label={t('currentDaoTreasureShareLabel')}
                share={wallet.daoShare}
              />
              <DefaultShareRow
                label={t('parentDaoTreasureShareLabel')}
                share={wallet.parentDaoShare}
              />
              <DefaultShareRow
                label={t('currentTokenHolderShareLabel')}
                share={wallet.tokenHolderShare}
              />

              {/* Wallet Share Rows */}
              {wallet.splits.map((split, i) => (
                <WalletShareRow
                  key={`${split.address}-${i}`}
                  address={split.address}
                  percentage={split.percentage}
                  isLastRow={i === wallet.splits.length - 1}
                  allSplits={wallet.splits}
                />
              ))}
            </Grid>

            <TotalAndErrorBadgeRow wallet={wallet} />

            <Button
              variant="secondaryV1"
              ml="auto"
              leftIcon={<Icon as={Plus} />}
            >
              {t('revShareAddSplitWallet')}
            </Button>
          </Flex>
        }
      />
    </Flex>
  );
}

function DaoSafeWalletCard({ displayedAddress }: { displayedAddress: Address }) {
  const { t } = useTranslation('revenueSharing');

  return (
    <Flex
      flexDir="column"
      gap={4}
      border="1px solid"
      borderColor="color-neutral-900"
      borderRadius="0.75rem"
      p={4}
    >
      <Flex
        direction="row"
        alignItems="center"
        gap={'1.5rem'}
      >
        <Text color="color-white">{t('daoSafeWallet')}</Text>

        {displayedAddress && (
          <AddressCopier
            address={displayedAddress}
            color="color-white"
            textStyle="text-sm-underlined"
            variant="secondary"
          >
            {createAccountSubstring(displayedAddress)}
          </AddressCopier>
        )}
      </Flex>

      <Badge
        labelKey="revShareDaoSafeWarning"
        size="base"
        leftIcon={<Icon as={WarningCircle} />}
      >
        <Text pt={0.5}>{t('revShareDaoSafeWarning')}</Text>
      </Badge>
    </Flex>
  );
}

export function SafeRevenueSharingSettingsPage() {
  const { t } = useTranslation('revenueSharing');

  const { daoKey } = useCurrentDAOKey();
  const {
    node: { safe, subgraphInfo },
    treasury: { daoSplits },
  } = useDAOStore({ daoKey });

  const parentSafeAddress = subgraphInfo?.parentAddress;

  const daoSplitsDummyData: DAOSplitWallet[] = [
    {
      address: '0x1234567890123456789012345678901234567890',
      name: 'Test 1',
      splits: [
        {
          address: safe?.address || zeroAddress,
          percentage: 500,
        },
        {
          address: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
          percentage: 25,
        },
        {
          address: '0xd21934eD8eAf27a67f0A70042Af50A1D6d195E81',
          percentage: 20,
        },
        {
          address: '0xd21934eD8eAf27a67f0A70042Af50A1D6d195E81',
          percentage: 5,
        },
      ],
    },
    {
      address: '0x9d05eA2a735a1AE0d964285F36c3cCAAA4Cc2612',
      name: 'Test 2',
      splits: [
        {
          address: safe?.address || zeroAddress,
          percentage: 50,
        },
        {
          address: '0x88072DACc5ad5DE87214F0dba0760f66C0C1B53d',
          percentage: parentSafeAddress ? 30 : 50,
        },
        ...(parentSafeAddress
          ? [
              {
                address: parentSafeAddress,
                percentage: 20,
              },
            ]
          : []),
      ],
    },
  ];

  console.log({ daoSplits });

  const revSplitWallets: RevSplitWallet[] = daoSplitsDummyData.map(s => ({
    address: s.address,
    name: s.name,
    daoShare: s.splits.find(split => split.address === safe?.address)?.percentage || 0,
    parentDaoShare:
      (parentSafeAddress &&
        s.splits.find(split => split.address === parentSafeAddress)?.percentage) ||
      0,
    tokenHolderShare: 0, // @todo: filter by staking token address
    splits: s.splits.filter(
      split => split.address !== safe?.address && split.address !== parentSafeAddress,
    ),
  }));

  return (
    <>
      {!!safe ? (
        <SettingsContentBox
          px={12}
          py={6}
        >
          <Flex
            flexDirection="column"
            gap="1rem"
          >
            <Flex
              alignItems="center"
              justifyContent="flex-start"
              w="100%"
            >
              <Text
                textStyle="text-lg-regular"
                color="color-white"
              >
                {t('revenueSharingTitle')}
              </Text>

              <Button
                variant="secondaryV1"
                ml="auto"
                leftIcon={<Icon as={Plus} />}
              >
                <Text>{t('addRevenueShare')}</Text>
              </Button>
            </Flex>

            {/* DAO Safe Wallet Card */}
            {safe?.address && <DaoSafeWalletCard displayedAddress={safe.address} />}
          </Flex>

          {revSplitWallets.map(wallet => (
            <RevSplitWalletAccordion
              key={wallet.address}
              wallet={wallet}
            />
          ))}
        </SettingsContentBox>
      ) : (
        <Flex
          h="8.5rem"
          width="100%"
          alignItems="center"
          justifyContent="center"
        >
          <BarLoader />
        </Flex>
      )}
    </>
  );
}
