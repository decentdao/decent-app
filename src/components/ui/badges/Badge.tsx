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

type BadgeLabelKey =
  | FractalProposalState
  | DAOState
  | 'ownerApproved'
  | 'ownerRejected'
  | 'revShareDaoSafeWarning'
  | 'revShareTotalError';

const BADGE_MAPPING: Record<BadgeLabelKey, BadgeType> = {
  [FractalProposalState.ACTIVE]: {
    tooltipKey: 'stateActiveTip',
    bg: 'color-lilac-100',
    textColor: 'color-lilac-700',
    _hover: { bg: 'color-lilac-200', textColor: 'color-lilac-700' },
  },
  [FractalProposalState.TIMELOCKED]: {
    tooltipKey: 'stateTimelockedTip',
    bg: 'color-neutral-100',
    textColor: 'color-neutral-800',
    _hover: { bg: 'color-neutral-300', textColor: 'color-neutral-800' },
  },
  [FractalProposalState.EXECUTED]: {
    tooltipKey: 'stateExecutedTip',
    bg: 'color-green-800',
    textColor: 'color-white',
    _hover: { bg: 'color-green-950', textColor: 'color-white' },
  },
  [FractalProposalState.EXECUTABLE]: {
    tooltipKey: 'stateExecutableTip',
    bg: 'color-green-500',
    textColor: 'color-black',
    _hover: { bg: 'color-green-600', textColor: 'color-black' },
  },
  [FractalProposalState.FAILED]: {
    tooltipKey: 'stateFailedTip',
    bg: 'color-error-500',
    textColor: 'color-error-50',
    _hover: { bg: 'color-error-800', textColor: 'color-error-50' },
  },
  [FractalProposalState.TIMELOCKABLE]: {
    tooltipKey: 'stateTimelockableTip',
    bg: 'color-lilac-100',
    textColor: 'color-lilac-700',
    _hover: { bg: 'color-lilac-200', textColor: 'color-lilac-700' },
  },
  [FractalProposalState.MODULE]: {
    tooltipKey: 'stateModuleTip',
    bg: 'color-lilac-100',
    textColor: 'color-lilac-700',
    _hover: { bg: 'color-lilac-200', textColor: 'color-lilac-700' },
  },
  [FractalProposalState.EXPIRED]: {
    tooltipKey: 'stateExpiredTip',
    bg: 'color-neutral-800',
    textColor: 'color-neutral-300',
    _hover: { bg: 'color-neutral-950', textColor: 'color-neutral-300' },
  },
  [FractalProposalState.REJECTED]: {
    tooltipKey: 'stateRejectedTip',
    bg: 'color-error-500',
    textColor: 'color-error-50',
    _hover: { bg: 'color-error-800', textColor: 'color-error-50' },
  },
  [FractalProposalState.PENDING]: {
    tooltipKey: 'statePendingTip',
    bg: 'color-yellow-200',
    textColor: 'color-black',
    _hover: { bg: 'color-yellow-200', textColor: 'color-yellow-950' },
  },
  [FractalProposalState.CLOSED]: {
    tooltipKey: 'stateClosedTip',
    bg: 'color-neutral-100',
    textColor: 'color-neutral-800',
    _hover: { bg: 'color-neutral-300', textColor: 'color-neutral-800' },
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
    bg: 'color-neutral-800',
    textColor: 'color-neutral-300',
    _hover: { bg: 'color-neutral-950', textColor: 'color-neutral-300' },
  },
  ownerRejected: {
    bg: 'color-error-500',
    textColor: 'color-error-50',
    _hover: { bg: 'color-error-800', textColor: 'color-error-50' },
  },
  revShareDaoSafeWarning: {
    bg: 'color-warning-900',
    textColor: 'color-warning-200',
    _hover: { bg: 'color-warning-900', textColor: 'color-warning-200' },
  },
  revShareTotalError: {
    bg: 'color-error-400',
    textColor: 'color-error-50',
    _hover: { bg: 'color-error-400', textColor: 'color-error-50' },
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
  leftIcon?: ReactNode;
}

export function Badge({ labelKey, children, size, leftIcon }: IBadge) {
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
        {leftIcon !== undefined ? (
          leftIcon
        ) : (
          <Box
            rounded="full"
            bg={colors.textColor}
            w="0.5rem"
            h="0.5rem"
          />
        )}
        <Text
          textStyle="text-sm-medium"
          lineHeight="1"
        >
          {children || t(labelKey)}
        </Text>
      </Flex>
    </DecentTooltip>
  );
}

export function ProposalStateBadge({
  labelKey,
  size,
  rejectionProposalState,
}: IBadge & { rejectionProposalState?: FractalProposalState | null }) {
  let badgeLabelKey = labelKey;
  if (
    rejectionProposalState === FractalProposalState.TIMELOCKABLE ||
    rejectionProposalState === FractalProposalState.TIMELOCKED
  ) {
    badgeLabelKey = rejectionProposalState;
  }
  return (
    <Badge
      labelKey={badgeLabelKey}
      size={size}
    />
  );
}
