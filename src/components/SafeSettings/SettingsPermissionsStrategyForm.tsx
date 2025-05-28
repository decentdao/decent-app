import { Box, Button, Flex, Image, Text } from '@chakra-ui/react';
import { Info } from '@phosphor-icons/react';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useCurrentDAOKey } from '../../hooks/DAO/useCurrentDAOKey';
import { useDAOStore } from '../../providers/App/AppProvider';
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
  const { daoKey } = useCurrentDAOKey();
  const { governance } = useDAOStore({ daoKey });
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
          <Text textStyle="text-xl-regular">{t('asset')}</Text>
          <Text color="color-lilac-100">*</Text>
          <ModalTooltip
            containerRef={tooltipContainerRef}
            label={t('assetTooltip')}
          >
            <Box color="color-lilac-100">
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
            borderColor="color-neutral-900"
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
              textStyle="text-base-regular"
              color="color-white"
            >
              {votesToken?.symbol || erc721Tokens?.map(token => token.symbol).join(', ')}
            </Text>
          </Flex>
        </Button>
      </Flex>
      <LabelWrapper
        label={t('permissionAmountLabel')}
        labelColor="color-neutral-300"
      >
        <BigIntInput
          onChange={setProposerThreshold}
          decimalPlaces={votesToken ? votesToken.decimals : 0}
          value={proposerThreshold.bigintValue}
        />
      </LabelWrapper>
    </Flex>
  );
}
