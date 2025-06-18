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
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Address, erc20Abi, formatUnits, getContract, isAddress } from 'viem';
import { useCurrentDAOKey } from '../../hooks/DAO/useCurrentDAOKey';
import useLockedToken from '../../hooks/DAO/useLockedToken';
import useNetworkPublicClient from '../../hooks/useNetworkPublicClient';
import { useFilterSpamTokens } from '../../hooks/utils/useFilterSpamTokens';
import { useDAOStore } from '../../providers/App/AppProvider';
import { useNetworkConfigStore } from '../../providers/NetworkConfig/useNetworkConfigStore';
import { BigIntValuePair } from '../../types';
import { Stream } from '../../types/proposalBuilder';
import { formatCoin } from '../../utils';
import { scrollToBottom } from '../../utils/ui';
import { BigIntInput } from '../ui/forms/BigIntInput';
import DurationUnitStepperInput from '../ui/forms/DurationUnitStepperInput';
import ExampleLabel from '../ui/forms/ExampleLabel';
import { InputComponent, LabelComponent } from '../ui/forms/InputComponent';
import { DisplayAddress } from '../ui/links/DisplayAddress';
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
  const { daoKey } = useCurrentDAOKey();
  const {
    treasury: { assetsFungible },
    node: { safe },
  } = useDAOStore({ daoKey });
  const filterSpamTokens = useFilterSpamTokens();
  const { t } = useTranslation(['proposal', 'common']);
  const {
    contracts: { sablierV2Batch },
  } = useNetworkConfigStore();
  const { tokenState } = useLockedToken({
    token: stream.tokenAddress as Address,
    account: sablierV2Batch,
  });

  const safeAddress = safe?.address;
  const fungibleNonNativeAssetsWithBalance = filterSpamTokens(assetsFungible);
  const selectedAssetIndex = fungibleNonNativeAssetsWithBalance.findIndex(
    asset => asset.tokenAddress === stream.tokenAddress,
  );

  const calcNewTotalAmount = useCallback(
    (trancheIndex: number, addValue?: bigint | undefined) => {
      const newTotalAmountBigIntValue =
        stream.tranches
          .filter((_, itemIndex) => itemIndex !== trancheIndex)
          .map(item => item.amount.bigintValue || 0n)
          .reduce((acc, curr) => acc + curr, 0n) + (addValue || 0n);
      const newTotalAmount: BigIntValuePair = {
        bigintValue: newTotalAmountBigIntValue,
        value: formatUnits(newTotalAmountBigIntValue, tokenDecimals),
      };
      return newTotalAmount;
    },
    [stream.tranches, tokenDecimals],
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
          const balanceFormatted = formatCoin(tokenBalance, true, decimals, symbol, false);
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
              errorMessage={tokenState.canTransfer ? undefined : t('streamIsNotTransferable')}
              subLabel={
                <Box marginX="-0.75rem">
                  <DisplayAddress
                    address={stream.tokenAddress as Address}
                    truncate={false}
                  />
                </Box>
              }
            >
              <Select
                {...field}
                bgColor="color-black"
                borderColor="color-neutral-900"
                rounded="lg"
                cursor="pointer"
                iconSize="1.5rem"
                icon={<CaretDown />}
                data-testid="stream.tokenAddress"
                onChange={e => {
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
            <HStack textStyle="text-sm-medium">
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
          <Text color="color-neutral-300">{t('streamCancelableHelper')}</Text>
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
          <Text color="color-neutral-300">{t('streamTransferableHelper')}</Text>
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
                bg="color-neutral-900"
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
                          textStyle="text-xl-regular"
                          color="color-lilac-100"
                        >
                          <Text textStyle="text-xl-regular">
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
                                totalAmount: calcNewTotalAmount(trancheIndex),
                              })
                            }
                            minWidth="auto"
                            color="color-lilac-100"
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
                                      <ExampleLabel bg="color-neutral-800">1000</ExampleLabel>
                                    </Text>
                                  </HStack>
                                }
                              >
                                <BigIntInput
                                  isRequired
                                  value={tranche.amount.bigintValue}
                                  parentFormikValue={tranche.amount}
                                  decimalPlaces={tokenDecimals}
                                  placeholder="1000"
                                  maxValue={
                                    rawTokenBalance -
                                    (calcNewTotalAmount(trancheIndex).bigintValue || 0n)
                                  }
                                  onChange={value =>
                                    handleUpdateStream(index, {
                                      tranches: stream.tranches.map((item, updatedTrancheIndex) =>
                                        updatedTrancheIndex === trancheIndex
                                          ? { ...item, amount: value }
                                          : item,
                                      ),
                                      totalAmount: calcNewTotalAmount(
                                        trancheIndex,
                                        value.bigintValue,
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
                                      <ExampleLabel bg="color-neutral-800">
                                        {SECONDS_IN_DAY * 30} (1 month)
                                      </ExampleLabel>
                                    </Text>
                                  </VStack>
                                }
                              >
                                <DurationUnitStepperInput
                                  minSeconds={trancheIndex === 0 ? 1 : 0}
                                  secondsValue={Number(tranche.duration.bigintValue || 0n)}
                                  onSecondsValueChange={value => {
                                    const duration: BigIntValuePair = {
                                      bigintValue: value !== undefined ? BigInt(value) : undefined,
                                      value: value !== undefined ? value.toString() : '',
                                    };
                                    handleUpdateStream(index, {
                                      tranches: stream.tranches.map((item, updatedTrancheIndex) =>
                                        updatedTrancheIndex === trancheIndex
                                          ? { ...item, duration }
                                          : item,
                                      ),
                                    });
                                  }}
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
