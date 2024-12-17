import { Box, Button, Flex, Text } from '@chakra-ui/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { DAO_ROUTES } from '../../../constants/routes';
import useLidoStaking from '../../../hooks/stake/lido/useLidoStaking';
import { useFractal } from '../../../providers/App/AppProvider';
import { useNetworkConfigStore } from '../../../providers/NetworkConfig/useNetworkConfigStore';
import { useDaoInfoStore } from '../../../store/daoInfo/useDaoInfoStore';
import { BigIntValuePair, TokenBalance } from '../../../types';
import { BigIntInput } from '../forms/BigIntInput';

export default function StakeModal({ close }: { close: () => void }) {
  const {
    treasury: { assetsFungible },
  } = useFractal();
  const { safe } = useDaoInfoStore();
  const { addressPrefix } = useNetworkConfigStore();
  const navigate = useNavigate();
  const { t } = useTranslation('stake');

  const fungibleAssetsWithBalance = assetsFungible.filter(asset => parseFloat(asset.balance) > 0);

  const [selectedAsset] = useState<TokenBalance>(fungibleAssetsWithBalance[0]);
  const [inputAmount, setInputAmount] = useState<BigIntValuePair>();
  const onChangeAmount = (value: BigIntValuePair) => {
    setInputAmount(value);
  };

  const { handleStake } = useLidoStaking();
  const handleSubmit = async () => {
    if (inputAmount?.bigintValue) {
      await handleStake(inputAmount?.bigintValue);
      close();
      if (safe?.address) {
        navigate(DAO_ROUTES.proposals.relative(addressPrefix, safe.address));
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
          decimalPlaces={selectedAsset.decimals}
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
