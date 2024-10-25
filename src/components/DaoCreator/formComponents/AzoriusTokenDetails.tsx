import { Box, Flex, Input, RadioGroup, Text } from '@chakra-ui/react';
import { Info } from '@phosphor-icons/react';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { erc20Abi, getContract, isAddress, zeroAddress } from 'viem';
import { usePublicClient, useWalletClient } from 'wagmi';
import { createAccountSubstring } from '../../../hooks/utils/useGetAccountName';
import { ICreationStepProps, TokenCreationType } from '../../../types';
import SupportTooltip from '../../ui/badges/SupportTooltip';
import ContentBoxTitle from '../../ui/containers/ContentBox/ContentBoxTitle';
import { LabelComponent } from '../../ui/forms/InputComponent';
import LabelWrapper from '../../ui/forms/LabelWrapper';
import { RadioWithText } from '../../ui/forms/Radio/RadioWithText';
import { StepButtons } from '../StepButtons';
import { StepWrapper } from '../StepWrapper';
import { usePrepareFormData } from '../hooks/usePrepareFormData';
import useStepRedirect from '../hooks/useStepRedirect';
import { AzoriusTokenAllocations } from './AzoriusTokenAllocations';
import { VotesTokenImport } from './VotesTokenImport';
import { VotesTokenNew } from './VotesTokenNew';

function TokenConfigDisplay(props: ICreationStepProps) {
  switch (props.values.erc20Token.tokenCreationType) {
    case TokenCreationType.NEW:
      return <VotesTokenNew {...props} />;
    case TokenCreationType.IMPORTED:
      return <VotesTokenImport {...props} />;
    default:
      return null;
  }
}

export function AzoriusTokenDetails(props: ICreationStepProps) {
  const {
    transactionPending,
    isSubDAO,
    setFieldValue,
    values,
    errors,
    handleChange,
    isSubmitting,
    mode,
  } = props;

  const { t } = useTranslation('daoCreate');
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  const { checkVotesToken } = usePrepareFormData();
  const [isImportedVotesToken, setIsImportedVotesToken] = useState<boolean>();

  useStepRedirect({ values });
  const updateImportFields = useCallback(async () => {
    if (!publicClient) {
      return;
    }
    const importAddress = values.erc20Token.tokenImportAddress;
    const importError = errors?.erc20Token?.tokenImportAddress;
    if (importAddress && !importError && isAddress(importAddress)) {
      const isVotesToken = await checkVotesToken(importAddress);
      const tokenContract = getContract({
        address: importAddress,
        abi: erc20Abi,
        client: { wallet: walletClient, public: publicClient },
      });
      const [name, symbol, decimals] = await Promise.all([
        tokenContract.read.name(),
        tokenContract.read.symbol(),
        tokenContract.read.decimals(),
      ]);

      // @dev: this turns "total supply" into the human-readable form (without decimals)
      const totalSupply = Number(
        (await tokenContract.read.totalSupply()) / 10n ** BigInt(decimals),
      );

      setFieldValue(
        'erc20Token.tokenSupply',
        {
          value: totalSupply,
          bigintValue: BigInt(totalSupply),
        },
        true,
      );
      if (!isVotesToken) {
        setFieldValue('erc20Token.tokenName', 'Wrapped ' + name, true);
        setFieldValue('erc20Token.tokenSymbol', 'W' + symbol, true);
        setIsImportedVotesToken(false);
      } else {
        setIsImportedVotesToken(true);
        setFieldValue('erc20Token.tokenName', name, true);
        setFieldValue('erc20Token.tokenSymbol', symbol, true);
      }
    } else {
      setIsImportedVotesToken(undefined);
    }
  }, [
    checkVotesToken,
    errors?.erc20Token?.tokenImportAddress,
    setFieldValue,
    publicClient,
    walletClient,
    values.erc20Token.tokenImportAddress,
  ]);

  useEffect(() => {
    updateImportFields();
  }, [updateImportFields]);

  const tokenImportAddressErrorMessage =
    values.erc20Token.tokenImportAddress && errors?.erc20Token?.tokenImportAddress
      ? errors.erc20Token.tokenImportAddress
      : undefined;

  return (
    <>
      <StepWrapper
        mode={mode}
        isSubDAO={isSubDAO}
        isFormSubmitting={!!isSubmitting || transactionPending}
        titleKey="titleAzoriusConfig"
      >
        <Flex
          flexDirection="column"
          gap={4}
        >
          <ContentBoxTitle>{t('titleTokenSupply')}</ContentBoxTitle>
          <LabelComponent
            label={t('labelSelectToken')}
            helper={t('helperSelectToken')}
            isRequired
          >
            <RadioGroup
              display="flex"
              flexDirection="column"
              name="erc20Token.tokenCreationType"
              gap={4}
              mt="-0.5rem" // RadioGroup renders empty paragraph with margin, seems like this is only feasible way to align this group
              id="erc20Token.tokenCreationType"
              value={values.erc20Token.tokenCreationType}
              onChange={value => {
                setFieldValue('erc20Token.tokenCreationType', value);
              }}
            >
              <RadioWithText
                label={t('radioLabelNewToken')}
                description={t('helperNewToken')}
                testId="choose-newToken"
                value={TokenCreationType.NEW}
                onClick={() => {
                  setFieldValue('erc20Token.tokenImportAddress', '');
                  setFieldValue('erc20Token.tokenName', '');
                  setFieldValue('erc20Token.tokenSymbol', '');
                  setFieldValue('erc20Token.tokenSupply', '');
                }}
              />
              <RadioWithText
                label={t('radioLabelExistingToken')}
                description={t('helperExistingToken')}
                testId="choose-existingToken"
                value={TokenCreationType.IMPORTED}
                onClick={() => {
                  setFieldValue('erc20Token.tokenName', '');
                  setFieldValue('erc20Token.tokenSymbol', '');
                  setFieldValue('erc20Token.tokenSupply', '');
                }}
              />
              {values.erc20Token.tokenCreationType === TokenCreationType.IMPORTED && (
                <>
                  <LabelWrapper errorMessage={tokenImportAddressErrorMessage}>
                    <Input
                      name="erc20Token.tokenImportAddress"
                      onChange={handleChange}
                      value={values.erc20Token.tokenImportAddress}
                      placeholder={createAccountSubstring(zeroAddress)}
                      isInvalid={!!tokenImportAddressErrorMessage}
                      isRequired
                    />
                  </LabelWrapper>
                  {isImportedVotesToken === false && !errors.erc20Token?.tokenImportAddress && (
                    <Flex
                      gap={4}
                      alignItems="center"
                    >
                      <SupportTooltip
                        IconComponent={Info}
                        label={t('warningExistingTokenTooltip')}
                        color="neutral-7"
                      />
                      <Text
                        color="neutral-7"
                        textStyle="helper-text-base"
                        whiteSpace="pre-wrap"
                      >
                        {t('warningExistingToken')}
                      </Text>
                    </Flex>
                  )}
                </>
              )}
            </RadioGroup>
          </LabelComponent>
        </Flex>
      </StepWrapper>
      <Box
        mt="1.5rem"
        padding="1.5rem"
        bg="neutral-2"
        borderRadius="0.25rem"
      >
        <TokenConfigDisplay {...props} />
      </Box>
      {values.erc20Token.tokenCreationType === TokenCreationType.NEW && (
        <Box
          mt="1.5rem"
          padding="1.5rem"
          bg="neutral-2"
          borderRadius="0.25rem"
        >
          <AzoriusTokenAllocations {...props} />
        </Box>
      )}
      <StepButtons {...props} />
    </>
  );
}
