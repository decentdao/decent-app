import { Box, Button, Flex, Hide, Show, Text } from '@chakra-ui/react';
import { ethers } from 'ethers';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { encodeFunctionData, getContract } from 'viem';
import { useAccount } from 'wagmi';
import { EntryPointAbi } from '../../assets/abi/EntryPointAbi';
import { DAOSearch } from '../../components/ui/menus/DAOSearch';
import { ENTRY_POINT_ADDRESS } from '../../constants/common';
import useNetworkPublicClient from '../../hooks/useNetworkPublicClient';
import { useNetworkWalletClient } from '../../hooks/useNetworkWalletClient';
import { useFractal } from '../../providers/App/AppProvider';
import { useNetworkConfigStore } from '../../providers/NetworkConfig/useNetworkConfigStore';
import { useDaoInfoStore } from '../../store/daoInfo/useDaoInfoStore';
import { getUserSmartWalletAddress } from '../../utils/gaslessVoting';
import { GettingStarted } from './GettingStarted';
import { MySafes } from './MySafes';

export default function HomePage() {
  const { safe } = useDaoInfoStore();
  const { action } = useFractal();
  const { t } = useTranslation('home');
  const { address } = useAccount();
  const {
    rpcEndpoint,
    chain,
    contracts: { simpleAccountFactory },
  } = useNetworkConfigStore();
  const publicClient = useNetworkPublicClient();
  const { data: walletClient } = useNetworkWalletClient();

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
            const smartWalletAddress = await getUserSmartWalletAddress({
              address: address!,
              chainId: chain.id,
              publicClient,
              simpleAccountFactory,
            });

            // Get current network conditions
            const [baseFeePerGas, maxPriorityFeePerGass] = await Promise.all([
              publicClient
                .getBlock({ blockTag: 'latest' })
                .then(block => block.baseFeePerGas || 0n),
              publicClient.estimateMaxPriorityFeePerGas(),
            ]);

            const maxPriorityFeePerGas = maxPriorityFeePerGass * 100n;

            // Calculate maxFeePerGas with 20% buffer
            const maxFeePerGas = ((baseFeePerGas + maxPriorityFeePerGas) * 120n) / 100n;

            const validationGasLimit = 15000n * 20n;
            const callGasLimit = 15000n * 20n;
            const preVerificationGas = 9000n * 20n;
            const paymasterVerificationGasLimit = 15000n * 20n;
            const paymasterPostOpGasLimit = 0;

            const entryPoint = getContract({
              address: ENTRY_POINT_ADDRESS,
              abi: EntryPointAbi,
              client: publicClient,
            });

            // Check paymaster balance
            const paymasterAddress = '0x830f97bfC85a0263a5Fa74d153A79E3992B9a918' as `0x${string}`;
            // const paymasterCurrentBalance = await entryPoint.read.balanceOf([paymasterAddress!]);
            // if (paymasterCurrentBalance < estimatedCost) {
            //   toast.error(t('insufficientPaymasterBalance', { ns: 'gaslessVoting' }));
            //   return;
            // }

            const dummyCalldata = encodeFunctionData({
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
              args: [smartWalletAddress, 1n],
            });

            const dummyTarget = '0xaf039944af128b8dd75872866fc47fdd4eb45621';
            const castVoteCallData = encodeFunctionData({
              abi: [
                {
                  inputs: [
                    { name: 'target', type: 'address' },
                    { name: 'value', type: 'uint256' },
                    { name: 'data', type: 'bytes' },
                  ],
                  name: 'execute',
                  outputs: [{ name: '', type: 'bytes' }],
                  stateMutability: 'nonpayable',
                  type: 'function',
                },
              ],
              functionName: 'execute',
              args: [dummyTarget, 0n, dummyCalldata],
            });

            const accountGasLimits = ('0x' +
              validationGasLimit.toString(16).padStart(32, '0') +
              callGasLimit.toString(16).padStart(32, '0')) as `0x${string}`;

            const gasFees = ('0x' +
              maxPriorityFeePerGas.toString(16).padStart(32, '0') +
              maxFeePerGas.toString(16).padStart(32, '0')) as `0x${string}`;

            const paymasterAndData = (paymasterAddress +
              paymasterVerificationGasLimit.toString(16).padStart(32, '0') +
              paymasterPostOpGasLimit.toString(16).padStart(32, '0')) as `0x${string}`;

            const nonce = await entryPoint.read.getNonce([smartWalletAddress, 0n]);
            let userOpData = {
              sender: smartWalletAddress as `0x${string}`,
              nonce: nonce,

              initCode: '0x' as `0x${string}`,
              callData: castVoteCallData,

              accountGasLimits,
              preVerificationGas,

              gasFees: gasFees,

              paymasterAndData: paymasterAndData,
              signature: '0x' as `0x${string}`, // Not used in gatUserOpHash
            };

            // Sign the UserOperation
            const userOpHash = await entryPoint.read.getUserOpHash([userOpData]);
            const signature = await walletClient!.signMessage({
              message: { raw: ethers.getBytes(userOpHash) },
            });
            userOpData.signature = signature as `0x${string}`;

            const userOpPostBody = {
              sender: userOpData.sender,
              callData: userOpData.callData,
              nonce: `0x${nonce.toString(32)}`,
              callGasLimit: `0x${callGasLimit.toString(16)}`,
              verificationGasLimit: `0x${validationGasLimit.toString(16)}`,
              preVerificationGas: `0x${preVerificationGas.toString(16)}`,
              maxFeePerGas: `0x${maxFeePerGas.toString(16)}`,
              maxPriorityFeePerGas: `0x${maxPriorityFeePerGas.toString(16)}`,
              paymasterVerificationGasLimit: `0x${validationGasLimit.toString(16)}`,
              signature: signature as `0x${string}`,
              paymaster: paymasterAddress!,
            };

            console.log({ userOpData });

            // Send UserOperation to bundler
            const response = await fetch(rpcEndpoint, {
              method: 'POST',
              headers: {
                accept: 'application/json',
                'content-type': 'application/json',
              },
              body: JSON.stringify({
                id: 1,
                jsonrpc: '2.0',
                // method: 'eth_estimateUserOperationGas',
                method: 'eth_sendUserOperation',
                params: [userOpPostBody, ENTRY_POINT_ADDRESS],
              }),
            });

            const result = await response.json();

            if (result.error) {
              console.error('UserOperation error:', result.error);
              throw new Error(result.error.message || 'Failed to send gasless vote');
            }

            return result;
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
