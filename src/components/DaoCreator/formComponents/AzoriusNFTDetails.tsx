import { Box, Flex, Grid, GridItem, IconButton, Input } from '@chakra-ui/react';
import { MinusCircle, Plus } from '@phosphor-icons/react';
import { Field, FieldAttributes, FormikErrors } from 'formik';
import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { zeroAddress } from 'viem';
import { createAccountSubstring } from '../../../hooks/utils/useGetAccountName';
import { BigIntValuePair, ERC721TokenConfig, ICreationStepProps } from '../../../types';
import ContentBoxTitle from '../../ui/containers/ContentBox/ContentBoxTitle';
import { BigIntInput } from '../../ui/forms/BigIntInput';
import { LabelComponent } from '../../ui/forms/InputComponent';
import CeleryButtonWithIcon from '../../ui/utils/CeleryButtonWithIcon';
import Divider from '../../ui/utils/Divider';
import { StepButtons } from '../StepButtons';
import { StepWrapper } from '../StepWrapper';
import AzoriusNFTDetail from './AzoriusNFTDetail';

export default function AzoriusNFTDetails(props: ICreationStepProps) {
  const { transactionPending, isSubDAO, setFieldValue, values, isSubmitting, mode, errors } = props;
  const { t } = useTranslation('daoCreate');

  const handleAddNFT = () => {
    setFieldValue('erc721Token.nfts', [
      ...values.erc721Token.nfts,
      { tokenAddress: undefined, tokenWeight: { value: '' } },
    ]);
  };

  const handleRemoveNFT = (indexToRemove: number) => {
    setFieldValue(
      'erc721Token.nfts',
      values.erc721Token.nfts.filter((_, i) => i !== indexToRemove),
    );
  };

  return (
    <>
      <StepWrapper
        mode={mode}
        isSubDAO={isSubDAO}
        isFormSubmitting={!!isSubmitting || transactionPending}
        allSteps={props.steps}
        stepNumber={2}
        shouldWrapChildren={false}
      >
        <Grid
          gap={4}
          templateColumns={{ base: '1fr', lg: '2fr 1fr' }}
          templateAreas={{
            base: '"content" "details"',
            lg: '"content details"',
          }}
        >
          <GridItem area="content">
            <Flex
              flexDirection="column"
              gap={5}
              alignItems="flex-start"
              mt="1.5rem"
              padding="1.5rem"
              bg="color-neutral-950"
              borderRadius="0.25rem"
            >
              <ContentBoxTitle>{t('titleNFTsParams')}</ContentBoxTitle>
              {values.erc721Token.nfts.map((nft, i) => {
                const nftError = (
                  errors?.erc721Token?.nfts as FormikErrors<
                    ERC721TokenConfig<BigIntValuePair>[] | undefined
                  >
                )?.[i];
                const addressErrorMessage =
                  nftError?.tokenAddress && nft.tokenAddress?.length
                    ? nftError.tokenAddress
                    : undefined;
                const weightErrorMessage =
                  nftError?.tokenWeight &&
                  nftError.tokenWeight.value &&
                  nft.tokenWeight.value.length
                    ? nftError.tokenWeight.value
                    : undefined;

                const isFirstElement = i === 0;
                const isLastElement = i === values.erc721Token.nfts.length - 1;
                return (
                  <Flex
                    key={i}
                    gap={4}
                    alignItems="flex-start"
                    width="100%"
                  >
                    <LabelComponent
                      label={isFirstElement ? t('labelNFTAddress') : undefined}
                      helper={isLastElement ? t('helperNFTAddress') : undefined}
                      isRequired={isFirstElement}
                      helperSlot="end"
                      errorMessage={addressErrorMessage}
                      gridContainerProps={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        width: '65%',
                      }}
                      inputContainerProps={{
                        width: '100%',
                      }}
                    >
                      <Field name={`erc721Token.nfts.${i}.tokenAddress`}>
                        {({ field }: FieldAttributes<any>) => (
                          <Input
                            {...field}
                            value={nft.tokenAddress}
                            onChange={e =>
                              setFieldValue(`erc721Token.nfts.${i}.tokenAddress`, e.target.value)
                            }
                            data-testid={`erc721Token.nfts.${i}.tokenAddressInput`}
                            minWidth="100%"
                            placeholder={createAccountSubstring(zeroAddress)}
                            isInvalid={!!addressErrorMessage}
                          />
                        )}
                      </Field>
                    </LabelComponent>
                    <LabelComponent
                      label={isFirstElement ? t('labelNFTWeight') : undefined}
                      helper={isLastElement ? t('helperNFTWeight') : undefined}
                      isRequired={isFirstElement}
                      errorMessage={weightErrorMessage}
                      helperSlot="end"
                      gridContainerProps={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        width: '35%',
                      }}
                      inputContainerProps={{
                        width: '100%',
                      }}
                    >
                      <Flex>
                        <BigIntInput
                          value={nft.tokenWeight.bigintValue}
                          onChange={valuePair =>
                            setFieldValue(`erc721Token.nfts.${i}.tokenWeight`, valuePair)
                          }
                          data-testid={`erc721Token.nfts.${i}.tokenWeightInput`}
                          decimalPlaces={0}
                          isRequired
                          min="1"
                          placeholder="1"
                          isInvalid={!!weightErrorMessage}
                        />
                        {values.erc721Token.nfts.length > 1 && (
                          <IconButton
                            aria-label="remove NFT from the list"
                            icon={<MinusCircle size="24" />}
                            variant="unstyled"
                            minWidth="auto"
                            color="color-lilac-100"
                            _disabled={{ opacity: 0.4, cursor: 'default' }}
                            sx={{ '&:disabled:hover': { color: 'inherit', opacity: 0.4 } }}
                            type="button"
                            onClick={() => handleRemoveNFT(i)}
                            mt="-0.25rem"
                            ml="0.5rem"
                          />
                        )}
                      </Flex>
                    </LabelComponent>
                  </Flex>
                );
              })}
              <CeleryButtonWithIcon
                onClick={handleAddNFT}
                icon={Plus}
                text={t('addNFTButton')}
              />
            </Flex>
          </GridItem>
          <GridItem
            area="details"
            width="100%"
          >
            <Box
              rounded="lg"
              border="1px solid"
              borderColor="color-neutral-900"
              p={6}
              maxWidth="400px"
              mt="1.5rem"
            >
              <ContentBoxTitle>{t('titleNFTDetails')}</ContentBoxTitle>
              <Divider my="1rem" />
              {values.erc721Token.nfts.map((nft, i) => {
                const nftError = (
                  errors?.erc721Token?.nfts as FormikErrors<
                    ERC721TokenConfig<BigIntValuePair>[] | undefined
                  >
                )?.[i];
                const addressErrorMessage =
                  nftError?.tokenAddress && nft.tokenAddress?.length
                    ? nftError.tokenAddress
                    : undefined;
                return (
                  <Fragment key={i}>
                    <AzoriusNFTDetail
                      nft={nft}
                      hasAddressError={!!addressErrorMessage}
                    />
                    {i < values.erc721Token.nfts.length - 1 && <Divider my="2rem" />}
                  </Fragment>
                );
              })}
            </Box>
          </GridItem>
        </Grid>
      </StepWrapper>
      <StepButtons {...props} />
    </>
  );
}
