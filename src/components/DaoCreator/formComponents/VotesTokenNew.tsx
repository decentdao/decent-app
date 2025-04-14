import { Box, Flex, Input, RadioGroup } from '@chakra-ui/react';
import { Field, FieldAttributes } from 'formik';
import { useTranslation } from 'react-i18next';
import useFeatureFlag from '../../../helpers/environmentFeatureFlags';
import { useFormHelpers } from '../../../hooks/utils/useFormHelpers';
import { useNetworkConfigStore } from '../../../providers/NetworkConfig/useNetworkConfigStore';
import { ICreationStepProps, TokenLockType } from '../../../types';
import ContentBoxTitle from '../../ui/containers/ContentBox/ContentBoxTitle';
import { BigIntInput } from '../../ui/forms/BigIntInput';
import { LabelComponent } from '../../ui/forms/InputComponent';
import { RadioWithText } from '../../ui/forms/Radio/RadioWithText';

export function VotesTokenNew(props: ICreationStepProps) {
  const { values, handleChange, setFieldValue } = props;
  const { t } = useTranslation('daoCreate');
  const { restrictChars } = useFormHelpers();
  const lockedTokenFeatureEnabled = useFeatureFlag('flag_locked_token');
  const {
    contracts: { votesErc20LockableMasterCopy },
  } = useNetworkConfigStore();

  return (
    <Flex
      flexDirection="column"
      gap={8}
    >
      <ContentBoxTitle>{t('titleTokenParams')}</ContentBoxTitle>
      <LabelComponent
        label={t('labelTokenName')}
        helper={t('helperTokenName')}
        isRequired
      >
        <Field name="erc20Token.tokenName">
          {({ field }: FieldAttributes<any>) => (
            <Input
              {...field}
              data-testid="tokenVoting-tokenNameInput"
              minWidth="50%"
              placeholder="Name"
            />
          )}
        </Field>
      </LabelComponent>
      <LabelComponent
        label={t('labelTokenSymbol')}
        helper={t('helperTokenSymbol')}
        isRequired
      >
        <Input
          name="erc20Token.tokenSymbol"
          value={values.erc20Token.tokenSymbol}
          onChange={handleChange}
          maxLength={6}
          data-testid="tokenVoting-tokenSymbolInput"
          placeholder="TKN"
        />
      </LabelComponent>
      {lockedTokenFeatureEnabled && votesErc20LockableMasterCopy && (
        <Box
          mt="2rem"
          mb="1.5rem"
        >
          <LabelComponent
            label={t('labelTokenLocking')}
            helper={t('helperTokenLocking')}
            isRequired
          >
            <RadioGroup
              display="flex"
              flexDirection="column"
              name="locking"
              gap={4}
              mt="-0.5rem" // RadioGroup renders empty paragraph with margin, seems like this is only feasible way to align this group
              id="locking"
              value={values.erc20Token.locked}
              onChange={value => {
                setFieldValue('erc20Token.locked', value);
              }}
            >
              <RadioWithText
                label={t('labelTokenUnlocked')}
                description={t('descTokenUnlocked')}
                testId="choose-azorius"
                value={TokenLockType.UNLOCKED}
              />
              <RadioWithText
                label={t('labelTokenLocked')}
                description={t('descTokenLocked')}
                testId="choose-azorius-erc721"
                value={TokenLockType.LOCKED}
              />
            </RadioGroup>
          </LabelComponent>
        </Box>
      )}
      <LabelComponent
        label={t('labelTokenSupply')}
        helper={t('helperTokenSupply')}
        isRequired
      >
        <BigIntInput
          value={values.erc20Token.tokenSupply.bigintValue}
          onChange={valuePair => setFieldValue('erc20Token.tokenSupply', valuePair)}
          data-testid="tokenVoting-tokenSupplyInput"
          onKeyDown={restrictChars}
          placeholder="100,000,000"
        />
      </LabelComponent>
    </Flex>
  );
}
