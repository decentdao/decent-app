import { Box, Flex, Input, RadioGroup, Text } from '@chakra-ui/react';
import { useFormikContext } from 'formik';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { erc20Abi, getContract, isAddress, zeroAddress } from 'viem';
import { useCurrentDAOKey } from '../../../hooks/DAO/useCurrentDAOKey';
import useNetworkPublicClient from '../../../hooks/useNetworkPublicClient';
import { createAccountSubstring } from '../../../hooks/utils/useGetAccountName';
import { useDAOStore } from '../../../providers/App/AppProvider';
import { CreatorFormState, ICreationStepProps, TokenCreationType } from '../../../types';
import ContentBoxTitle from '../../ui/containers/ContentBox/ContentBoxTitle';
import LabelWrapper from '../../ui/forms/LabelWrapper';
import { RadioWithText } from '../../ui/forms/Radio/RadioWithText';
import { StepButtons } from '../StepButtons';
import { StepWrapper } from '../StepWrapper';
import { usePrepareFormData } from '../hooks/usePrepareFormData';
import useStepRedirect from '../hooks/useStepRedirect';
import { AzoriusTokenAllocations } from './AzoriusTokenAllocations';
import { DAOCreateMode } from './EstablishEssentials';
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

function TokenCreationTypeHeader(props: { tokenErrorMsg: string; formProps: ICreationStepProps }) {
  const { t } = useTranslation('daoCreate');
  const { values, setFieldValue, setTouched, touched, handleChange, mode } = props.formProps;

  const { daoKey } = useCurrentDAOKey();
  const {
    governance: { erc20Token },
  } = useDAOStore({ daoKey });

  const deployedTokenAddress = erc20Token?.address;
  const hasMultisigERC20TokenDeployed =
    mode === DAOCreateMode.EDIT && deployedTokenAddress !== undefined;

  useEffect(() => {
    if (hasMultisigERC20TokenDeployed) {
      setFieldValue('erc20Token.tokenImportAddress', deployedTokenAddress);
    }
  }, [deployedTokenAddress, hasMultisigERC20TokenDeployed, setFieldValue]);

  return (
    <Flex
      flexDirection="column"
      gap={4}
    >
      <ContentBoxTitle>{t('titleTokenContract')}</ContentBoxTitle>
      <RadioGroup
        display="flex"
        flexDirection="row"
        name="erc20Token.tokenCreationType"
        gap={8}
        ml="0.25rem"
        id="erc20Token.tokenCreationType"
        value={values.erc20Token.tokenCreationType}
        onChange={value => {
          setFieldValue('erc20Token.tokenCreationType', value);
        }}
      >
        <RadioWithText
          label={t('radioLabelExistingToken')}
          description={t('helperExistingToken')}
          testId="choose-existingToken"
          value={TokenCreationType.IMPORTED}
          onClick={() => {
            if (!hasMultisigERC20TokenDeployed) {
              setFieldValue('erc20Token.tokenName', '');
              setFieldValue('erc20Token.tokenSymbol', '');
              setFieldValue('erc20Token.tokenSupply', '');
            }
          }}
        />
        <RadioWithText
          label={t('radioLabelNewToken')}
          description={t('helperNewToken')}
          testId="choose-newToken"
          value={TokenCreationType.NEW}
          disabled={hasMultisigERC20TokenDeployed}
          onClick={() => {
            setFieldValue('erc20Token.tokenImportAddress', '');
            setFieldValue('erc20Token.tokenName', '');
            setFieldValue('erc20Token.tokenSymbol', '');
            setFieldValue('erc20Token.tokenSupply', '');
          }}
        />
      </RadioGroup>
      {values.erc20Token.tokenCreationType === TokenCreationType.IMPORTED && (
        <>
          <LabelWrapper
            subLabel={
              hasMultisigERC20TokenDeployed ? (
                <Text textStyle="text-sm-semibold">{t('labelTokenContractAlreadyConfigured')}</Text>
              ) : null
            }
            errorMessage={props.tokenErrorMsg}
          >
            <Input
              name="erc20Token.tokenImportAddress"
              onChange={e => {
                setTouched({
                  erc20Token: {
                    tokenImportAddress: true,
                  },
                  ...touched,
                });

                handleChange(e);
              }}
              value={values.erc20Token.tokenImportAddress}
              placeholder={createAccountSubstring(zeroAddress)}
              isInvalid={!!props.tokenErrorMsg}
              isRequired
            />
          </LabelWrapper>
        </>
      )}
    </Flex>
  );
}

export function AzoriusTokenDetails(props: ICreationStepProps & { withSteps: boolean }) {
  const { transactionPending, isSubDAO, setFieldValue, errors, isSubmitting, mode, withSteps } =
    props;

  const { t } = useTranslation('daoCreate');
  const publicClient = useNetworkPublicClient();

  const { values, touched } = useFormikContext<CreatorFormState>();

  const { checkVotesToken } = usePrepareFormData();
  const [isImportedVotesToken, setIsValidERC20VotesToken] = useState<boolean>();

  useStepRedirect({ values });
  const updateImportFields = useCallback(async () => {
    const importAddress = values.erc20Token.tokenImportAddress;
    const importError = errors?.erc20Token?.tokenImportAddress;
    if (importAddress && !importError && isAddress(importAddress)) {
      const isVotesToken = await checkVotesToken(importAddress);
      const tokenContract = getContract({
        address: importAddress,
        abi: erc20Abi,
        client: publicClient,
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
      if (isVotesToken) {
        setIsValidERC20VotesToken(true);
        setFieldValue('erc20Token.tokenName', name, true);
        setFieldValue('erc20Token.tokenSymbol', symbol, true);
      }
    } else {
      setIsValidERC20VotesToken(undefined);
    }
  }, [
    checkVotesToken,
    errors?.erc20Token?.tokenImportAddress,
    setFieldValue,
    publicClient,
    values.erc20Token.tokenImportAddress,
  ]);

  useEffect(() => {
    updateImportFields();
  }, [updateImportFields]);

  let tokenErrorMsg = '';

  if (touched.erc20Token?.tokenImportAddress) {
    tokenErrorMsg =
      errors?.erc20Token?.tokenImportAddress ||
      (!isImportedVotesToken ? t('errorNotVotingToken') : '');
  }

  return (
    <>
      {withSteps && (
        <StepWrapper
          mode={mode}
          isSubDAO={isSubDAO}
          isFormSubmitting={!!isSubmitting || transactionPending}
          allSteps={props.steps}
          stepNumber={2}
        >
          <TokenCreationTypeHeader
            tokenErrorMsg={tokenErrorMsg}
            formProps={props}
          />
        </StepWrapper>
      )}

      {!withSteps && (
        <Box
          mt="1.5rem"
          padding="1.5rem"
          bg="color-neutral-950"
          borderRadius="0.25rem"
        >
          <TokenCreationTypeHeader
            tokenErrorMsg={tokenErrorMsg}
            formProps={props}
          />
        </Box>
      )}
      <Box
        mt="1.5rem"
        padding="1.5rem"
        bg="color-neutral-950"
        borderRadius="0.25rem"
      >
        <TokenConfigDisplay {...props} />
      </Box>
      {values.erc20Token.tokenCreationType === TokenCreationType.NEW && (
        <Box
          mt="1.5rem"
          padding="1.5rem"
          bg="color-neutral-950"
          borderRadius="0.25rem"
        >
          <AzoriusTokenAllocations {...props} />
        </Box>
      )}

      {withSteps && <StepButtons {...props} />}
    </>
  );
}
