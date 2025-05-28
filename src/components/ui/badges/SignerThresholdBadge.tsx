import { Icon as ChakraIcon, Flex, Text } from '@chakra-ui/react';
import { User } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { COLOR_TEXT_SUCCESS } from '../../../constants/common';
import { useCurrentDAOKey } from '../../../hooks/DAO/useCurrentDAOKey';
import { useDAOStore } from '../../../providers/App/AppProvider';
import { GovernanceType } from '../../../types';

export function CountProgressBadge(props: { total: number; current: number }) {
  const { t } = useTranslation('proposal');
  const themeKey = props.current >= props.total ? 'green' : 'red';

  const colorScheme: Record<string, { color: string; borderColor: string }> = {
    green: {
      color: COLOR_TEXT_SUCCESS,
      borderColor: COLOR_TEXT_SUCCESS,
    },
    red: {
      color: 'color-error-400',
      borderColor: 'color-error-400',
    },
  };
  const currentTheme = colorScheme[themeKey];
  return (
    <Flex
      alignItems="center"
      gap="0.5rem"
      borderRadius="0.75rem"
      justifyContent="center"
      h="1.5rem"
      w="fit-content"
      p="0.5rem"
      lineHeight={1.5}
      border="1px solid"
      {...currentTheme}
    >
      <ChakraIcon
        as={User}
        size="1rem"
        color={currentTheme.color}
      />

      <Text
        textStyle="text-sm-medium"
        lineHeight="1"
      >
        {t('signersThresholdBadgeLabel', {
          current: props.current,
          total: props.total,
        })}
      </Text>
    </Flex>
  );
}

export function SignerThresholdBadge({
  numberOfConfirmedSigners,
  proposalThreshold,
  isRejected,
}: {
  numberOfConfirmedSigners?: number;
  proposalThreshold?: number;
  isRejected?: boolean;
}) {
  const { daoKey } = useCurrentDAOKey();
  const {
    governance,
    node: { safe },
  } = useDAOStore({ daoKey });
  const { type } = governance;

  if (
    !safe ||
    type !== GovernanceType.MULTISIG ||
    numberOfConfirmedSigners === undefined ||
    proposalThreshold === undefined ||
    isRejected
  ) {
    return null;
  }
  return (
    <CountProgressBadge
      total={proposalThreshold}
      current={numberOfConfirmedSigners}
    />
  );
}
