import { Box, Button, Flex, Text } from '@chakra-ui/react';
import { SafeBalanceResponse } from '@safe-global/safe-service-client';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { DAO_ROUTES } from '../../../constants/routes';
import useLidoStaking from '../../../hooks/stake/lido/useLidoStaking';
import { useFractal } from '../../../providers/App/AppProvider';
import { useNetworkConfig } from '../../../providers/NetworkConfig/NetworkConfigProvider';
import { BigIntValuePair } from '../../../types';
import { BigIntInput } from '../forms/BigIntInput';

export default function StakeModal({ close }: { close: () => void }) {
  const {
    node: { daoAddress },
    treasury: { assetsFungible },
  } = useFractal();
  const { addressPrefix } = useNetworkConfig();
  const navigate = useNavigate();
  const { t } = useTranslation('stake');

  const fungibleAssetsWithBalance = assetsFungible.filter(asset => parseFloat(asset.balance) > 0);

  const [selectedAsset] = useState<SafeBalanceResponse>(fungibleAssetsWithBalance[0]);
  const [inputAmount, setInputAmount] = useState<BigIntValuePair>();
  const onChangeAmount = (value: BigIntValuePair) => {
    setInputAmount(value);
  };

  const { handleStake } = useLidoStaking();
  const handleSubmit = async () => {
    if (inputAmount?.bigintValue) {
      await handleStake(inputAmount?.bigintValue);
      close();
      if (daoAddress) {
        navigate(DAO_ROUTES.proposals.relative(addressPrefix, daoAddress));
      }
    }
  };

  return (
    <Box>
      <Box>
        <Flex
          alignItems="center"
          marginBottom="0.5rem"
        >
          <Text>{t('stakeAmount')}</Text>
        </Flex>
        <BigIntInput
          value={inputAmount?.bigintValue}
          onChange={onChangeAmount}
          decimalPlaces={selectedAsset?.token?.decimals}
          placeholder="0"
          maxValue={BigInt(selectedAsset.balance)}
        />
      </Box>
      <Button
        onClick={handleSubmit}
        mt={4}
        width="100%"
      >
        {t('submitStakingProposal')}
      </Button>
    </Box>
  );
}
