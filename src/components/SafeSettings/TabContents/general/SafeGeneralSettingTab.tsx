import { Box, Flex, Text } from '@chakra-ui/react';
import { useFormikContext } from 'formik';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCurrentDAOKey } from '../../../../hooks/DAO/useCurrentDAOKey';
import { createAccountSubstring } from '../../../../hooks/utils/useGetAccountName';
import { useDAOStore } from '../../../../providers/App/AppProvider';
import { useNetworkConfigStore } from '../../../../providers/NetworkConfig/useNetworkConfigStore';
import { GovernanceType } from '../../../../types';
import { GaslessVotingToggleDAOSettings } from '../../../GaslessVoting/GaslessVotingToggle';
import { InputComponent } from '../../../ui/forms/InputComponent';
import { BarLoader } from '../../../ui/loaders/BarLoader';
import { SafeSettingsEdits, SafeSettingsFormikErrors } from '../../../ui/modals/SafeSettingsModal';
import Divider from '../../../ui/utils/Divider';
import { SettingsContentBox } from '../../SettingsContentBox';

export function SafeGeneralSettingTab() {
  const { t } = useTranslation('settings');
  const {
    setFieldValue,
    values: formValues,
    errors,
    status: { readOnly } = {},
  } = useFormikContext<SafeSettingsEdits>();
  const generalEditFormikErrors = (errors as SafeSettingsFormikErrors | undefined)?.general;

  const [existingDaoName, setExistingDaoName] = useState('');
  const [existingSnapshotENS, setExistingSnapshotENS] = useState('');

  const { daoKey } = useCurrentDAOKey();
  const {
    governance: { type: votingStrategyType, gaslessVotingEnabled },
    node: { subgraphInfo, safe },
  } = useDAOStore({ daoKey });

  const [existingIsGaslessVotingEnabledToggled, setExistingIsGaslessVotingEnabledToggled] =
    useState(gaslessVotingEnabled);

  useEffect(() => {
    setExistingIsGaslessVotingEnabledToggled(gaslessVotingEnabled);
  }, [gaslessVotingEnabled]);

  const { bundlerMinimumStake } = useNetworkConfigStore();
  const accountAbstractionSupported = bundlerMinimumStake !== undefined;

  const isMultisigGovernance = votingStrategyType === GovernanceType.MULTISIG;
  const gaslessVotingSupported = !isMultisigGovernance && accountAbstractionSupported;

  const safeAddress = safe?.address;

  useEffect(() => {
    if (
      subgraphInfo?.daoName &&
      safeAddress &&
      createAccountSubstring(safeAddress) !== subgraphInfo?.daoName
    ) {
      setExistingDaoName(subgraphInfo.daoName);
    }

    if (subgraphInfo?.daoSnapshotENS) {
      setExistingSnapshotENS(subgraphInfo?.daoSnapshotENS);
    }
  }, [subgraphInfo?.daoName, subgraphInfo?.daoSnapshotENS, safeAddress]);

  useEffect(() => {
    if (
      formValues.general?.name === undefined &&
      formValues.general?.snapshot === undefined &&
      formValues.general?.sponsoredVoting === undefined
    ) {
      setFieldValue('general', undefined);
    }
  }, [setFieldValue, formValues.general]);

  return (
    <>
      {!!safe ? (
        <SettingsContentBox
          px={12}
          py={6}
        >
          <Flex
            flexDir="column"
            justifyContent="space-between"
          >
            {/* GENERAL */}
            <Text
              mb={0.5}
              textStyle="text-lg-regular"
              color="color-white"
            >
              {t('daoSettingsGeneral')}
            </Text>
            <Flex
              flexDirection="column"
              w="100%"
              border="1px solid"
              borderColor="color-neutral-900"
              borderRadius="0.75rem"
            >
              <Flex
                flexDirection="row"
                alignItems="center"
                justifyContent="space-between"
                px={6}
                pt={2}
              >
                <Text
                  mb={2}
                  textStyle="text-base-regular"
                >
                  {t('daoMetadataName')}
                </Text>
                <InputComponent
                  isRequired={false}
                  onChange={e => {
                    const newValue =
                      e.target.value === existingDaoName ? undefined : e.target.value.trim();
                    setFieldValue('general.name', newValue);
                  }}
                  value={formValues.general?.name ?? existingDaoName}
                  disabled={readOnly}
                  placeholder={formValues.general?.name === undefined ? 'Amazing DAO' : ''}
                  testId="daoSettings.name"
                  isInvalid={!!generalEditFormikErrors?.name}
                  inputContainerProps={{
                    width: { base: '100%', md: '16rem' },
                  }}
                />
              </Flex>
              <Divider />
              <Flex
                flexDirection="row"
                alignItems="center"
                justifyContent="space-between"
                px={6}
                pt={2}
              >
                <Text textStyle="text-base-regular">
                  {subgraphInfo?.daoSnapshotENS
                    ? t('daoMetadataSnapshot')
                    : t('daoMetadataConnectSnapshot')}
                </Text>
                <InputComponent
                  isRequired={false}
                  onChange={e => {
                    const lowerCasedValue = e.target.value.toLowerCase().trim();
                    const newValue =
                      lowerCasedValue === existingSnapshotENS ? undefined : lowerCasedValue;

                    setFieldValue('general.snapshot', newValue);
                  }}
                  isInvalid={!!generalEditFormikErrors?.snapshot}
                  value={
                    formValues.general?.snapshot === undefined
                      ? existingSnapshotENS
                      : formValues.general?.snapshot
                  }
                  disabled={readOnly}
                  placeholder="example.eth"
                  testId="daoSettings.snapshotENS"
                  inputContainerProps={{
                    width: { base: '100%', md: '16rem' },
                  }}
                />
              </Flex>
            </Flex>

            <Box h={12} />

            {/* SPONSORED VOTING */}
            {gaslessVotingSupported && (
              <>
                <Text
                  mb={0.5}
                  textStyle="text-lg-regular"
                  color="color-white"
                >
                  {t('gaslessVotingLabelSettings', { ns: 'gaslessVoting' })}
                </Text>
                <GaslessVotingToggleDAOSettings
                  isEnabled={
                    formValues.general?.sponsoredVoting !== undefined
                      ? formValues.general?.sponsoredVoting
                      : existingIsGaslessVotingEnabledToggled
                  }
                  onToggle={() => {
                    let newValue;

                    if (formValues.general?.sponsoredVoting === undefined) {
                      // If no value is set yet, toggle from existing state
                      newValue = !existingIsGaslessVotingEnabledToggled;
                    } else if (
                      formValues.general?.sponsoredVoting === existingIsGaslessVotingEnabledToggled
                    ) {
                      // If current form value matches existing state, which means resulting toggle results in a new value that is different from existing state, toggle current value
                      newValue = !formValues.general?.sponsoredVoting;
                    } else {
                      // Resulting value will match existing state. No changes made -- reset to undefined
                      newValue = undefined;
                    }

                    setFieldValue('general.sponsoredVoting', newValue);
                  }}
                />
              </>
            )}
          </Flex>
        </SettingsContentBox>
      ) : (
        <Flex
          h="8.5rem"
          width="100%"
          alignItems="center"
          justifyContent="center"
        >
          <BarLoader />
        </Flex>
      )}
    </>
  );
}
