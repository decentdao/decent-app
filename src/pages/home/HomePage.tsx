import { Box, Button, Flex, Hide, Show, Text } from '@chakra-ui/react';

import { toSimpleSmartAccount } from 'permissionless/accounts';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { http } from 'viem';
import { createBundlerClient } from 'viem/account-abstraction';
import { privateKeyToAccount } from 'viem/accounts';
import { DAOSearch } from '../../components/ui/menus/DAOSearch';
import useNetworkPublicClient from '../../hooks/useNetworkPublicClient';
import { useFractal } from '../../providers/App/AppProvider';
import { useNetworkConfigStore } from '../../providers/NetworkConfig/useNetworkConfigStore';
import { useDaoInfoStore } from '../../store/daoInfo/useDaoInfoStore';
import { GettingStarted } from './GettingStarted';
import { MySafes } from './MySafes';

export default function HomePage() {
  const { safe } = useDaoInfoStore();
  const { action } = useFractal();
  const { t } = useTranslation('home');

  const { rpcEndpoint } = useNetworkConfigStore();
  const publicClient = useNetworkPublicClient();

  useEffect(() => {
    // @todo @dev Let's revisit this logic in future when state has been updated
    if (safe?.address) {
      action.resetSafeState();
    }
  }, [safe?.address, action]);

  return (
    <Flex
      direction="column"
      mt="2.5rem"
    >
      {/* Mobile */}
      <Hide above="md">
        <Flex
          direction="column"
          w="100%"
          gap="1.5rem"
        >
          <DAOSearch />
          <Text textStyle="heading-small">{t('mySafes')}</Text>
        </Flex>
      </Hide>

      {/* Desktop */}
      <Show above="md">
        <Flex
          w="100%"
          alignItems="end"
          gap="1rem"
          justifyContent="space-between"
        >
          <Text
            textStyle="heading-small"
            whiteSpace="nowrap"
          >
            {t('mySafes')}
          </Text>
          <Box w="24rem">
            <DAOSearch />
          </Box>
        </Flex>
      </Show>

      <Button
        onClick={async () => {
          try {
            const paymasterAddress = '0x830f97bfC85a0263a5Fa74d153A79E3992B9a918' as `0x${string}`;

            const dummyTarget = '0xaf039944af128b8dd75872866fc47fdd4eb45621';

            const bundlerClient = createBundlerClient({
              client: publicClient,
              transport: http(rpcEndpoint),
            });
            const supportedEntryPoints = await bundlerClient.getSupportedEntryPoints();
            console.log({ supportedEntryPoints });

            const theAccount = privateKeyToAccount('[REDACTED LMAOOO]');

            const smartWallet = await toSimpleSmartAccount({
              client: publicClient!,
              owner: theAccount,
            });

            const hashhh = await bundlerClient.sendUserOperation({
              account: smartWallet,
              paymaster: paymasterAddress,
              maxPriorityFeePerGas: 100000000n,
              calls: [
                {
                  to: dummyTarget,
                  abi: [
                    {
                      inputs: [
                        { name: 'to', type: 'address' },
                        { name: 'amount', type: 'uint256' },
                      ],
                      name: 'mint',
                      outputs: [],
                      stateMutability: 'nonpayable',
                      type: 'function',
                    },
                  ],
                  functionName: 'mint',
                  args: ['0x44361baC177810392449d5D26A7d0371b6c430c3', 1n],
                },
              ],
            });

            console.log({ hashhh });

            const receipt = await bundlerClient.waitForUserOperationReceipt({ hash: hashhh });

            console.log({ receipt });

            return;
          } catch (error: any) {
            console.error('Gasless voting error:', error);

            if (error instanceof Error && error.message.match(/must be at least (\d+)/)) {
              toast.error(t('insufficientPaymasterBalance'));
            } else {
              toast.error(t('castVoteError'));
            }
          }
        }}
      >
        Click me!!!!
      </Button>

      <Flex
        direction="column"
        w="full"
        mt="1.5rem"
        gap="1.5rem"
      >
        <MySafes />
        <GettingStarted />
      </Flex>
    </Flex>
  );
}
