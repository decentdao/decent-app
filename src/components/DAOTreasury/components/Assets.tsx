import {
  Accordion,
  AccordionButton,
  AccordionItem,
  AccordionPanel,
  Box,
  Flex,
  Hide,
  Show,
  Text,
} from '@chakra-ui/react';
import { CaretDown, CaretRight } from '@phosphor-icons/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCurrentDAOKey } from '../../../hooks/DAO/useCurrentDAOKey';
import { useDAOStore } from '../../../providers/App/AppProvider';
import { formatUSD } from '../../../utils';
import Divider from '../../ui/utils/Divider';
import { CoinHeader, CoinRow } from './AssetCoin';
import { DeFiHeader, DeFiRow } from './AssetDeFi';
import { NFTHeader, NFTRow } from './AssetNFT';
import LidoButtons from './LidoButtons';

export function Assets() {
  const { daoKey } = useCurrentDAOKey();
  const {
    treasury: { assetsFungible, assetsNonFungible, assetsDeFi, totalUsdValue },
    node: { safe },
  } = useDAOStore({ daoKey });
  const { t } = useTranslation('treasury');
  const [expandedIndecies, setExpandedIndecies] = useState<number[]>([]);

  const hasCoins = assetsFungible.length > 0;
  const hasNFTs = assetsNonFungible.length > 0;
  const hasDeFis = assetsDeFi.length > 0;
  const hasAssets = hasCoins || hasNFTs || hasDeFis;

  const toggleAccordionItem = (index: number) => {
    setExpandedIndecies(indexArray => {
      if (indexArray.includes(index)) {
        const newArr = [...indexArray];
        newArr.splice(newArr.indexOf(index), 1);
        return newArr;
      } else {
        return [...indexArray, index];
      }
    });
  };

  const nftAccordionItemsIndex = hasCoins ? (hasDeFis ? 2 : 1) : 0;

  return (
    <Box mt={{ base: '1rem', lg: 0 }}>
      <Text
        textStyle="text-xs-medium"
        color="color-neutral-300"
        px={{ base: '1rem', lg: '1.5rem' }}
      >
        {t('subtitleTreasuryBalance')}
      </Text>
      <Text
        data-testid="text-usd-total"
        px={{ base: '1rem', lg: '1.5rem' }}
      >
        {formatUSD(totalUsdValue)}
      </Text>
      <Hide above="lg">
        <Divider
          variant="darker"
          my="1rem"
        />
      </Hide>
      <LidoButtons />
      {hasAssets && safe?.address && (
        <>
          <Show below="lg">
            <Accordion
              allowMultiple
              index={expandedIndecies}
            >
              {hasCoins && (
                <AccordionItem
                  borderTop="none"
                  borderBottom="none"
                >
                  {({ isExpanded }) => (
                    <Box>
                      <AccordionButton
                        onClick={() => toggleAccordionItem(0)}
                        p="0.25rem"
                        color="color-white"
                        ml="0.75rem"
                      >
                        <Flex
                          alignItems="center"
                          gap={2}
                        >
                          {isExpanded ? <CaretDown /> : <CaretRight />}
                          {t('columnCoins')}
                        </Flex>
                      </AccordionButton>
                      <Divider
                        variant="darker"
                        my="1rem"
                      />
                      <AccordionPanel
                        p={0}
                        overflowX="auto"
                        className="scroll-dark"
                      >
                        <CoinHeader />
                        {assetsFungible.map((coin, index) => {
                          return (
                            <CoinRow
                              key={index}
                              asset={coin}
                            />
                          );
                        })}
                      </AccordionPanel>
                      {isExpanded && (
                        <Divider
                          variant="darker"
                          my="1rem"
                        />
                      )}
                    </Box>
                  )}
                </AccordionItem>
              )}
              {assetsDeFi.length > 0 && (
                <AccordionItem
                  borderTop="none"
                  borderBottom="none"
                >
                  {({ isExpanded }) => (
                    <Box>
                      <AccordionButton
                        onClick={() => toggleAccordionItem(hasCoins ? 1 : 0)}
                        p="0.25rem"
                        color="color-white"
                        ml="0.75rem"
                      >
                        <Flex
                          alignItems="center"
                          gap={2}
                        >
                          {isExpanded ? <CaretDown /> : <CaretRight />}
                          {t('columnDeFis')}
                        </Flex>
                      </AccordionButton>
                      {assetsNonFungible.length > 0 && (
                        <Divider
                          variant="darker"
                          my="1rem"
                        />
                      )}
                      <AccordionPanel
                        p={0}
                        overflowX="auto"
                        className="scroll-dark"
                      >
                        <DeFiHeader />
                        {assetsDeFi.map((asset, index) => (
                          <DeFiRow
                            key={index}
                            asset={asset}
                          />
                        ))}
                      </AccordionPanel>
                      {hasNFTs && isExpanded && (
                        <Divider
                          variant="darker"
                          my="1rem"
                        />
                      )}
                    </Box>
                  )}
                </AccordionItem>
              )}
              {hasNFTs && (
                <AccordionItem
                  borderTop="none"
                  borderBottom="none"
                >
                  {({ isExpanded }) => (
                    <Box>
                      <AccordionButton
                        onClick={() => toggleAccordionItem(nftAccordionItemsIndex)}
                        p="0.25rem"
                        color="color-white"
                        ml="0.75rem"
                      >
                        <Flex
                          alignItems="center"
                          gap={2}
                        >
                          {isExpanded ? <CaretDown /> : <CaretRight />}
                          {t('columnNFTs')}
                        </Flex>
                      </AccordionButton>
                      <AccordionPanel
                        p={0}
                        overflowX="auto"
                        className="scroll-dark"
                      >
                        <NFTHeader />
                        {assetsNonFungible.map((asset, index) => (
                          <NFTRow
                            key={index}
                            asset={asset}
                            isLast={assetsNonFungible[assetsNonFungible.length - 1] === asset}
                          />
                        ))}
                      </AccordionPanel>
                    </Box>
                  )}
                </AccordionItem>
              )}
            </Accordion>
          </Show>
          <Show above="lg">
            {hasCoins && <CoinHeader />}
            {assetsFungible.map((coin, index) => {
              return (
                <CoinRow
                  key={index}
                  asset={coin}
                />
              );
            })}
            {hasDeFis && <DeFiHeader />}
            {assetsDeFi.map((asset, index) => {
              return (
                <DeFiRow
                  key={index}
                  asset={asset}
                />
              );
            })}
            {hasNFTs && <NFTHeader />}
            {assetsNonFungible.map((asset, index) => (
              <NFTRow
                key={index}
                asset={asset}
                isLast={index === assetsNonFungible.length - 1}
              />
            ))}
          </Show>
        </>
      )}
    </Box>
  );
}
