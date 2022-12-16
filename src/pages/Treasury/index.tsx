import { Box, Flex } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import PageHeader from '../../components/ui/Header/PageHeader';
import { TitledInfoBox } from '../../components/ui/containers/TitledInfoBox';
import { ModalType } from '../../components/ui/modals/ModalProvider';
import { useFractalModal } from '../../components/ui/modals/useFractalModal';
import { GovernanceTypes } from '../../providers/Fractal/governance/types';
import { useFractal } from '../../providers/Fractal/hooks/useFractal';
import { useWeb3Provider } from '../../providers/Web3Data/hooks/useWeb3Provider';
import { Assets } from './components/Assets';
import { Transactions } from './components/Transactions';

function Treasury() {
  const {
    gnosis: {
      daoName,
      safe: { owners },
    },
    governance: { type, governanceToken },
    treasury: { assetsFungible },
  } = useFractal();
  const {
    state: { account },
  } = useWeb3Provider();

  const { t } = useTranslation('treasury');

  const isOwnerOrDelegate =
    type === GovernanceTypes.GNOSIS_SAFE
      ? owners?.includes(account || '')
      : governanceToken?.votingWeight && governanceToken.votingWeight.gt(0);

  const showButton = isOwnerOrDelegate && assetsFungible.length > 0;

  return (
    <Box>
      <PageHeader
        title={t('titleTreasury', { daoName: daoName })}
        titleTestId={'title-treasury'}
        buttonText={showButton ? t('buttonSendAssets') : undefined}
        buttonClick={useFractalModal(ModalType.SEND_ASSETS)}
        buttonTestId="link-send-assets"
      />
      <Flex
        align="start"
        gap="1rem"
        flexWrap="wrap"
      >
        <TitledInfoBox
          minWidth={{ sm: '100%', xl: '55%' }}
          title={t('titleTransactions')}
          titleTestId="title-transactions"
        >
          <Transactions />
        </TitledInfoBox>
        <TitledInfoBox
          minWidth={{ sm: '100%', xl: '35%' }}
          title={t('titleAssets')}
          titleTestId="title-assets"
        >
          <Assets />
        </TitledInfoBox>
      </Flex>
    </Box>
  );
}
export default Treasury;
