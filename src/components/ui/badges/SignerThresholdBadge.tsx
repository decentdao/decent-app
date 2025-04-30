import { Flex, Text, Icon as ChakraIcon } from '@chakra-ui/react';
import { User } from '@phosphor-icons/react';
import { COLOR_TEXT_SUCCESS } from '../../../constants/common';
import { useCurrentDAOKey } from '../../../hooks/DAO/useCurrentDAOKey';
import { useStore } from '../../../providers/App/AppProvider';
import { useDaoInfoStore } from '../../../store/daoInfo/useDaoInfoStore';
import { GovernanceType } from '../../../types';

export function CountProgressBadge(props: { total: number; current: number }) {
  const themeKey = props.current >= props.total ? 'green' : 'red';

  const colorScheme: Record<string, { color: string; borderColor: string }> = {
    green: {
      color: COLOR_TEXT_SUCCESS,
      borderColor: COLOR_TEXT_SUCCESS,
    },
    red: {
      color: 'red-1',
      borderColor: 'red-1',
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
        textStyle="labels-large"
        lineHeight="1"
      >
        {props.current} out of {props.total}
      </Text>
    </Flex>
  );
}

export function SignerThresholdBadge() {
  const { safe } = useDaoInfoStore();
  const { daoKey } = useCurrentDAOKey();
  const { governance } = useStore({ daoKey });
  const { type } = governance;

  if (!safe || type !== GovernanceType.MULTISIG) {
    return null;
  }
  const { owners, threshold } = safe;
  return (
    <CountProgressBadge
      total={threshold}
      current={owners.length}
    />
  );
}
