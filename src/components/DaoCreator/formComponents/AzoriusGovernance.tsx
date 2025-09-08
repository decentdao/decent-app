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
import { WarningCircle } from '@phosphor-icons/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCurrentDAOKey } from '../../../hooks/DAO/useCurrentDAOKey';
import { useDAOStore } from '../../../providers/App/AppProvider';
import {
  BigIntValuePair,
  FractalModuleType,
  ICreationStepProps,
  VotingStrategyType,
} from '../../../types';
import { BigIntInput } from '../../ui/forms/BigIntInput';
import { CustomNonceInput } from '../../ui/forms/CustomNonceInput';
import DurationUnitStepperInput from '../../ui/forms/DurationUnitStepperInput';
import { LabelComponent } from '../../ui/forms/InputComponent';
import { StepButtons } from '../StepButtons';
import { StepWrapper } from '../StepWrapper';
import useStepRedirect from '../hooks/useStepRedirect';
import { DAOCreateMode } from './EstablishEssentials';

function renderUnitInputWith(
  formName: string,
  formValue: BigIntValuePair,
  setFieldValue: (name: string, value: any) => void,
) {
  return (
    <Flex
      flexDirection="column"
      gap="0.5rem"
      w="300px"
    >
      <DurationUnitStepperInput
        secondsValue={Number(formValue?.bigintValue ?? 0n) * 60}
        onSecondsValueChange={sec => {
          const min = sec ? sec / 60 : 0;
          const newMinutesPair: BigIntValuePair = {
            bigintValue: BigInt(min),
            value: min.toString(),
          };
          setFieldValue(formName, newMinutesPair);
        }}
      />
    </Flex>
  );
}

export function AzoriusGovernance(props: ICreationStepProps) {
  const { values, setFieldValue, isSubmitting, transactionPending, isSubDAO, mode } = props;

  const { daoKey } = useCurrentDAOKey();
  const {
    node: { safe, subgraphInfo, modules },
  } = useDAOStore({ daoKey });

  const fractalModule = useMemo(() => {
    if (!modules) return null;
    return modules.find(_module => _module.moduleType === FractalModuleType.FRACTAL);
  }, [modules]);

  const [showCustomNonce, setShowCustomNonce] = useState<boolean>();
  const { t } = useTranslation(['daoCreate', 'common']);

  const handleNonceChange = useCallback(
    (nonce?: string) => {
      setFieldValue('multisig.customNonce', Number(nonce));
    },
    [setFieldValue],
  );

  useEffect(() => {
    if (showCustomNonce === undefined && safe && mode === DAOCreateMode.EDIT) {
      setFieldValue('multisig.customNonce', safe.nextNonce);
      setShowCustomNonce(true);
    }
  }, [setFieldValue, safe, showCustomNonce, mode]);

  useStepRedirect({ values });

  return (
    <>
      <StepWrapper
        mode={mode}
        isSubDAO={isSubDAO}
        isFormSubmitting={!!isSubmitting || transactionPending}
        allSteps={props.steps}
        stepNumber={3}
      >
        <Flex
          flexDirection="column"
          gap={8}
        >
          {/* QUORUM */}
          {values.azorius.votingStrategyType === VotingStrategyType.LINEAR_ERC20 ? (
            <LabelComponent
              label={t('quorum', { ns: 'common' })}
              helper={t('helperQuorumERC20')}
              isRequired
            >
              <InputGroup>
                <BigIntInput
                  value={values.azorius.quorumPercentage.bigintValue}
                  onChange={valuePair => setFieldValue('azorius.quorumPercentage', valuePair)}
                  max="100"
                  decimalPlaces={0}
                  data-testid="govConfig-quorumPercentage"
                  parentFormikValue={values.azorius.quorumPercentage}
                />
                <InputRightElement>%</InputRightElement>
              </InputGroup>
            </LabelComponent>
          ) : (
            <LabelComponent
              label={t('quorum', { ns: 'common' })}
              helper={t('helperQuorumERC721')}
              isRequired
            >
              <BigIntInput
                value={values.erc721Token.quorumThreshold.bigintValue}
                onChange={valuePair => setFieldValue('erc721Token.quorumThreshold', valuePair)}
                decimalPlaces={0}
                min="1"
                data-testid="govConfig-quorumThreshold"
                parentFormikValue={values.erc721Token.quorumThreshold}
              />
            </LabelComponent>
          )}

          {/* PROPOSAL PERMISSION */}
          {values.azorius.votingStrategyType === VotingStrategyType.LINEAR_ERC20 ? (
            <LabelComponent
              label={t('proposalPermission', { ns: 'common' })}
              helper={t('helperProposalPermission')}
              isRequired
            >
              <BigIntInput
                value={values.erc20Token.requiredProposerWeight.bigintValue}
                onChange={valuePair =>
                  setFieldValue('erc20Token.requiredProposerWeight', valuePair)
                }
                decimalPlaces={18}
                data-testid="govConfig-proposalPermission"
                parentFormikValue={values.erc20Token.requiredProposerWeight}
              />
            </LabelComponent>
          ) : (
            <LabelComponent
              label={t('proposalPermission', { ns: 'common' })}
              helper={t('helperProposalPermission')}
              isRequired
            >
              <BigIntInput
                value={values.erc721Token.proposerThreshold.bigintValue}
                onChange={valuePair => setFieldValue('erc721Token.proposerThreshold', valuePair)}
                decimalPlaces={0}
                data-testid="govConfig-proposalPermission"
                parentFormikValue={values.erc721Token.proposerThreshold}
              />
            </LabelComponent>
          )}

          {/* VOTING PERIOD */}
          <LabelComponent
            label={t('labelVotingPeriod')}
            helper={t('helperVotingPeriod')}
            isRequired
          >
            {renderUnitInputWith(
              'azorius.votingPeriod',
              values.azorius.votingPeriod,
              setFieldValue,
            )}
          </LabelComponent>

          {/* TIMELOCK PERIOD */}
          <LabelComponent
            label={t('labelTimelockPeriod')}
            helper={t('helperTimelockPeriod')}
            isRequired
          >
            {renderUnitInputWith('azorius.timelock', values.azorius.timelock, setFieldValue)}
          </LabelComponent>

          {/* EXECUTION PERIOD */}
          <LabelComponent
            label={t('labelExecutionPeriod')}
            helper={t('helperExecutionPeriod')}
            isRequired
          >
            {renderUnitInputWith(
              'azorius.executionPeriod',
              values.azorius.executionPeriod,
              setFieldValue,
            )}
          </LabelComponent>

          <Alert
            status="info"
            gap={4}
          >
            <Box
              width="1.5rem"
              height="1.5rem"
            >
              <WarningCircle size="24" />
            </Box>
            <Text
              whiteSpace="pre-wrap"
              ml="1rem"
            >
              {t('governanceDescription')}
            </Text>
          </Alert>
        </Flex>
      </StepWrapper>
      {!!subgraphInfo?.parentAddress && (
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
            isDisabled={!!fractalModule}
          >
            <Text>{t('attachFractalModuleLabel')}</Text>
            <Switch
              size="md"
              variant="secondary"
              onChange={() =>
                setFieldValue('freeze.attachFractalModule', !values.freeze.attachFractalModule)
              }
              isChecked={!!fractalModule || values.freeze.attachFractalModule}
              isDisabled={!!fractalModule}
            />
          </FormControl>
          <Text
            color="color-neutral-300"
            width="50%"
          >
            {t(
              fractalModule ? 'fractalModuleAttachedDescription' : 'attachFractalModuleDescription',
            )}
          </Text>
        </Box>
      )}
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
      <StepButtons
        {...props}
        isEdit={mode === DAOCreateMode.EDIT}
      />
    </>
  );
}
