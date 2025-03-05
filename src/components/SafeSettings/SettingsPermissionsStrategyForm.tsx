import { Box, Button, Flex, Image, Text } from '@chakra-ui/react';
import { Info } from '@phosphor-icons/react';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useFractal } from '../../providers/App/AppProvider';
import { AzoriusGovernance, BigIntValuePair } from '../../types';
import { BigIntInput } from '../ui/forms/BigIntInput';
import LabelWrapper from '../ui/forms/LabelWrapper';
import ModalTooltip from '../ui/modals/ModalTooltip';

export function SettingsPermissionsStrategyForm({
  proposerThreshold,
  setProposerThreshold,
}: {
  proposerThreshold: BigIntValuePair;
  setProposerThreshold: (value: BigIntValuePair) => void;
}) {
  const { t } = useTranslation('settings');
  const tooltipContainerRef = useRef<HTMLDivElement>(null);
  const { governance } = useFractal();
  const azoriusGovernance = governance as AzoriusGovernance;
  const { votesToken, erc721Tokens } = azoriusGovernance;

  if (!votesToken && !erc721Tokens) return null;

  return (
    <Flex
      flexDirection="column"
      gap={6}
    >
      <Flex
        flexDirection="column"
        gap={2}
        align="flex-start"
      >
        <Flex
          gap={1}
          alignItems="center"
          ref={tooltipContainerRef}
        >
          <Text textStyle="heading-small">{t('asset')}</Text>
          <Text color="lilac-0">*</Text>
          <ModalTooltip
            containerRef={tooltipContainerRef}
            label={t('assetTooltip')}
          >
            <Box color="lilac-0">
              <Info />
            </Box>
          </ModalTooltip>
        </Flex>
        <Button
          variant="unstyled"
          isDisabled
          p={0}
        >
          <Flex
            gap={3}
            alignItems="center"
            border="1px solid"
            borderColor="neutral-3"
            borderRadius="9999px"
            w="fit-content"
            className="payment-menu-asset"
            p={2}
          >
            <Image
              // @todo: Add asset logo
              src="/images/coin-icon-default.svg"
              boxSize="2.25rem"
            />
            <Text
              textStyle="body-small"
              color="white-0"
            >
              {votesToken?.symbol || erc721Tokens?.map(token => token.symbol).join(', ')}
            </Text>
          </Flex>
        </Button>
      </Flex>
      <LabelWrapper
        label={t('permissionAmountLabel')}
        labelColor="neutral-7"
      >
        <BigIntInput
          onChange={setProposerThreshold}
          decimalPlaces={votesToken ? votesToken.decimals : 0}
          value={proposerThreshold.bigintValue}
          parentFormikValue={proposerThreshold}
        />
      </LabelWrapper>
    </Flex>
  );
}
