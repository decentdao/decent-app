import {
  Box,
  Flex,
  Text,
  Show,
  Hide,
  Accordion,
  AccordionButton,
  AccordionItem,
  AccordionPanel,
} from '@chakra-ui/react';
import { CaretDown, CaretRight } from '@phosphor-icons/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFractal } from '../../../../providers/App/AppProvider';
import { formatUSD } from '../../../../utils/numberFormats';
import Divider from '../../../ui/utils/Divider';
import { CoinHeader, CoinRow } from './AssetCoin';
import { NFTHeader, NFTRow } from './AssetNFT';
import { DeFiHeader, DeFiRow } from './AssetDeFi';
import LidoButtons from './LidoButtons';

export function Assets() {
  const {
    node: { daoAddress },
    treasury: { assetsFungible, assetsNonFungible, assetsDeFi, totalUsdValue },
  } = useFractal();
  const { t } = useTranslation('treasury');
  const [expandedIndecies, setExpandedIndecies] = useState<number[]>([]);

  const hasAssets =
    assetsFungible.length > 0 || assetsNonFungible.length > 0 || assetsDeFi.length > 0;

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

  return (
    <Box mt={{ base: '1rem', lg: 0 }}>
      <Text
        textStyle="label-small"
        color="neutral-7"
        px={{ base: '1rem', lg: '1.5rem' }}
      >
        {t('subtitleCoinBalance')}
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
      {hasAssets && daoAddress && (
        <>
          <Show below="lg">
            <Accordion
              allowMultiple
              index={expandedIndecies}
            >
              {assetsFungible.length > 0 && (
                <AccordionItem
                  borderTop="none"
                  borderBottom="none"
                >
                  {({ isExpanded }) => (
                    <Box>
                      <AccordionButton
                        onClick={() => toggleAccordionItem(0)}
                        p="0.25rem"
                        textStyle="body-base"
                        color="white-0"
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
                        onClick={() => toggleAccordionItem(assetsFungible.length > 0 ? 1 : 0)}
                        p="0.25rem"
                        textStyle="body-base"
                        color="white-0"
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
                    </Box>
                  )}
                </AccordionItem>
              )}
              {assetsNonFungible.length > 0 && (
                <AccordionItem
                  borderTop="none"
                  borderBottom="none"
                >
                  {({ isExpanded }) => (
                    <Box>
                      <AccordionButton
                        onClick={() => toggleAccordionItem(assetsFungible.length > 0 ? 1 : 0)}
                        p="0.25rem"
                        textStyle="body-base"
                        color="white-0"
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
            {assetsFungible.length > 0 && <CoinHeader />}
            {assetsFungible.map((coin, index) => {
              return (
                <CoinRow
                  key={index}
                  asset={coin}
                />
              );
            })}
            {assetsDeFi.length > 0 && <DeFiHeader />}
            {assetsDeFi.map((asset, index) => {
              return <DeFiRow key={index} asset={asset} />
            })}
            {assetsNonFungible.length > 0 && <NFTHeader />}
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
