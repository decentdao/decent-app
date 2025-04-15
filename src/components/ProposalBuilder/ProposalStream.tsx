import {
  Accordion,
  AccordionButton,
  AccordionItem,
  AccordionPanel,
  Box,
  Checkbox,
  Divider,
  Flex,
  HStack,
  IconButton,
  Select,
  Text,
  VStack,
} from '@chakra-ui/react';
import { CaretDown, CaretRight, MinusCircle, Plus } from '@phosphor-icons/react';
import { Field, FieldAttributes, FieldProps } from 'formik';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { erc20Abi, formatUnits, getContract, isAddress } from 'viem';
import { useCurrentDAOKey } from '../../hooks/DAO/useCurrentDAOKey';
import useNetworkPublicClient from '../../hooks/useNetworkPublicClient';
import { useStore } from '../../providers/App/AppProvider';
import { useDaoInfoStore } from '../../store/daoInfo/useDaoInfoStore';
import { Stream } from '../../types/proposalBuilder';
import { scrollToBottom } from '../../utils/ui';
import { BigIntInput } from '../ui/forms/BigIntInput';
import ExampleLabel from '../ui/forms/ExampleLabel';
import { InputComponent, LabelComponent } from '../ui/forms/InputComponent';
import CeleryButtonWithIcon from '../ui/utils/CeleryButtonWithIcon';
import { DEFAULT_TRANCHE, SECONDS_IN_DAY } from './constants';

export function ProposalStream({
  stream,
  handleUpdateStream,
  index,
  pendingTransaction,
}: {
  stream: Stream;
  handleUpdateStream: (streamIndex: number, values: Partial<Stream>) => void;
  index: number;
  pendingTransaction: boolean;
}) {
  const publicClient = useNetworkPublicClient();
  const [tokenDecimals, setTokenDecimals] = useState(0);
  const [rawTokenBalance, setRawTokenBalnace] = useState(0n);
  const [tokenBalanceFormatted, setTokenBalanceFormatted] = useState('');
  const [expandedIndecies, setExpandedIndecies] = useState<number[]>([0]);
  const { safe } = useDaoInfoStore();
  const { daoKey } = useCurrentDAOKey();
  const {
    treasury: { assetsFungible },
  } = useStore({ daoKey });
  const { t } = useTranslation(['proposal', 'common']);

  const safeAddress = safe?.address;
  const fungibleNonNativeAssetsWithBalance = assetsFungible.filter(
    asset => !asset.possibleSpam && !asset.nativeToken && parseFloat(asset.balance) > 0,
  );
  const selectedAssetIndex = fungibleNonNativeAssetsWithBalance.findIndex(
    asset => asset.tokenAddress === stream.tokenAddress,
  );

  useEffect(() => {
    const fetchFormattedTokenBalance = async () => {
      if (safeAddress && stream.tokenAddress && isAddress(stream.tokenAddress)) {
        const tokenContract = getContract({
          abi: erc20Abi,
          client: publicClient,
          address: stream.tokenAddress,
        });
        const [tokenBalance, decimals, symbol, name] = await Promise.all([
          tokenContract.read.balanceOf([safeAddress]),
          tokenContract.read.decimals(),
          tokenContract.read.symbol(),
          tokenContract.read.name(),
        ]);
        setTokenDecimals(decimals);
        setRawTokenBalnace(tokenBalance);
        if (tokenBalance > 0n) {
          const balanceFormatted = formatUnits(tokenBalance, decimals);
          setTokenBalanceFormatted(`${balanceFormatted} ${symbol} (${name})`);
        }
      }
    };

    fetchFormattedTokenBalance();
  }, [safeAddress, publicClient, stream.tokenAddress]);

  return (
    <AccordionPanel p={0}>
      <VStack
        align="left"
        px="1.5rem"
        mt={6}
      >
        <Field name="selectedAsset">
          {({ field }: FieldAttributes<FieldProps<string>>) => (
            <LabelComponent
              label={t('streamedTokenAddress')}
              helper={t('streamedTokenAddressHelper', { balance: tokenBalanceFormatted })}
              isRequired
              disabled={pendingTransaction}
              subLabel={
                <HStack textStyle="labels-large">
                  <Text>{t('example', { ns: 'common' })}:</Text>
                  <ExampleLabel>0x4168592...</ExampleLabel>
                </HStack>
              }
            >
              <Select
                {...field}
                bgColor="neutral-1"
                borderColor="neutral-3"
                rounded="lg"
                cursor="pointer"
                iconSize="1.5rem"
                icon={<CaretDown />}
                data-testid="stream.tokenAddress"
                onChange={e => {
                  console.debug(
                    'Asdsad',
                    index,
                    Number(e.target.value),
                    fungibleNonNativeAssetsWithBalance[Number(e.target.value)],
                  );
                  handleUpdateStream(index, {
                    tokenAddress:
                      fungibleNonNativeAssetsWithBalance[Number(e.target.value)].tokenAddress,
                  });
                }}
                value={selectedAssetIndex}
              >
                {fungibleNonNativeAssetsWithBalance.map((asset, i) => (
                  <option
                    key={i}
                    value={i}
                  >
                    {asset.symbol}
                  </option>
                ))}
              </Select>
            </LabelComponent>
          )}
        </Field>
        <Divider
          variant="light"
          my="1rem"
        />
        <InputComponent
          label={t('recipientAddress')}
          helper={t('recipientAddressHelper')}
          placeholder="0x0000"
          isRequired
          disabled={pendingTransaction}
          subLabel={
            <HStack textStyle="labels-large">
              <Text>{t('example', { ns: 'common' })}:</Text>
              <ExampleLabel>0x4168592...</ExampleLabel>
            </HStack>
          }
          isInvalid={!!stream.recipientAddress && !isAddress(stream.recipientAddress)}
          value={stream.recipientAddress}
          testId="stream.recipientAddress"
          onChange={e => handleUpdateStream(index, { recipientAddress: e.target.value })}
        />
        <Divider
          variant="light"
          my="1rem"
        />
        <LabelComponent
          label={t('streamTotalAmount')}
          helper={t('streamTotalAmountHelper')}
          subLabel={
            <HStack textStyle="labels-large">
              <Text>{t('example', { ns: 'common' })}:</Text>
              <ExampleLabel>10000</ExampleLabel>
            </HStack>
          }
          isRequired
        >
          <BigIntInput
            value={stream.totalAmount.bigintValue}
            onChange={value => handleUpdateStream(index, { totalAmount: value })}
            decimalPlaces={tokenDecimals}
            maxValue={rawTokenBalance}
          />
        </LabelComponent>
        <Divider
          variant="light"
          my="1rem"
        />
        <Box>
          <Flex gap="0.5rem">
            <Checkbox
              sx={{
                '& .chakra-checkbox__control': {
                  borderRadius: '0.25rem',
                },
              }}
              isChecked={stream.cancelable}
              onChange={() => handleUpdateStream(index, { cancelable: !stream.cancelable })}
            />
            <Text>{t('cancelable')}</Text>
          </Flex>
          <Text color="neutral-7">{t('streamCancelableHelper')}</Text>
        </Box>
        <Box>
          <Flex gap="0.5rem">
            <Checkbox
              sx={{
                '& .chakra-checkbox__control': {
                  borderRadius: '0.25rem',
                },
              }}
              checked={stream.transferable}
              onChange={() => handleUpdateStream(index, { transferable: !stream.transferable })}
            />
            <Text>{t('transferable')}</Text>
          </Flex>
          <Text color="neutral-7">{t('streamTransferableHelper')}</Text>
        </Box>
        <Divider
          variant="light"
          my="1rem"
        />
        <Box mt="1.5rem">
          <Accordion
            allowMultiple
            index={expandedIndecies}
          >
            {stream.tranches.map((tranche, trancheIndex) => (
              <AccordionItem
                key={trancheIndex}
                borderTop="none"
                borderBottom="none"
                padding="1rem"
                borderRadius={4}
                bg="neutral-3"
                px={0}
                py="1.5rem"
              >
                {({ isExpanded }) => (
                  <>
                    <Box>
                      {/* STREAM TRANCHE HEADER */}
                      <HStack
                        px="1.5rem"
                        justify="space-between"
                      >
                        <AccordionButton
                          onClick={() => {
                            setExpandedIndecies(indexArray => {
                              if (indexArray.includes(trancheIndex)) {
                                const newTxArr = [...indexArray];
                                newTxArr.splice(newTxArr.indexOf(trancheIndex), 1);
                                return newTxArr;
                              } else {
                                return [...indexArray, trancheIndex];
                              }
                            });
                          }}
                          p={0}
                          textStyle="heading-small"
                          color="lilac-0"
                        >
                          <Text textStyle="heading-small">
                            <Flex
                              alignItems="center"
                              gap={2}
                            >
                              {isExpanded ? <CaretDown /> : <CaretRight />}
                              {t('tranche', { index: trancheIndex + 1 })}
                            </Flex>
                          </Text>
                        </AccordionButton>

                        {/* Remove tranche button */}
                        {trancheIndex !== 0 || stream.tranches.length !== 1 ? (
                          <IconButton
                            icon={<MinusCircle />}
                            aria-label={t('removeTranche')}
                            variant="unstyled"
                            onClick={() =>
                              handleUpdateStream(index, {
                                tranches: stream.tranches.filter(
                                  (_, removedTrancheIndex) => removedTrancheIndex !== trancheIndex,
                                ),
                              })
                            }
                            minWidth="auto"
                            color="lilac-0"
                            _disabled={{ opacity: 0.4, cursor: 'default' }}
                            sx={{ '&:disabled:hover': { color: 'inherit', opacity: 0.4 } }}
                            isDisabled={pendingTransaction}
                          />
                        ) : (
                          <Box h="2.25rem" />
                        )}
                      </HStack>

                      {/* STREAM TRANCHE SECTION */}
                      <AccordionPanel p={0}>
                        <Flex mt="1rem">
                          <Box
                            px="1.5rem"
                            w="100%"
                          >
                            <Box mt={4}>
                              <LabelComponent
                                isRequired
                                label={t('trancheAmount')}
                                subLabel={
                                  <HStack wordBreak="break-all">
                                    <Text>
                                      {t('example', { ns: 'common' })}:{' '}
                                      <ExampleLabel bg="neutral-4">1000</ExampleLabel>
                                    </Text>
                                  </HStack>
                                }
                              >
                                <BigIntInput
                                  isRequired
                                  value={tranche.amount.bigintValue}
                                  decimalPlaces={tokenDecimals}
                                  placeholder="1000"
                                  onChange={value =>
                                    handleUpdateStream(index, {
                                      tranches: stream.tranches.map((item, updatedTrancheIndex) =>
                                        updatedTrancheIndex === trancheIndex
                                          ? { ...item, amount: value }
                                          : item,
                                      ),
                                    })
                                  }
                                />
                              </LabelComponent>
                            </Box>
                            <Box mt={4}>
                              <LabelComponent
                                isRequired
                                label={t('trancheDuration')}
                                subLabel={
                                  <VStack wordBreak="break-all">
                                    <Text>
                                      {t('trancheDurationHelper')}
                                      {index === 0 && '. ' + t('trancheDurationHelperFirstTranche')}
                                    </Text>
                                    <Text>
                                      {t('example', { ns: 'common' })}:{' '}
                                      <ExampleLabel bg="neutral-4">
                                        {SECONDS_IN_DAY * 30} (1 month)
                                      </ExampleLabel>
                                    </Text>
                                  </VStack>
                                }
                              >
                                <BigIntInput
                                  isRequired
                                  value={tranche.duration.bigintValue}
                                  placeholder={(SECONDS_IN_DAY * 365).toString()}
                                  decimalPlaces={0}
                                  min={index === 0 ? '1' : undefined}
                                  step={1}
                                  onChange={value =>
                                    handleUpdateStream(index, {
                                      tranches: stream.tranches.map((item, updatedTrancheIndex) =>
                                        updatedTrancheIndex === trancheIndex
                                          ? { ...item, duration: value }
                                          : item,
                                      ),
                                    })
                                  }
                                />
                              </LabelComponent>
                            </Box>
                            <Divider
                              variant="light"
                              my="1rem"
                            />
                          </Box>
                        </Flex>
                      </AccordionPanel>
                    </Box>

                    {!isExpanded && (
                      <Divider
                        variant="light"
                        mt="0.5rem"
                      />
                    )}

                    {/* ADD TRANCHE BUTTON */}
                    {trancheIndex === stream.tranches.length - 1 && (
                      <CeleryButtonWithIcon
                        onClick={() => {
                          handleUpdateStream(index, {
                            tranches: [...stream.tranches, DEFAULT_TRANCHE],
                          });
                          setExpandedIndecies([stream.tranches.length]);
                          scrollToBottom(100, 'smooth');
                        }}
                        icon={Plus}
                        text={t('addTranche')}
                      />
                    )}
                  </>
                )}
              </AccordionItem>
            ))}
          </Accordion>
        </Box>
      </VStack>
    </AccordionPanel>
  );
}
