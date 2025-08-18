import { Button, Flex, Show, Text } from '@chakra-ui/react';
import { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { zeroAddress } from 'viem';
import { SettingsContentBox } from '../../../../components/SafeSettings/SettingsContentBox';
import { DisplayAddress } from '../../../../components/ui/links/DisplayAddress';
import { ModalContext } from '../../../../components/ui/modals/ModalProvider';
import NestedPageHeader from '../../../../components/ui/page/Header/NestedPageHeader';
import Divider from '../../../../components/ui/utils/Divider';
import { DAO_ROUTES } from '../../../../constants/routes';
import { useCurrentDAOKey } from '../../../../hooks/DAO/useCurrentDAOKey';
import { useDAOStore } from '../../../../providers/App/AppProvider';
import { useNetworkConfigStore } from '../../../../providers/NetworkConfig/useNetworkConfigStore';
import { formatCoin } from '../../../../utils';

export function SafeTokenSettingsPage() {
  const navigate = useNavigate();
  const { t } = useTranslation('settings');
  const { addressPrefix } = useNetworkConfigStore();
  const { daoKey } = useCurrentDAOKey();
  const {
    node: { safe },
    governance: { erc20Token },
  } = useDAOStore({ daoKey });

  const { closeAllModals } = useContext(ModalContext);

  return (
    <>
      <Show below="md">
        <NestedPageHeader
          title={t('tokenTitle')}
          backButton={{
            text: t('settings'),
            href: DAO_ROUTES.settings.relative(addressPrefix, safe?.address || zeroAddress),
          }}
        />
      </Show>
      <SettingsContentBox>
        <Flex
          gap={6}
          direction="column"
          width="100%"
        >
          <Text
            color="color-white"
            textStyle="text-lg-regular"
          >
            {t('governanceTokenInfoTitle')}
          </Text>
          {erc20Token ? (
            <Flex
              justifyContent="space-between"
              flexWrap={{ base: 'wrap', md: 'nowrap' }}
              borderWidth="0.06rem"
              borderColor="color-neutral-900"
              borderRadius="0.75rem"
              flexDirection="column"
            >
              {/* TOKEN NAME */}
              <Flex
                alignItems="center"
                justifyContent="space-between"
                px={6}
                py={2}
              >
                <Text textStyle="text-base-regular">{t('governanceTokenNameTitle')}</Text>
                <DisplayAddress
                  mb={-2}
                  mr={-4}
                  address={erc20Token.address}
                >
                  {erc20Token.name}
                </DisplayAddress>
              </Flex>

              <Divider />

              {/* TOKEN SYMBOL */}
              <Flex
                alignItems="center"
                justifyContent="space-between"
                px={6}
                py={2}
              >
                <Text textStyle="text-base-regular">{t('governanceTokenSymbolLabel')}</Text>
                <Text
                  color="color-neutral-300"
                  textStyle="text-base-regular"
                >
                  ${erc20Token.symbol}
                </Text>
              </Flex>

              <Divider />

              {/* TOTAL SUPPLY */}
              <Flex
                alignItems="center"
                justifyContent="space-between"
                px={6}
                py={2}
              >
                <Text textStyle="text-base-regular">{t('tokenTabTokenSupplyLabel')}</Text>
                <Text
                  color="color-neutral-300"
                  textStyle="text-base-regular"
                >
                  {formatCoin(
                    erc20Token.totalSupply,
                    false,
                    erc20Token.decimals,
                    erc20Token.symbol,
                    false,
                  )}
                </Text>
              </Flex>
            </Flex>
          ) : (
            <Flex
              flexDirection="column"
              alignItems="flex-start"
              alignSelf="stretch"
            >
              <Flex
                flexDirection="column"
                mt="0.5rem"
                mb="1rem"
              >
                <Text
                  whiteSpace="pre-wrap"
                  textStyle="text-sm-regular"
                >
                  {t('tokenPageNotDeployedDescription')}
                </Text>
              </Flex>

              <Button
                onClick={() => {
                  if (!safe) return;
                  closeAllModals();
                  navigate(DAO_ROUTES.deployToken.relative(addressPrefix, safe.address));
                }}
              >
                {t('tokenPageDeployTokenButton')}
              </Button>
            </Flex>
          )}
        </Flex>
      </SettingsContentBox>
    </>
  );
}
