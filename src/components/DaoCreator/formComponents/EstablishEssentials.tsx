import { Box, Flex, Icon, Image, Input, RadioGroup } from '@chakra-ui/react';
import { CheckCircle } from '@phosphor-icons/react';
import debounce from 'lodash.debounce';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { createAccountSubstring } from '../../../hooks/utils/useGetAccountName';
import {
  supportedNetworks,
  useNetworkConfigStore,
} from '../../../providers/NetworkConfig/useNetworkConfigStore';
import { useDaoInfoStore } from '../../../store/daoInfo/useDaoInfoStore';
import { GovernanceType, ICreationStepProps, VotingStrategyType } from '../../../types';
import { getNetworkIcon } from '../../../utils/url';
import { InputComponent, LabelComponent } from '../../ui/forms/InputComponent';
import LabelWrapper from '../../ui/forms/LabelWrapper';
import { RadioWithText } from '../../ui/forms/Radio/RadioWithText';
import { DropdownMenu } from '../../ui/menus/DropdownMenu';
import { StepButtons } from '../StepButtons';
import { StepWrapper } from '../StepWrapper';

export enum DAOCreateMode {
  ROOTDAO,
  SUBDAO,
  EDIT,
}

export function EstablishEssentials(props: ICreationStepProps) {
  const { t } = useTranslation(['daoCreate', 'common']);
  const { values, setFieldValue, isSubmitting, transactionPending, isSubDAO, errors, mode } = props;

  const { subgraphInfo, safe } = useDaoInfoStore();

  const isEdit = mode === DAOCreateMode.EDIT;

  const safeAddress = safe?.address;

  useEffect(() => {
    if (isEdit && subgraphInfo) {
      setFieldValue('essentials.daoName', subgraphInfo.daoName, false);
      if (safeAddress && createAccountSubstring(safeAddress) !== subgraphInfo.daoName) {
        // Pre-fill the snapshot URL form field when editing
        setFieldValue('essentials.snapshotENS', subgraphInfo.daoSnapshotENS || '', false);
      }
    }
  }, [
    setFieldValue,
    mode,
    subgraphInfo?.daoName,
    subgraphInfo?.daoSnapshotENS,
    isEdit,
    safeAddress,
    subgraphInfo,
  ]);

  const daoNameDisabled =
    isEdit &&
    !!subgraphInfo?.daoName &&
    !!safeAddress &&
    createAccountSubstring(safeAddress) !== subgraphInfo?.daoName;

  const isNetworkSelectorDisabled = !!isEdit || !!safeAddress;

  // If in governance edit mode and snapshot URL is already set, disable the field
  const snapshotENSDisabled = isEdit && !!subgraphInfo?.daoSnapshotENS;

  const handleGovernanceChange = (value: GovernanceType) => {
    if (value === GovernanceType.AZORIUS_ERC20) {
      setFieldValue('azorius.votingStrategyType', VotingStrategyType.LINEAR_ERC20);
    } else if (value === GovernanceType.AZORIUS_ERC721) {
      setFieldValue('azorius.votingStrategyType', VotingStrategyType.LINEAR_ERC721);
    }

    setFieldValue('essentials.governance', value);
  };

  const { createOptions, setCurrentConfig, chain, getConfigByChainId } = useNetworkConfigStore();

  const [snapshotENSInput, setSnapshotENSInput] = useState('');

  const debounceENSInput = useMemo(
    () =>
      debounce((input: string) => {
        setFieldValue('essentials.snapshotENS', input, true);
      }, 500),
    [setFieldValue],
  );

  useEffect(() => {
    debounceENSInput(snapshotENSInput);
  }, [debounceENSInput, snapshotENSInput]);

  const dropdownItems = supportedNetworks.map(network => ({
    value: network.chain.id.toString(),
    label: network.chain.name,
    icon: getNetworkIcon(network.addressPrefix),
    selected: chain.id === network.chain.id,
  }));

  return (
    <>
      <StepWrapper
        mode={mode}
        isSubDAO={isSubDAO}
        isFormSubmitting={!!isSubmitting || transactionPending}
        allSteps={props.steps}
        stepNumber={1}
      >
        <InputComponent
          label={t('labelDAOName')}
          helper={t('helperDAOName')}
          isRequired
          value={values.essentials.daoName}
          id="essentials-daoName"
          onChange={cEvent => setFieldValue('essentials.daoName', cEvent.target.value, true)}
          onBlur={cEvent => setFieldValue('essentials.daoName', cEvent.target.value.trim(), true)}
          disabled={daoNameDisabled}
          placeholder={t('daoNamePlaceholder')}
          testId="essentials-daoName"
        />
        <Box
          mt="2rem"
          mb="1.5rem"
        >
          <LabelComponent
            label={t('networks')}
            helper={t('networkDescription')}
            isRequired
            alignLabel="flex-start"
          >
            <DropdownMenu
              items={dropdownItems}
              selectedItem={dropdownItems.find(item => item.selected)}
              onSelect={item => {
                setCurrentConfig(getConfigByChainId(Number(item.value)));
              }}
              title={t('networks')}
              isDisabled={isNetworkSelectorDisabled}
              renderItem={(item, isSelected) => {
                return (
                  <>
                    <Flex
                      alignItems="center"
                      gap="1rem"
                    >
                      <Image
                        src={item.icon}
                        fallbackSrc="/images/coin-icon-default.svg"
                        boxSize="2rem"
                      />
                      {item.label}
                    </Flex>
                    {isSelected && (
                      <Icon
                        as={CheckCircle}
                        boxSize="1.5rem"
                        color="lilac-0"
                      />
                    )}
                  </>
                );
              }}
            />
          </LabelComponent>
        </Box>
        <Box
          mt="2rem"
          mb="1.5rem"
        >
          <LabelComponent
            label={t('labelChooseGovernance')}
            helper={t('helperChooseGovernance')}
            isRequired
          >
            <RadioGroup
              display="flex"
              flexDirection="column"
              name="governance"
              gap={4}
              mt="-0.5rem" // RadioGroup renders empty paragraph with margin, seems like this is only feasible way to align this group
              id="governance"
              value={values.essentials.governance}
              onChange={handleGovernanceChange}
            >
              {createOptions.includes(GovernanceType.AZORIUS_ERC20) && (
                <RadioWithText
                  label={t('labelAzoriusErc20Gov')}
                  description={t('descAzoriusErc20Gov')}
                  testId="choose-azorius"
                  value={GovernanceType.AZORIUS_ERC20}
                />
              )}
              {createOptions.includes(GovernanceType.AZORIUS_ERC721) && (
                <RadioWithText
                  label={t('labelAzoriusErc721Gov')}
                  description={t('descAzoriusErc721Gov')}
                  testId="choose-azorius-erc721"
                  value={GovernanceType.AZORIUS_ERC721}
                />
              )}
              {createOptions.includes(GovernanceType.MULTISIG) && (
                <RadioWithText
                  label={t('labelMultisigGov')}
                  description={t('descMultisigGov')}
                  testId="choose-multisig"
                  value={GovernanceType.MULTISIG}
                />
              )}
            </RadioGroup>
          </LabelComponent>
        </Box>
        <LabelComponent
          label={t('snapshot')}
          helper={t('snapshotHelper')}
          isRequired={false}
        >
          <LabelWrapper errorMessage={errors?.essentials?.snapshotENS}>
            <Input
              value={snapshotENSInput}
              onChange={cEvent => setSnapshotENSInput(cEvent.target.value.toLowerCase())}
              isDisabled={snapshotENSDisabled}
              data-testid="essentials-snapshotENS"
              placeholder="example.eth"
              isInvalid={!!errors?.essentials?.snapshotENS}
            />
          </LabelWrapper>
        </LabelComponent>
      </StepWrapper>
      <StepButtons
        {...props}
        isNextDisabled={
          (!!errors.essentials && Object.keys(errors.essentials).length > 0) ||
          (isEdit && values.essentials.governance === GovernanceType.MULTISIG)
        }
        isEdit={isEdit}
      />
    </>
  );
}
