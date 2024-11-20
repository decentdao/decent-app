import {
  Alert,
  Box,
  Flex,
  FormControl,
  InputGroup,
  InputRightElement,
  Switch,
  Text,
} from '@chakra-ui/react';
import { Info } from '@phosphor-icons/react';
import { Field, FieldAttributes, FieldProps } from 'formik';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFractal } from '../../../providers/App/AppProvider';
import { useDaoInfoStore } from '../../../store/daoInfo/useDaoInfoStore';
import { BigIntValuePair, GovernanceType, ICreationStepProps } from '../../../types';
import { formatBigIntToHumanReadableString } from '../../../utils/numberFormats';
import ContentBoxTitle from '../../ui/containers/ContentBox/ContentBoxTitle';
import { BigIntInput } from '../../ui/forms/BigIntInput';
import { CustomNonceInput } from '../../ui/forms/CustomNonceInput';
import { LabelComponent } from '../../ui/forms/InputComponent';
import { StepButtons } from '../StepButtons';
import { StepWrapper } from '../StepWrapper';
import { useParentSafeVotingWeight } from '../hooks/useParentSafeVotingWeight';
import useStepRedirect from '../hooks/useStepRedirect';

function GuardDetails(props: ICreationStepProps) {
  const { values, isSubmitting, transactionPending, isSubDAO, setFieldValue, mode, errors } = props;

  const { governance } = useFractal();
  const { safe } = useDaoInfoStore();
  const { type } = governance;
  const [showCustomNonce, setShowCustomNonce] = useState<boolean>();
  const { t } = useTranslation(['daoCreate', 'common', 'proposal']);
  const minutes = t('minutes', { ns: 'common' });
  const governanceFormType = values.essentials.governance;

  const handleNonceChange = useCallback(
    (nonce?: string) => {
      setFieldValue('multisig.customNonce', Number(nonce));
    },
    [setFieldValue],
  );

  useEffect(() => {
    if (showCustomNonce === undefined && !governance.isAzorius && isSubDAO && safe) {
      setFieldValue('multisig.customNonce', safe.nextNonce);
      setShowCustomNonce(true);
    }
  }, [isSubDAO, type, setFieldValue, safe, governance.isAzorius, showCustomNonce]);

  const { totalParentVotingWeight, parentVotingQuorum } = useParentSafeVotingWeight();

  useEffect(() => {
    if (!parentVotingQuorum || !totalParentVotingWeight) {
      return;
    }

    let initialVotesThresholdBigIntValuePair: BigIntValuePair;

    if (governance.type === GovernanceType.AZORIUS_ERC20) {
      const actualTokenQuorum = (parentVotingQuorum * totalParentVotingWeight) / 100n;
      initialVotesThresholdBigIntValuePair = {
        bigintValue: actualTokenQuorum,
        value: actualTokenQuorum.toString(),
      };
    } else {
      initialVotesThresholdBigIntValuePair = {
        bigintValue: parentVotingQuorum,
        value: parentVotingQuorum.toString(),
      };
    }

    setFieldValue('freeze.freezeVotesThreshold', initialVotesThresholdBigIntValuePair);
  }, [governance.type, parentVotingQuorum, setFieldValue, totalParentVotingWeight]);

  useStepRedirect({ values });

  const freezeHelper = totalParentVotingWeight
    ? t('helperFreezeVotesThreshold', {
        totalVotes: formatBigIntToHumanReadableString(totalParentVotingWeight),
      })
    : null;

  return (
    <>
      <StepWrapper
        mode={mode}
        isSubDAO={isSubDAO}
        isFormSubmitting={!!isSubmitting || transactionPending}
        titleKey="titleGuardConfig"
      >
        <Flex
          flexDirection="column"
          gap={8}
        >
          {governanceFormType === GovernanceType.MULTISIG && (
            <>
              <LabelComponent
                label={t('labelTimelockPeriod')}
                helper={t('helperTimelockPeriod')}
                isRequired
              >
                <InputGroup>
                  <BigIntInput
                    value={values.freeze.timelockPeriod.bigintValue}
                    onChange={valuePair => setFieldValue('freeze.timelockPeriod', valuePair)}
                    decimalPlaces={0}
                    min="1"
                    data-testid="guardConfig-executionDetails"
                  />
                  <InputRightElement mr="4">{minutes}</InputRightElement>
                </InputGroup>
                <Text
                  textStyle="helper-text-base"
                  color="neutral-7"
                  mt="0.5rem"
                >
                  {t('exampleTimelockPeriod')}
                </Text>
              </LabelComponent>
              <LabelComponent
                label={t('labelExecutionPeriod')}
                helper={t('helperExecutionPeriod')}
                isRequired
              >
                <InputGroup>
                  <BigIntInput
                    value={values.freeze.executionPeriod.bigintValue}
                    onChange={valuePair => setFieldValue('freeze.executionPeriod', valuePair)}
                    decimalPlaces={0}
                    min="1"
                    data-testid="guardConfig-executionDetails"
                  />
                  <InputRightElement mr="4">{minutes}</InputRightElement>
                </InputGroup>
                <Text
                  textStyle="helper-text-base"
                  color="neutral-7"
                  mt="0.5rem"
                >
                  {t('exampleExecutionPeriod')}
                </Text>
              </LabelComponent>
            </>
          )}
          <ContentBoxTitle>{t('titleFreezeParams')}</ContentBoxTitle>

          <Field name="freeze.freezeVotesThreshold">
            {({ field }: FieldAttributes<FieldProps<BigIntValuePair | undefined>>) => (
              <LabelComponent
                label={t('labelFreezeVotesThreshold')}
                helper={freezeHelper || ''}
                isRequired
                errorMessage={errors?.freeze?.freezeVotesThreshold?.bigintValue}
              >
                <BigIntInput
                  isInvalid={!!errors?.freeze?.freezeVotesThreshold?.bigintValue}
                  value={field.value?.bigintValue}
                  parentFormikValue={values.freeze.freezeVotesThreshold}
                  onChange={valuePair => {
                    setFieldValue('freeze.freezeVotesThreshold', valuePair);
                  }}
                  decimalPlaces={0}
                  data-testid="guardConfig-freezeVotesThreshold"
                />
              </LabelComponent>
            )}
          </Field>

          <LabelComponent
            label={t('labelFreezeProposalPeriod')}
            helper={t('helperFreezeProposalPeriod')}
            isRequired
          >
            <InputGroup>
              <BigIntInput
                value={values.freeze.freezeProposalPeriod.bigintValue}
                onChange={valuePair => setFieldValue('freeze.freezeProposalPeriod', valuePair)}
                decimalPlaces={0}
                min="1"
                data-testid="guardConfig-freezeProposalDuration"
              />
              <InputRightElement mr="4">{minutes}</InputRightElement>
            </InputGroup>
            <Text
              textStyle="helper-text-base"
              color="neutral-7"
              mt="0.5rem"
            >
              {t('exampleFreezeProposalPeriod')}
            </Text>
          </LabelComponent>
          <LabelComponent
            label={t('labelFreezePeriod')}
            helper={t('helperFreezePeriod')}
            isRequired
          >
            <InputGroup>
              <BigIntInput
                value={values.freeze.freezePeriod.bigintValue}
                onChange={valuePair => setFieldValue('freeze.freezePeriod', valuePair)}
                decimalPlaces={0}
                min="1"
                data-testid="guardConfig-freezeDuration"
              />

              <InputRightElement mr="4">{minutes}</InputRightElement>
            </InputGroup>
            <Text
              textStyle="helper-text-base"
              color="neutral-7"
              mt="0.5rem"
            >
              {t('exampleFreezePeriod')}
            </Text>
          </LabelComponent>
          <Alert
            status="info"
            gap={4}
          >
            <Box
              width="1.5rem"
              height="1.5rem"
            >
              <Info size="24" />
            </Box>
            <Text
              textStyle="body-base-strong"
              whiteSpace="pre-wrap"
            >
              {t('freezeGuardDescription')}
            </Text>
          </Alert>
        </Flex>
      </StepWrapper>
      <Box
        padding="1.5rem"
        bg="neutral-2"
        borderRadius="0.25rem"
        mt="1.5rem"
        mb={showCustomNonce ? '1.5rem' : 0}
      >
        <FormControl
          gap="0.5rem"
          width="100%"
          justifyContent="space-between"
          display="flex"
        >
          <Text>{t('attachFractalModuleLabel')}</Text>
          <Switch
            size="md"
            variant="secondary"
            onChange={() =>
              setFieldValue('freeze.attachFractalModule', !values.freeze.attachFractalModule)
            }
            isChecked={values.freeze.attachFractalModule}
          />
        </FormControl>
        <Text
          color="neutral-7"
          width="50%"
        >
          {t('attachFractalModuleDescription')}
        </Text>
      </Box>
      {showCustomNonce && (
        <Box
          padding="1.5rem"
          bg="neutral-2"
          borderRadius="0.25rem"
          my="1.5rem"
        >
          <CustomNonceInput
            nonce={values.multisig.customNonce}
            onChange={handleNonceChange}
            renderTrimmed={false}
          />
        </Box>
      )}
      <StepButtons {...props} />
    </>
  );
}

export default GuardDetails;
