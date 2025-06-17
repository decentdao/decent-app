import { MenuList } from '@chakra-ui/react';
import { Link, Plugs, Stack } from '@phosphor-icons/react';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAccount, useDisconnect } from 'wagmi';
import { NEUTRAL_2_82_TRANSPARENT } from '../../../../constants/common';
import { BASE_ROUTES } from '../../../../constants/routes';
import useFeatureFlag from '../../../../helpers/environmentFeatureFlags';
import Divider from '../../utils/Divider';
import { ConnectedWalletMenuItem } from './ConnectedWalletMenuItem';
import { MenuItemButton } from './MenuItemButton';

export function WalletMenu() {
  const user = useAccount();
  const { disconnect } = useDisconnect();
  const { open } = useWeb3Modal();
  const { t } = useTranslation('menu');
  const isRevShareEnabled = useFeatureFlag('flag_revenue_sharing');
  const navigate = useNavigate();

  return (
    <MenuList
      minW="15.25rem"
      rounded="0.75rem"
      bg={NEUTRAL_2_82_TRANSPARENT}
      backdropFilter="auto"
      backdropBlur="10px"
      border="1px solid"
      borderColor="color-neutral-900"
      zIndex="popover"
      py="0.25rem"
    >
      {user.address && (
        <>
          <ConnectedWalletMenuItem />
          <Divider my="0.25rem" />
        </>
      )}
      {!user.address && (
        <MenuItemButton
          testId="accountMenu-connect"
          label={t('connect')}
          Icon={Link}
          onClick={() => open()}
        />
      )}
      {user.address && (
        <>
          {isRevShareEnabled && (
            <>
              <MenuItemButton
                testId="accountMenu-revenueSharing"
                label={t('staking')}
                Icon={Stack}
                onClick={() => navigate(BASE_ROUTES.staking)}
              />
              <Divider my="0.25rem" />
            </>
          )}
          <MenuItemButton
            testId="accountMenu-disconnect"
            label={t('disconnect')}
            Icon={Plugs}
            onClick={disconnect}
          />
        </>
      )}
    </MenuList>
  );
}
