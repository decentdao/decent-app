import { Flex, Text, Icon, Button, Input } from '@chakra-ui/react';
import { Empty, PencilSimple, Plus, TrashSimple, WarningCircle } from '@phosphor-icons/react';
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

interface RevSplitWallet {
  address: Address;
  displayName?: string;
  daoShare: number;
  parentDaoShare: number;
  tokenHolderShare: number;
  splits: { address: Address; revenueShare: number }[];
}

function DefaultShareRow({ label, share }: { label: string; share: number }) {
  const padding = 3;
  return (
    <>
      <Flex
        flexDir="row"
        justifyContent="space-between"
        w="100%"
      >
        <Text
          color="color-neutral-400"
          flex={4}
          p={padding}
        >
          {label}
        </Text>
        <Flex flex={4}>
          <Divider vertical />
          <Text
            p={padding}
            color="color-neutral-400"
          >
            % {share}
          </Text>
        </Flex>
        <Flex flex={1}>
          <Divider vertical />
        </Flex>
      </Flex>
      <Divider />
    </>
  );
}

function RevSplitWalletCard({ wallet }: { wallet: RevSplitWallet }) {
  const { t } = useTranslation('revenueSharing');

  const revSplitTotal =
    wallet.splits.reduce((acc, split) => acc + split.revenueShare, 0) +
    wallet.daoShare +
    wallet.parentDaoShare +
    wallet.tokenHolderShare;

  const isTotalError = revSplitTotal > 100;

  const padding = 3;

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
            <Divider
              my={4}
              ml={-4}
            />
            <Flex
              flexDir="row"
              alignItems="center"
              justifyContent="space-between"
              gap={2}
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

            <Flex
              flexDir="column"
              alignItems="center"
              mt={4}
              border="1px solid"
              borderColor="color-neutral-900"
              borderRadius="0.75rem"
            >
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

              {/* SPLITS */}
              {wallet.splits.map((split, i) => (
                <>
                  <Flex
                    key={split.address}
                    flexDir="row"
                    justifyContent="space-between"
                    w="100%"
                  >
                    <Flex
                      flex={4}
                      p={padding}
                    >
                      <Input
                        variant="unstyled"
                        color="color-white"
                        value={createAccountSubstring(split.address)}
                      />
                    </Flex>

                    <Flex flex={4}>
                      <Divider vertical />
                      <Text
                        p={padding}
                        color="color-white"
                      >
                        % {split.revenueShare}
                      </Text>
                    </Flex>

                    <Flex
                      flex={1}
                      justifyContent="space-between"
                    >
                      <Divider vertical />
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
                    </Flex>
                  </Flex>
                  {i !== wallet.splits.length - 1 && <Divider />}
                </>
              ))}
            </Flex>

            {/* TOTAL WALLETS AND ERROR BADGE */}
            <Flex
              flexDir="row"
              justifyContent="space-between"
              w="100%"
              mt={2}
            >
              <Flex flex={4}>
                <Text
                  mr={1}
                  color="color-charcoal-500"
                >
                  {t('revSplitTotalLabel')}:
                </Text>
                <Text color="color-white">{wallet.splits.length + 3} wallets</Text>
              </Flex>

              <Flex flex={4}>
                {isTotalError && (
                  <Badge
                    labelKey="revShareTotalError"
                    size="base"
                    leftIcon={<Icon as={WarningCircle} />}
                  >
                    <Text>{t('revShareTotalError')}</Text>
                  </Badge>
                )}
              </Flex>

              <Icon
                flex={1}
                as={Empty}
                color="transparent"
              />
            </Flex>
          </Flex>
        }
      />
    </Flex>
  );
}

export function SafeRevenueSharingSettingsPage() {
  const { t } = useTranslation('revenueSharing');

  const { daoKey } = useCurrentDAOKey();
  const {
    node: { safe },
  } = useDAOStore({ daoKey });

  const displayedAddress = safe?.address;

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

            {/* Section 1: DAO Safe Wallet Card */}
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

              {/* DAO Safe Wallet Warning Message */}
              <Badge
                labelKey="revShareDaoSafeWarning"
                size="base"
                leftIcon={<Icon as={WarningCircle} />}
              >
                <Text>{t('revShareDaoSafeWarning')}</Text>
              </Badge>
            </Flex>
          </Flex>

          {revSplitWallets.map(wallet => (
            <RevSplitWalletCard
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
