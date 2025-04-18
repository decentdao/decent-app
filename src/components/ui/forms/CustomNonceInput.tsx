import { Flex, HStack, Text, VStack } from '@chakra-ui/react';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useCurrentDAOKey } from '../../../hooks/DAO/useCurrentDAOKey';
import { useStore } from '../../../providers/App/AppProvider';
import SupportTooltip from '../badges/SupportTooltip';
import ExampleLabel from './ExampleLabel';
import { InputComponent } from './InputComponent';

export function CustomNonceInput({
  align = 'start',
  nonce,
  onChange,
  disabled,
  renderTrimmed = true,
}: {
  align?: 'start' | 'end';
  nonce: number | undefined;
  onChange: (nonce?: string) => void;
  disabled?: boolean;
  renderTrimmed?: boolean;
}) {
  const { daoKey } = useCurrentDAOKey();
  const {
    governance: { isAzorius },
    node: { safe },
  } = useStore({ daoKey });
  const { t } = useTranslation(['proposal', 'common']);
  const errorMessage =
    nonce !== undefined && safe && nonce < safe.nonce ? t('customNonceError') : undefined;

  const tooltipContainer = useRef<HTMLDivElement>(null);
  if (isAzorius) return null;

  return (
    <VStack alignItems={align}>
      <InputComponent
        label={
          renderTrimmed ? (
            <Flex
              alignSelf="center"
              ref={tooltipContainer}
              gap="0.5rem"
              mt="0.5rem"
            >
              <Text>{t('customNonceTrimmed', { ns: 'proposal' })}</Text>
              <SupportTooltip
                containerRef={tooltipContainer}
                color="lilac-0"
                label={t('customNonceTooltip', { ns: 'proposal' })}
                mx="2"
                mt="1"
              />
            </Flex>
          ) : (
            t('customNonce', { ns: 'proposal' })
          )
        }
        helper={renderTrimmed ? '' : t('customNonceTooltip', { ns: 'proposal' })}
        isRequired={false}
        value={nonce?.toString() || ''}
        onChange={e => {
          const value = e.target.value;

          // @dev This regex /^\d*$/ ensures the input contains only digits (0-9).
          if (/^\d*$/.test(value)) {
            onChange(value);
          }
        }}
        disabled={disabled}
        subLabel={
          renderTrimmed ? null : (
            <HStack>
              <Text>
                {t('example', { ns: 'common' })}: <ExampleLabel bg="neutral-4">14</ExampleLabel>{' '}
              </Text>
            </HStack>
          )
        }
        testId={`custom-nonce`}
        isInvalid={!!errorMessage}
      />
      {errorMessage && <Text color="red-0">{errorMessage}</Text>}
    </VStack>
  );
}
