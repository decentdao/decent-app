import { Flex, Text } from '@chakra-ui/react';
import { Info } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { useDurationDisplay } from '../../helpers/dateTime';
import { useCurrentDAOKey } from '../../hooks/DAO/useCurrentDAOKey';
import { useDAOStore } from '../../providers/App/AppProvider';

export function StakingAdditionalInfo() {
  const { t } = useTranslation('staking');
  const { daoKey } = useCurrentDAOKey();
  const {
    governance: { stakedToken },
  } = useDAOStore({ daoKey });

  const lockPeriod = useDurationDisplay(stakedToken?.minimumStakingPeriod);

  return (
    <Flex
      direction="column"
      alignItems="flex-start"
      gap={2}
      alignSelf="stretch"
    >
      <Flex
        direction="column"
        alignItems="flex-start"
        gap="8px"
        alignSelf="stretch"
      >
        <Flex
          justifyContent="space-between"
          alignItems="flex-start"
          alignSelf="stretch"
        >
          <Text
            color="color-content-content1-foreground"
            textStyle="text-sm-regular"
          >
            {t('lockPeriod')}
          </Text>
          <Text
            color="color-content-content4-foreground"
            textStyle="text-sm-regular"
          >
            {lockPeriod}
          </Text>
        </Flex>
      </Flex>
      <Flex
        padding="12px"
        alignItems="flex-start"
        gap="16px"
        alignSelf="stretch"
        borderRadius="12px"
        border="1px solid var(--colors-color-layout-border)"
        background="color-information-950"
      >
        <Flex
          alignItems="flex-start"
          gap="16px"
          flex="1 0 0"
          color="color-base-information-foreground"
        >
          <Info
            width="24px"
            height="24px"
            format="outline"
            weight="fill"
            color="var(--colors-color-base-information-foreground)"
          />

          <Flex
            direction="column"
            alignItems="flex-start"
            flex="1 0 0"
          >
            <Text
              color="color-base-information-foreground"
              textStyle="text-sm-medium"
            >
              {t('stakingInformationTitle')}
            </Text>
            <Text
              color="color-base-information-foreground"
              textStyle="text-sm-regular"
              whiteSpace="pre-wrap"
            >
              {t('stakingInformationDescription')}
            </Text>
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  );
}
