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
import { isFeatureEnabled } from '../../../helpers/featureFlags';
import { useDaoInfoStore } from '../../../store/daoInfo/useDaoInfoStore';
import { FractalModuleType, ICreationStepProps, VotingStrategyType } from '../../../types';
import { GaslessVotingToggleDAOCreate } from '../../GaslessVoting/GaslessVotingToggle';
import { BigIntInput } from '../../ui/forms/BigIntInput';
import { CustomNonceInput } from '../../ui/forms/CustomNonceInput';
import { LabelComponent } from '../../ui/forms/InputComponent';
import { NumberStepperInput } from '../../ui/forms/NumberStepperInput';
import { StepButtons } from '../StepButtons';
import { StepWrapper } from '../StepWrapper';
import useStepRedirect from '../hooks/useStepRedirect';
import { DAOCreateMode } from './EstablishEssentials';

function DayStepperInput({
  inputValue,
  onInputChange,
}: {
  inputValue: number;
  onInputChange: (val: number) => void;
}) {
  const { t } = useTranslation('common');

  return (
    <InputGroup>
      <Flex
        flexDirection="column"
        gap="0.5rem"
        w="250px"
      >
        <NumberStepperInput
          unitHint={t('days', { ns: 'common' })}
          value={inputValue}
          onChange={val => onInputChange(Number(val))}
        />
      </Flex>
    </InputGroup>
  );
}

export function AzoriusGovernance(props: ICreationStepProps) {
  const { values, setFieldValue, isSubmitting, transactionPending, isSubDAO, mode } = props;

  const { safe, subgraphInfo, modules } = useDaoInfoStore();

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

  const isDevMode = isFeatureEnabled('flag_dev');
  const [votingPeriodDays, setVotingPeriodDays] = useState(isDevMode ? 0.0021 : 7);
  const [timelockPeriodDays, setTimelockPeriodDays] = useState(isDevMode ? 0 : 1);
  const [executionPeriodDays, setExecutionPeriodDays] = useState(2);

  useEffect(() => {
    // convert days to minutes
    const minutes = votingPeriodDays * 24 * 60;
    setFieldValue('azorius.votingPeriod', { bigintValue: minutes, value: minutes.toString() });
  }, [setFieldValue, votingPeriodDays]);

  // same for timelock and execution period
  useEffect(() => {
    const minutes = timelockPeriodDays * 24 * 60;
    setFieldValue('azorius.timelock', { bigintValue: minutes, value: minutes.toString() });
  }, [setFieldValue, timelockPeriodDays]);

  useEffect(() => {
    const minutes = executionPeriodDays * 24 * 60;
    setFieldValue('azorius.executionPeriod', { bigintValue: minutes, value: minutes.toString() });
  }, [setFieldValue, executionPeriodDays]);

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
              />
            </LabelComponent>
          )}

          {/* VOTING PERIOD */}
          <LabelComponent
            label={t('labelVotingPeriod')}
            helper={t('helperVotingPeriod')}
            isRequired
          >
            <DayStepperInput
              inputValue={votingPeriodDays}
              onInputChange={setVotingPeriodDays}
            />
          </LabelComponent>

          {/* TIMELOCK PERIOD */}
          <LabelComponent
            label={t('labelTimelockPeriod')}
            helper={t('helperTimelockPeriod')}
            isRequired
          >
            <DayStepperInput
              inputValue={timelockPeriodDays}
              onInputChange={setTimelockPeriodDays}
            />
          </LabelComponent>

          {/* EXECUTION PERIOD */}
          <LabelComponent
            label={t('labelExecutionPeriod')}
            helper={t('helperExecutionPeriod')}
            isRequired
          >
            <DayStepperInput
              inputValue={executionPeriodDays}
              onInputChange={setExecutionPeriodDays}
            />
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
            color="neutral-7"
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
      <GaslessVotingToggleDAOCreate
        isEnabled={values.essentials.gaslessVoting}
        onToggle={() => setFieldValue('essentials.gaslessVoting', !values.essentials.gaslessVoting)}
      />
      <StepButtons
        {...props}
        isEdit={mode === DAOCreateMode.EDIT}
      />
    </>
  );
}
