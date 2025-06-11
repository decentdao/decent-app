import { Flex, Text, Icon, Button, Input, Grid, GridItem } from '@chakra-ui/react';
import { PencilSimple, Plus, TrashSimple, WarningCircle } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { Address } from 'viem';
import { SettingsContentBox } from '../../../../components/SafeSettings/SettingsContentBox';
import { Badge } from '../../../../components/ui/badges/Badge';
import { AccordionDropdown } from '../../../../components/ui/containers/AccordionDropdown';
import { DisplayAddress } from '../../../../components/ui/links/DisplayAddress';
import { BarLoader } from '../../../../components/ui/loaders/BarLoader';
import Divider from '../../../../components/ui/utils/Divider';
import { useCurrentDAOKey } from '../../../../hooks/DAO/useCurrentDAOKey';
import { createAccountSubstring } from '../../../../hooks/utils/useGetAccountName';
import { useDAOStore } from '../../../../providers/App/AppProvider';

interface RevenueShare {
  address: Address;
  revenueShare: number;
}

interface RevSplitWallet {
  address: Address;
  displayName?: string;
  daoShare: number;
  parentDaoShare: number;
  tokenHolderShare: number;
  splits: RevenueShare[];
}

function TableRowItem({
  colSpan,
  cellContent,
  isEdgeItem,
  rightDivider,
  hasPadding,
  isFirstColumn,
  roundedBottomLeftEdge,
  roundedBottomRightEdge,
  topMargin,
}: {
  colSpan?: number;
  rightDivider?: boolean;
  cellContent?: React.ReactNode;
  isEdgeItem?: boolean;
  hasPadding?: boolean;
  isFirstColumn?: boolean;
  roundedBottomLeftEdge?: boolean;
  roundedBottomRightEdge?: boolean;
  topMargin?: boolean;
}) {
  const border = isEdgeItem ? { borderTop: '1px solid', borderBottom: '1px solid' } : {};
  const rightDividerBorder = rightDivider ? { borderRight: '1px solid' } : {};
  return (
    <GridItem
      display="flex"
      alignItems="center"
      p={hasPadding ? 4 : '2px'}
      {...border}
      {...rightDividerBorder}
      colSpan={colSpan}
      borderLeft={isFirstColumn ? '1px solid' : undefined}
      borderColor="color-layout-border"
      borderBottomLeftRadius={roundedBottomLeftEdge ? '0.75rem' : undefined}
      borderBottomRightRadius={roundedBottomRightEdge ? '0.75rem' : undefined}
      textStyle="text-sm-medium"
      color="color-layout-foreground"
      mt={topMargin ? 2 : undefined}
    >
      {cellContent}
    </GridItem>
  );
}

function DefaultShareRowGrid({ label, share }: { label: string; share: number }) {
  return (
    <>
      <TableRowItem
        colSpan={1}
        cellContent={
          <Text
            color="color-neutral-400"
            flex={4}
          >
            {label}
          </Text>
        }
        hasPadding
        isFirstColumn
        rightDivider
        isEdgeItem
      />
      <TableRowItem
        colSpan={1}
        cellContent={
          <Text
            pl={3}
            color="color-neutral-400"
          >
            % {share}
          </Text>
        }
        hasPadding={false}
        rightDivider
        isEdgeItem
      />
      <TableRowItem
        colSpan={1}
        cellContent={null}
        hasPadding={false}
        rightDivider
        isEdgeItem
      />
    </>
  );
}

function WalletShareRow({
  address,
  revenueShare,
  isLastRow,
}: RevenueShare & { isLastRow: boolean }) {
  return (
    <>
      <TableRowItem
        colSpan={1}
        cellContent={
          <Input
            variant="tableStyle"
            color="color-white"
            value={createAccountSubstring(address)}
            borderBottomLeftRadius={isLastRow ? '0.75rem' : undefined}
          />
        }
        isFirstColumn
        rightDivider
        isEdgeItem
        roundedBottomLeftEdge={isLastRow}
      />
      <TableRowItem
        colSpan={1}
        cellContent={
          <Text
            pl={3}
            color="color-neutral-400"
          >
            % {revenueShare}
          </Text>
        }
        rightDivider
        isEdgeItem
      />
      <TableRowItem
        colSpan={1}
        hasPadding
        cellContent={
          <Button
            variant="unstyled"
            h={1}
            w={1}
            mt="15%"
            mr="30%"
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
        }
        rightDivider
        isEdgeItem
        roundedBottomRightEdge={isLastRow}
      />
    </>
  );
}

function TotalAndErrorBadgeRow({ total, isTotalError }: { total: number; isTotalError: boolean }) {
  const { t } = useTranslation('revenueSharing');

  return (
    <>
      <TableRowItem
        colSpan={1}
        cellContent={
          <>
            <Text
              mr={1}
              color="color-charcoal-500"
            >
              {t('revSplitTotalLabel')}:
            </Text>
            <Text color="color-white">{total} wallets</Text>
          </>
        }
      />
      <TableRowItem
        colSpan={1}
        cellContent={
          isTotalError && (
            <Badge
              labelKey="revShareTotalError"
              size="base"
              leftIcon={<Icon as={WarningCircle} />}
            >
              <Text>{t('revShareTotalError')}</Text>
            </Badge>
          )
        }
      />
      <TableRowItem
        colSpan={1}
        cellContent={null}
        hasPadding
        topMargin
      />
    </>
  );
}

function RevSplitWalletAccordion({ wallet }: { wallet: RevSplitWallet }) {
  const { t } = useTranslation('revenueSharing');

  const revSplitTotal =
    wallet.splits.reduce((acc, split) => acc + split.revenueShare, 0) +
    wallet.daoShare +
    wallet.parentDaoShare +
    wallet.tokenHolderShare;

  const isTotalError = revSplitTotal > 100;

  const gridTemplateColumns = '1fr 1fr auto';
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
            <Text color="color-white">{wallet.displayName || t('revSplitWallet')}</Text>
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
            <DisplayAddress
              address={wallet.address}
              color="color-white"
              textStyle="text-sm-underlined"
              onClick={e => e.stopPropagation()}
            >
              {createAccountSubstring(wallet.address)}
            </DisplayAddress>
          </Flex>
        }
        content={
          <Flex direction="column">
            <Divider my={4} />

            <Flex
              flexDir="row"
              alignItems="center"
              justifyContent="space-between"
              gap={2}
              mb={4}
            >
              <Text color="color-neutral-50">{t('counterparties')}</Text>
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Icon as={Plus} />}
              >
                {t('revShareAddSplitWallet')}
              </Button>
            </Flex>

            <Grid
              templateColumns={gridTemplateColumns}
              borderTop="1px solid"
              borderColor="color-layout-border"
              borderTopRadius="0.75rem"
              whiteSpace="nowrap"
              className="scroll-dark"
              overflow={{ base: 'auto', md: 'hidden' }}
            >
              <DefaultShareRowGrid
                label={t('currentDaoTreasureShareLabel')}
                share={wallet.daoShare}
              />
              <DefaultShareRowGrid
                label={t('parentDaoTreasureShareLabel')}
                share={wallet.parentDaoShare}
              />
              <DefaultShareRowGrid
                label={t('currentTokenHolderShareLabel')}
                share={wallet.tokenHolderShare}
              />

              {wallet.splits.map((split, i) => (
                <WalletShareRow
                  key={split.address}
                  address={split.address}
                  revenueShare={split.revenueShare}
                  isLastRow={i === wallet.splits.length - 1}
                />
              ))}

              <TotalAndErrorBadgeRow
                total={wallet.splits.length + 3}
                isTotalError={isTotalError}
              />
            </Grid>
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
        gap={1}
      >
        <Text color="color-white">{t('daoSafeWallet')}</Text>

        {displayedAddress && (
          <DisplayAddress
            address={displayedAddress}
            color="color-white"
            textStyle="text-sm-underlined"
          >
            {createAccountSubstring(displayedAddress)}
          </DisplayAddress>
        )}
      </Flex>

      <Badge
        labelKey="revShareDaoSafeWarning"
        size="base"
        leftIcon={<Icon as={WarningCircle} />}
      >
        <Text>{t('revShareDaoSafeWarning')}</Text>
      </Badge>
    </Flex>
  );
}

export function SafeRevenueSharingSettingsPage() {
  const { t } = useTranslation('revenueSharing');

  const { daoKey } = useCurrentDAOKey();
  const {
    node: { safe },
  } = useDAOStore({ daoKey });

  const revSplitWallets: RevSplitWallet[] = [
    {
      address: '0x1234567890123456789012345678901234567890',
      displayName: 'Test 1',
      daoShare: 50,
      parentDaoShare: 30,
      tokenHolderShare: 10,
      splits: [
        {
          address: '0x123456789012345678901234567890123456789b',
          revenueShare: 6,
        },
        {
          address: '0x123456789012345678901234567890123456789c',
          revenueShare: 4,
        },
      ],
    },
    {
      address: '0x123456789012345678901234567890123456789a',
      displayName: 'Test 2',
      daoShare: 10,
      parentDaoShare: 20,
      tokenHolderShare: 50,
      splits: [
        {
          address: '0x123456789012345678901234567890123456789d',
          revenueShare: 22,
        },
      ],
    },
  ];

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
                variant="ghost"
                h="auto"
                minW="auto"
                color="color-lilac-100"
                p={1}
                ml="auto"
                _hover={{
                  bg: 'color-neutral-900',
                  opacity: 0.8,
                }}
              >
                <Icon
                  boxSize="1.5rem"
                  as={Plus}
                />
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
