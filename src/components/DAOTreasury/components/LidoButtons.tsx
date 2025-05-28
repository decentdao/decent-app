import { Button, Divider, HStack, Show, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { DecentTooltip } from '../../ui/DecentTooltip';
import useTreasuryLidoInteractions from '../hooks/useTreasuryLidoInteractions';

export default function LidoButtons() {
  const {
    showStakeButton,
    showUnstakeButton,
    showClaimETHButton,
    openStakingModal,
    handleUnstakeButtonClick,
    handleClickClaimButton,
    isLidoClaimable,
  } = useTreasuryLidoInteractions();
  const { t } = useTranslation('treasury');

  return (
    <>
      {' '}
      {(showStakeButton || showUnstakeButton || showClaimETHButton) && (
        <Show above="lg">
          <Divider
            variant="darker"
            my="1rem"
          />
          <Text
            textStyle="text-xs-medium"
            color="color-neutral-300"
            my="1rem"
            px={{ base: '1rem', lg: '1.5rem' }}
          >
            {t('subtitleStaking')}
          </Text>
          <HStack px={{ base: '1rem', lg: '1.5rem' }}>
            {showStakeButton && (
              <Button
                size="sm"
                onClick={openStakingModal}
              >
                {t('stake')}
              </Button>
            )}
            {showUnstakeButton && (
              <Button
                size="sm"
                onClick={handleUnstakeButtonClick}
              >
                {t('unstake')}
              </Button>
            )}
            {showClaimETHButton && (
              <DecentTooltip label={!isLidoClaimable ? t('nonClaimableYet') : ''}>
                <Button
                  size="sm"
                  isDisabled={!isLidoClaimable}
                  onClick={handleClickClaimButton}
                >
                  {t('claimUnstakedETH')}
                </Button>
              </DecentTooltip>
            )}
          </HStack>
        </Show>
      )}
    </>
  );
}
