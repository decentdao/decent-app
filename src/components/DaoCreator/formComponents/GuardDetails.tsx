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
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCurrentDAOKey } from '../../../hooks/DAO/useCurrentDAOKey';
import { useDAOStore } from '../../../providers/App/AppProvider';
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
  const { daoKey } = useCurrentDAOKey();
  const {
    governance,
    node: { safe },
  } = useDAOStore({ daoKey });
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
        allSteps={props.steps}
        stepNumber={governanceFormType === GovernanceType.MULTISIG ? 3 : 4}
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
                    value={values.freeze.timelockPeriod}
                    onChange={(valuePair: BigIntValuePair) =>
                      setFieldValue('freeze.timelockPeriod', valuePair)
                    }
                    decimals={0}
                    min={0n}
                    data-testid="guardConfig-executionDetails"
                  />
                  <InputRightElement mr="4">{minutes}</InputRightElement>
                </InputGroup>
              </LabelComponent>
              <LabelComponent
                label={t('labelExecutionPeriod')}
                helper={t('helperExecutionPeriod')}
                isRequired
              >
                <InputGroup>
                  <BigIntInput
                    value={values.freeze.executionPeriod}
                    onChange={(valuePair: BigIntValuePair) =>
                      setFieldValue('freeze.executionPeriod', valuePair)
                    }
                    decimals={0}
                    min={1n}
                    data-testid="guardConfig-executionDetails"
                  />
                  <InputRightElement mr="4">{minutes}</InputRightElement>
                </InputGroup>
              </LabelComponent>
            </>
          )}
          <ContentBoxTitle>{t('titleFreezeParams')}</ContentBoxTitle>

          <LabelComponent
            label={t('labelFreezeVotesThreshold')}
            helper={freezeHelper || ''}
            isRequired
            errorMessage={errors?.freeze?.freezeVotesThreshold?.bigintValue}
          >
            <BigIntInput
              isInvalid={!!errors?.freeze?.freezeVotesThreshold?.bigintValue}
              value={values.freeze.freezeVotesThreshold}
              onChange={(valuePair: BigIntValuePair) => {
                setFieldValue('freeze.freezeVotesThreshold', valuePair);
              }}
              decimals={0}
              data-testid="guardConfig-freezeVotesThreshold"
            />
          </LabelComponent>

          <LabelComponent
            label={t('labelFreezeProposalPeriod')}
            helper={t('helperFreezeProposalPeriod')}
            isRequired
          >
            <InputGroup>
              <BigIntInput
                value={values.freeze.freezeProposalPeriod}
                onChange={(valuePair: BigIntValuePair) =>
                  setFieldValue('freeze.freezeProposalPeriod', valuePair)
                }
                decimals={0}
                min={1n}
                data-testid="guardConfig-freezeProposalDuration"
              />
              <InputRightElement mr="4">{minutes}</InputRightElement>
            </InputGroup>
            <Text
              textStyle="text-sm-medium"
              color="color-neutral-300"
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
                value={values.freeze.freezePeriod}
                onChange={(valuePair: BigIntValuePair) =>
                  setFieldValue('freeze.freezePeriod', valuePair)
                }
                decimals={0}
                min={1n}
                data-testid="guardConfig-freezeDuration"
              />

              <InputRightElement mr="4">{minutes}</InputRightElement>
            </InputGroup>
            <Text
              textStyle="text-sm-medium"
              color="color-neutral-300"
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
            <Text whiteSpace="pre-wrap">{t('freezeGuardDescription')}</Text>
          </Alert>
        </Flex>
      </StepWrapper>
      <Box
        padding="1.5rem"
        bg="color-neutral-950"
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
          color="color-neutral-300"
          width="50%"
        >
          {t('attachFractalModuleDescription')}
        </Text>
      </Box>
      {showCustomNonce && (
        <Box
          padding="1.5rem"
          bg="color-neutral-950"
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
