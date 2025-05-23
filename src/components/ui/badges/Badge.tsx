import { Box, Flex, Text } from '@chakra-ui/react';
import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { TOOLTIP_MAXW } from '../../../constants/common';
import { FractalProposalState, DAOState } from '../../../types';
import { DecentTooltip } from '../DecentTooltip';

type BadgeType = {
  tooltipKey?: string;
  bg: string;
  _hover: { bg: string; textColor: string };
  textColor: string;
};

const BADGE_MAPPING: Record<
  FractalProposalState | DAOState | 'ownerApproved' | 'ownerRejected',
  BadgeType
> = {
  [FractalProposalState.ACTIVE]: {
    tooltipKey: 'stateActiveTip',
    bg: 'lilac-0',
    textColor: 'cosmic-nebula-0',
    _hover: { bg: 'lilac--1', textColor: 'cosmic-nebula-0' },
  },
  [FractalProposalState.TIMELOCKED]: {
    tooltipKey: 'stateTimelockedTip',
    bg: 'neutral-8',
    textColor: 'neutral-4',
    _hover: { bg: 'neutral-7', textColor: 'neutral-4' },
  },
  [FractalProposalState.EXECUTED]: {
    tooltipKey: 'stateExecutedTip',
    bg: 'color-green-800',
    textColor: 'white-0',
    _hover: { bg: 'celery--6', textColor: 'white-0' },
  },
  [FractalProposalState.EXECUTABLE]: {
    tooltipKey: 'stateExecutableTip',
    bg: 'color-green-500',
    textColor: 'color-black',
    _hover: { bg: 'color-green-600', textColor: 'color-black' },
  },
  [FractalProposalState.FAILED]: {
    tooltipKey: 'stateFailedTip',
    bg: 'red-0',
    textColor: 'red-4',
    _hover: { bg: 'red--1', textColor: 'red-4' },
  },
  [FractalProposalState.TIMELOCKABLE]: {
    tooltipKey: 'stateTimelockableTip',
    bg: 'lilac-0',
    textColor: 'cosmic-nebula-0',
    _hover: { bg: 'lilac--1', textColor: 'cosmic-nebula-0' },
  },
  [FractalProposalState.MODULE]: {
    tooltipKey: 'stateModuleTip',
    bg: 'lilac-0',
    textColor: 'cosmic-nebula-0',
    _hover: { bg: 'lilac--1', textColor: 'cosmic-nebula-0' },
  },
  [FractalProposalState.EXPIRED]: {
    tooltipKey: 'stateExpiredTip',
    bg: 'neutral-4',
    textColor: 'neutral-7',
    _hover: { bg: 'neutral-2', textColor: 'neutral-7' },
  },
  [FractalProposalState.REJECTED]: {
    tooltipKey: 'stateRejectedTip',
    bg: 'red-0',
    textColor: 'red-4',
    _hover: { bg: 'red--1', textColor: 'red-4' },
  },
  [FractalProposalState.PENDING]: {
    tooltipKey: 'statePendingTip',
    bg: 'yellow-0',
    textColor: 'color-black',
    _hover: { bg: 'yellow-0', textColor: 'yellow--2' },
  },
  [FractalProposalState.CLOSED]: {
    tooltipKey: 'stateClosedTip',
    bg: 'neutral-8',
    textColor: 'neutral-4',
    _hover: { bg: 'neutral-7', textColor: 'neutral-4' },
  },
  [DAOState.freezeInit]: {
    tooltipKey: 'stateFreezeInitTip',
    bg: 'color-blue-300',
    textColor: 'color-blue-900',
    _hover: { bg: 'color-blue-200', textColor: 'color-blue-900' },
  },
  [DAOState.frozen]: {
    tooltipKey: 'stateFrozenTip',
    bg: 'color-blue-300',
    textColor: 'color-blue-900',
    _hover: { bg: 'color-blue-200', textColor: 'color-blue-900' },
  },
  ownerApproved: {
    bg: 'neutral-4',
    textColor: 'neutral-7',
    _hover: { bg: 'neutral-2', textColor: 'neutral-7' },
  },
  ownerRejected: {
    bg: 'red-0',
    textColor: 'red-4',
    _hover: { bg: 'red--1', textColor: 'red-4' },
  },
};

type Size = 'sm' | 'base';
type BadgeSize = { minWidth: string; height: string };
const BADGE_SIZES: Record<Size, BadgeSize> = {
  sm: { minWidth: '5rem', height: '1.375rem' },
  base: { minWidth: '5.4375rem', height: '1.375rem' },
};

interface IBadge {
  size: Size;
  labelKey: keyof typeof BADGE_MAPPING;
  children?: ReactNode;
}

export function Badge({ labelKey, children, size }: IBadge) {
  const { tooltipKey, ...colors } = BADGE_MAPPING[labelKey];
  const sizes = BADGE_SIZES[size];

  const { t } = useTranslation('proposal');
  return (
    <DecentTooltip
      label={tooltipKey ? t(tooltipKey) : undefined}
      maxW={TOOLTIP_MAXW}
      placement="top"
    >
      <Flex
        alignItems="center"
        gap="0.5rem"
        borderRadius="0.75rem"
        justifyContent="center"
        h="1.5rem"
        w="fit-content"
        p="0.5rem"
        lineHeight={1.5}
        {...sizes}
        {...colors}
      >
        <Box
          rounded="full"
          bg={colors.textColor}
          w="0.5rem"
          h="0.5rem"
        />
        <Text
          textStyle="labels-large"
          lineHeight="1"
        >
          {children || t(labelKey)}
        </Text>
      </Flex>
    </DecentTooltip>
  );
}
