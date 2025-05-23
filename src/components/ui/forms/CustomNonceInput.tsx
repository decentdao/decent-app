import { Box, Flex, Input, Menu, MenuButton, MenuList, Text } from '@chakra-ui/react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NEUTRAL_2_82_TRANSPARENT } from '../../../constants/common';
import { useCurrentDAOKey } from '../../../hooks/DAO/useCurrentDAOKey';
import { useDAOStore } from '../../../providers/App/AppProvider';
import { FractalProposalState, MultisigProposal } from '../../../types';
import SupportTooltip from '../badges/SupportTooltip';
import { OptionsList } from '../menus/OptionMenu/OptionsList';
import { IOption } from '../menus/OptionMenu/types';
import ExampleLabel from './ExampleLabel';
import { LabelComponent } from './InputComponent';

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
    governance: { isAzorius, proposals },
    node: { safe },
  } = useDAOStore({ daoKey });
  const { t } = useTranslation(['proposal', 'common']);
  const errorMessage =
    nonce !== undefined && safe && nonce < safe.nonce ? t('customNonceError') : undefined;

  const tooltipContainer = useRef<HTMLDivElement>(null);
  const [showNonceMenu, setShowNonceMenu] = useState(false);
  if (isAzorius || !safe) return null;

  const recommendedNonce = safe.nextNonce.toString();

  const pByNonce: {
    [nonce: string]: {
      numberOfProposals: number;
      latestProposalId: string;
      isNonceUsed: boolean;
    };
  } = {};
  for (const p of (proposals ?? []) as MultisigProposal[]) {
    if (p.nonce === undefined) continue; // should never happen
    if (p.nonce === safe.nextNonce) continue;
    const key = p.nonce.toString();
    const isRejection = p.state === FractalProposalState.REJECTED;
    const currentNumberOfProposals = pByNonce[key]?.numberOfProposals ?? 0;
    pByNonce[key] = {
      numberOfProposals: !isRejection ? currentNumberOfProposals + 1 : currentNumberOfProposals,
      latestProposalId: p.proposalId,
      isNonceUsed:
        pByNonce[key]?.isNonceUsed ??
        (p.state === FractalProposalState.EXECUTED || p.state === FractalProposalState.REJECTED),
    };
  }
  const sortedPByNonce = Object.entries(pByNonce)
    .sort((a, b) => Number(b[0]) - Number(a[0]))
    .slice(0, 5);
  const activeProposalOptions: IOption[] = sortedPByNonce.map(([n, pInfo]) => {
    const isSingleTransaction = pInfo.numberOfProposals === 1;
    const label = isSingleTransaction
      ? t('nonceLabelSingleTransaction', { proposalId: pInfo.latestProposalId.slice(0, 4) })
      : t('nonceLabelMultipleTransactions');
    return {
      onClick: () => {
        onChange(n);
        setShowNonceMenu(false);
      },
      optionKey: `${n} - ${label}`,
      isDisabled: pInfo.isNonceUsed,
    };
  });

  return (
    <Menu
      placement="bottom-start"
      offset={[0, 0]}
      onClose={() => setShowNonceMenu(false)}
      closeOnBlur
      isOpen={showNonceMenu}
    >
      <Flex
        flexDirection="column"
        alignItems={align}
      >
        <LabelComponent
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
                  color="color-lilac-100"
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
          disabled={disabled}
          subLabel={
            renderTrimmed ? null : (
              <Text>
                {t('example', { ns: 'common' })}:{' '}
                <ExampleLabel bg="color-neutral-800">14</ExampleLabel>{' '}
              </Text>
            )
          }
        >
          <Input
            onFocus={() => setShowNonceMenu(true)}
            value={nonce?.toString() || ''}
            onChange={e => {
              const value = e.target.value;

              // @dev This regex /^\d*$/ ensures the input contains only digits (0-9).
              if (/^\d*$/.test(value)) {
                onChange(value);
              }
            }}
            isDisabled={disabled}
            data-testid={`custom-nonce`}
            isInvalid={!!errorMessage}
          />
          <MenuButton
            as={Box}
            width="full"
          />
        </LabelComponent>
        {errorMessage && <Text color="color-error-500">{errorMessage}</Text>}
      </Flex>
      <MenuList
        borderWidth="1px"
        borderColor="color-neutral-900"
        borderRadius="0.78rem"
        zIndex="popover"
      >
        <Box
          borderRadius="0.75rem"
          bg={NEUTRAL_2_82_TRANSPARENT}
          backdropFilter="auto"
          backdropBlur="10px"
        >
          <OptionsList
            options={[
              {
                optionKey: t('nonceLabelRecommended', { nonce: recommendedNonce }),
                onClick: () => {
                  onChange(recommendedNonce);
                  setShowNonceMenu(false);
                },
              },
            ]}
            showOptionSelected={false}
            closeOnSelect={true}
            namespace="proposal"
            titleKey={'nonceLabelRecommendedTitle'}
          />
          <OptionsList
            options={activeProposalOptions}
            showOptionSelected={false}
            closeOnSelect={true}
            namespace="proposal"
            titleKey={'nonceLabelReplaceActiveTitle'}
          />
        </Box>
      </MenuList>
    </Menu>
  );
}
