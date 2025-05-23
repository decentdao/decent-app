import * as amplitude from '@amplitude/analytics-browser';
import { Box, Button, Divider, Flex, Grid, GridItem, Icon, Show, Text } from '@chakra-ui/react';
import { CaretDown } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Assets } from '../../../components/DAOTreasury/components/Assets';
import {
  PaginationButton,
  PaginationCount,
  Transactions,
} from '../../../components/DAOTreasury/components/Transactions';
import { TitledInfoBox } from '../../../components/ui/containers/TitledInfoBox';
import { OptionMenu } from '../../../components/ui/menus/OptionMenu';
import { ModalType } from '../../../components/ui/modals/ModalProvider';
import { useDecentModal } from '../../../components/ui/modals/useDecentModal';
import PageHeader from '../../../components/ui/page/Header/PageHeader';
import { useCurrentDAOKey } from '../../../hooks/DAO/useCurrentDAOKey';
import useSendAssetsActionModal from '../../../hooks/DAO/useSendAssetsActionModal';
import { useCanUserCreateProposal } from '../../../hooks/utils/useCanUserSubmitProposal';
import { analyticsEvents } from '../../../insights/analyticsEvents';
import { useDAOStore } from '../../../providers/App/AppProvider';

export function SafeTreasuryPage() {
  useEffect(() => {
    amplitude.track(analyticsEvents.TreasuryPageOpened);
  }, []);
  const { daoKey } = useCurrentDAOKey();
  const {
    treasury: { assetsFungible, transfers },
    node: { subgraphInfo, safe },
  } = useDAOStore({ daoKey });
  const [shownTransactions, setShownTransactions] = useState(20);
  const { t } = useTranslation(['treasury', 'modals']);
  const { canUserCreateProposal } = useCanUserCreateProposal();

  const hasAnyBalanceOfAnyFungibleTokens =
    assetsFungible.reduce((p, c) => p + BigInt(c.balance), 0n) > 0n;

  const showSendButton = canUserCreateProposal && hasAnyBalanceOfAnyFungibleTokens;

  const totalTransfers = transfers?.length || 0;
  const showLoadMoreTransactions = totalTransfers > shownTransactions && shownTransactions < 100;
  const { openSendAssetsModal } = useSendAssetsActionModal();
  const safeAddress = safe?.address;
  const openDappBrowserModal = useDecentModal(ModalType.DAPP_BROWSER, {
    appUrl: 'https://swap.cow.fi',
  });

  const options =
    safeAddress !== undefined && showSendButton
      ? [
          {
            optionKey: t('limitOrder'),
            onClick: openDappBrowserModal,
          },
          {
            optionKey: t('transfer'),
            onClick: openSendAssetsModal,
          },
        ]
      : undefined;

  return (
    <Box>
      <PageHeader
        title={t('headerTitle', {
          ns: 'breadcrumbs',
          daoName: subgraphInfo?.daoName,
          subject: t('treasury', { ns: 'breadcrumbs' }),
        })}
        showSafeAddress
        breadcrumbs={[
          {
            terminus: t('treasury', { ns: 'breadcrumbs' }),
            path: '',
          },
        ]}
      >
        {options && (
          <OptionMenu
            trigger={
              <Flex
                alignItems="center"
                gap={2}
              >
                <Text textStyle="body-base">{t('treasuryActions')}</Text>
                <Icon
                  as={CaretDown}
                  boxSize="1.5rem"
                />
              </Flex>
            }
            options={options!}
            namespace="proposal"
            buttonAs={Button}
            buttonProps={{
              variant: 'tertiary',
              paddingX: '0.5rem',
              paddingY: '0.25rem',
              _hover: { bg: 'color-neutral-950' },
              _active: {
                color: 'color-lilac-100',
                bg: 'color-neutral-950',
              },
            }}
          />
        )}
      </PageHeader>
      <Grid
        templateAreas={{
          base: `"assets"
          "transactions"`,
          lg: `"transactions assets"`,
        }}
        gap="1rem"
        gridTemplateColumns={{ base: `1fr`, lg: `minmax(1fr, 736px) 1fr` }}
      >
        <GridItem area="transactions">
          <TitledInfoBox
            title={t('titleTransactions')}
            titleTestId="title-transactions"
            bg="color-neutral-950"
            w="100%"
            subTitle={
              totalTransfers ? (
                <Show below="lg">
                  <Box px="1rem">
                    <PaginationCount shownTransactions={shownTransactions} />
                  </Box>
                </Show>
              ) : null
            }
          >
            <Flex flexDir={{ base: 'column-reverse', lg: 'column' }}>
              <Transactions shownTransactions={shownTransactions} />
              {totalTransfers ? (
                <Show above="lg">
                  <Divider
                    variant="darker"
                    my="1rem"
                  />
                  <Box px={{ base: '1rem', lg: '1.5rem' }}>
                    <PaginationCount shownTransactions={shownTransactions} />
                  </Box>
                </Show>
              ) : null}
            </Flex>
          </TitledInfoBox>
          {showLoadMoreTransactions && (
            <PaginationButton onClick={() => setShownTransactions(prevState => prevState + 20)} />
          )}
        </GridItem>
        <GridItem area="assets">
          <TitledInfoBox
            title={t('titleAssets')}
            titleTestId="title-assets"
            bg={{ base: 'color-neutral-950', lg: 'none' }}
          >
            <Assets />
          </TitledInfoBox>
        </GridItem>
      </Grid>
    </Box>
  );
}
