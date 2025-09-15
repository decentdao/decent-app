import { Flex, Text } from '@chakra-ui/react';
import { Info } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { useDurationDisplay } from '../../helpers/dateTime';
import { useCurrentDAOKey } from '../../hooks/DAO/useCurrentDAOKey';
import { useDAOStore } from '../../providers/App/AppProvider';

function AdditionalInfoBanner({
  isWarning,
  description,
}: {
  isWarning?: boolean;
  description: string;
}) {
  const cardBackgroundColor = isWarning ? 'color-warning-950' : 'color-information-950';
  const iconAndTextColor = isWarning ? 'color-base-warning' : 'color-base-information-foreground';
  return (
    <Flex
      padding="12px"
      alignItems="flex-start"
      gap="16px"
      alignSelf="stretch"
      borderRadius="12px"
      border="1px solid var(--colors-color-layout-border)"
      background={cardBackgroundColor}
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
          color={`var(--colors-${iconAndTextColor})`}
        />
        <Flex
          direction="column"
          alignItems="flex-start"
          flex="1 0 0"
        >
          <Text
            color={iconAndTextColor}
            textStyle="text-sm-regular"
            whiteSpace="pre-wrap"
          >
            {description}
          </Text>
        </Flex>
      </Flex>
    </Flex>
  );
}

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
      <AdditionalInfoBanner
        description={t('stakingInformationDescription')}
        isWarning={false}
      />
    </Flex>
  );
}

export function UnstakeAdditionalInfo() {
  const { t } = useTranslation('staking');
  return (
    <Flex
      direction="column"
      alignItems="flex-start"
      gap={2}
      alignSelf="stretch"
    >
      <AdditionalInfoBanner
        description={t('unstakingInformationDescription')}
        isWarning={true}
      />
    </Flex>
  );
}
