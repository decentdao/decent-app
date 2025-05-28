import { Box, Flex, Progress, Text, Icon } from '@chakra-ui/react';
import { Check } from '@phosphor-icons/react';
import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

interface ProgressBarProps {
  value: number;
  customValueComponent?: ReactNode;
  max?: number;
  unit?: string;
  label: string;
}
export default function ProgressBar({
  value,
  customValueComponent,
  max = 100,
  unit = '%',
  label,
}: ProgressBarProps) {
  return (
    <Box
      width="full"
      position="relative"
    >
      <Progress
        width="full"
        value={max !== 100 ? value : Math.min(value, 100)}
        max={max}
      />
      <Flex
        justifyContent="space-between"
        alignItems="center"
        position="absolute"
        top={0}
        width="100%"
        px="1rem"
        height="100%"
      >
        <Text textStyle="text-xs-medium">{label}</Text>
        {customValueComponent ? (
          <>{customValueComponent}</>
        ) : (
          <Text
            textStyle="text-xs-medium"
            display="inline-flex"
            alignItems="center"
            height="100%"
            right="0"
          >
            {Math.min(value, 100)}
            {unit}
          </Text>
        )}
      </Flex>
    </Box>
  );
}

interface QuorumProgressBarProps {
  helperText?: string;
  unit?: string;
  reachedQuorum: number;
  totalQuorum?: number;
}

export function QuorumProgressBar({
  unit,
  helperText,
  reachedQuorum,
  totalQuorum,
}: QuorumProgressBarProps) {
  const { t } = useTranslation('proposal');
  return (
    <Flex
      flexWrap="wrap"
      marginTop={2}
    >
      <ProgressBar
        value={reachedQuorum}
        max={totalQuorum}
        unit={unit}
        label={t('quorum', { ns: 'common' })}
        customValueComponent={
          totalQuorum ? (
            <Text
              textStyle="text-xs-medium"
              whiteSpace="nowrap"
              overflow="clip"
            >
              {reachedQuorum >= totalQuorum && (
                <Icon
                  color="color-lilac-100"
                  mr={2}
                  as={Check}
                />
              )}
              {reachedQuorum.toLocaleString()} / {totalQuorum.toLocaleString()}
            </Text>
          ) : undefined
        }
      />
      {helperText && (
        <Text
          color="color-neutral-300"
          marginTop={3}
        >
          {helperText}
        </Text>
      )}
    </Flex>
  );
}
