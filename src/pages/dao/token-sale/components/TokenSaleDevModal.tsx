import {
  Box,
  Button,
  Text,
  VStack,
  HStack,
  Divider,
  Code,
  Input,
  FormControl,
  FormLabel,
  Grid,
  GridItem,
  Icon,
} from '@chakra-ui/react';
import {
  Wrench,
  CheckCircle,
  CurrencyEth,
  Coins,
  Handshake,
  UserMinus,
  Info,
} from '@phosphor-icons/react';
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Address, formatUnits, parseUnits } from 'viem';
import { useAccount } from 'wagmi';
import { ModalBase } from '../../../../components/ui/modals/ModalBase';
import { useTokenSaleContract } from '../../../../hooks/DAO/tokenSale/useTokenSaleContract';
import { useTokenSaleVerification } from '../../../../hooks/DAO/tokenSale/useTokenSaleVerification';
import { useNetworkWalletClient } from '../../../../hooks/useNetworkWalletClient';
import { useTransaction } from '../../../../hooks/utils/useTransaction';
import { useGovernanceFetcher } from '../../../../store/fetchers/governance';
import { TokenSaleData, TokenSaleState } from '../../../../types/tokenSale';

interface TokenSaleDevModalProps {
  isOpen: boolean;
  onClose: () => void;
  tokenSale: TokenSaleData;
}

const getSaleStateText = (state: TokenSaleState): string => {
  switch (state) {
    case TokenSaleState.NOT_STARTED:
      return 'Not Started';
    case TokenSaleState.ACTIVE:
      return 'Active';
    case TokenSaleState.SUCCEEDED:
      return 'Succeeded';
    case TokenSaleState.FAILED:
      return 'Failed';
    default:
      return 'Unknown';
  }
};

const getSaleStateColor = (state: TokenSaleState): string => {
  switch (state) {
    case TokenSaleState.NOT_STARTED:
      return 'color-neutral-400';
    case TokenSaleState.ACTIVE:
      return 'color-green-400';
    case TokenSaleState.SUCCEEDED:
      return 'color-lilac-100';
    case TokenSaleState.FAILED:
      return 'color-error-400';
    default:
      return 'color-neutral-400';
  }
};

export function TokenSaleDevModal({ isOpen, onClose, tokenSale }: TokenSaleDevModalProps) {
  const { data: walletClient } = useNetworkWalletClient();
  const { address: account } = useAccount();
  const { fetchERC20TokenAccountData } = useGovernanceFetcher();

  const {
    getVerificationSignature,
    verificationSignature,
    isLoading: verificationLoading,
  } = useTokenSaleVerification();

  const {
    increaseCommitmentNative,
    increaseCommitmentERC20,
    buyerSettle,
    sellerSettle,
    isLoading: contractLoading,
  } = useTokenSaleContract();

  const [approveCall, approveCallPending] = useTransaction();

  const [nativeAmount, setNativeAmount] = useState('0.01');
  const [erc20Amount, setErc20Amount] = useState('100');
  const [recipientAddress, setRecipientAddress] = useState('');

  // Commitment token data
  const [commitmentTokenBalance, setCommitmentTokenBalance] = useState(0n);
  const [commitmentTokenAllowance, setCommitmentTokenAllowance] = useState(0n);
  const commitmentTokenDecimals = 6; // Default to USDC decimals

  // Fetch commitment token data
  const fetchCommitmentTokenData = useCallback(async () => {
    if (!account || !tokenSale.commitmentToken) return;

    try {
      const tokenData = await fetchERC20TokenAccountData(
        tokenSale.commitmentToken,
        account,
        tokenSale.address,
      );
      setCommitmentTokenBalance(tokenData.balance);
      setCommitmentTokenAllowance(tokenData.allowance);
    } catch (error) {
      console.error('Error fetching commitment token data:', error);
    }
  }, [account, tokenSale.commitmentToken, tokenSale.address, fetchERC20TokenAccountData]);

  // Fetch token data when component mounts or token sale changes
  useEffect(() => {
    if (isOpen && account) {
      fetchCommitmentTokenData();
    }
  }, [isOpen, account, fetchCommitmentTokenData]);

  const getErrorMessage = (error: any): string => {
    const message = error?.message || 'Unknown error occurred';

    // Just return the message as-is, it's already user-friendly from the API
    return message;
  };

  const handleApproveCommitmentToken = async () => {
    if (!walletClient?.account || !tokenSale.commitmentToken) {
      toast.error('Wallet not connected');
      return;
    }

    try {
      const { getContract, maxUint256 } = await import('viem');
      const { abis } = await import('@decentdao/decent-contracts');

      const tokenContract = getContract({
        address: tokenSale.commitmentToken,
        abi: abis.deployables.VotesERC20V1,
        client: walletClient,
      });

      approveCall({
        contractFn: () => tokenContract.write.approve([tokenSale.address, maxUint256]),
        pendingMessage: 'Approving commitment token...',
        successMessage: 'Commitment token approved successfully',
        failedMessage: 'Failed to approve commitment token',
        successCallback: () => {
          fetchCommitmentTokenData(); // Refresh token data
        },
      });
    } catch (error: any) {
      console.error('Error approving commitment token:', error);
      toast.error('Approval Failed', {
        description: getErrorMessage(error),
      });
    }
  };

  const handleGetVerificationSignature = async () => {
    if (!walletClient?.account) {
      toast.error('Wallet not connected');
      return;
    }

    try {
      await getVerificationSignature(tokenSale.address, walletClient.account.address);
      toast.success('Verification signature obtained', {
        description: verificationSignature
          ? `Expires at: ${new Date(verificationSignature.expiration * 1000).toLocaleString()}`
          : undefined,
      });
    } catch (error: any) {
      console.error('Error getting verification signature:', error);
      toast.error('Verification Failed', {
        description: getErrorMessage(error),
      });
    }
  };

  const handleIncreaseCommitmentNative = async () => {
    if (!verificationSignature?.signature || !verificationSignature?.expiration) {
      toast.warning('Please get verification signature first');
      return;
    }

    try {
      await increaseCommitmentNative({
        tokenSaleAddress: tokenSale.address,
        verificationSignature: verificationSignature.signature,
        signatureExpiration: verificationSignature.expiration,
        amount: nativeAmount,
      });
      toast.success('Native token commitment increased successfully');
    } catch (error: any) {
      console.error('Error increasing commitment with native token:', error);
      toast.error('Commitment Failed', {
        description: getErrorMessage(error),
      });
    }
  };

  const handleIncreaseCommitmentERC20 = async () => {
    if (!verificationSignature?.signature || !verificationSignature?.expiration) {
      toast.warning('Please get verification signature first');
      return;
    }

    if (!walletClient?.account) {
      toast.error('Wallet not connected');
      return;
    }

    // Check if user has sufficient balance
    const amountWei = parseUnits(erc20Amount, commitmentTokenDecimals);
    if (amountWei > commitmentTokenBalance) {
      toast.error('Insufficient balance');
      return;
    }

    // Check if approval is needed
    const needsApproval = amountWei > commitmentTokenAllowance;

    if (needsApproval) {
      toast.warning('Please approve the commitment token first');
      return;
    }

    try {
      await increaseCommitmentERC20({
        tokenSaleAddress: tokenSale.address,
        verificationSignature: verificationSignature.signature,
        signatureExpiration: verificationSignature.expiration,
        amount: erc20Amount,
      });
      toast.success('ERC20 commitment increased successfully');
      // Refresh token data after successful commitment
      fetchCommitmentTokenData();
    } catch (error: any) {
      console.error('Error increasing commitment with ERC20 token:', error);
      toast.error('Commitment Failed', {
        description: getErrorMessage(error),
      });
    }
  };

  const handleBuyerSettle = async () => {
    if (!recipientAddress) {
      toast.warning('Please enter recipient address');
      return;
    }

    try {
      await buyerSettle({
        tokenSaleAddress: tokenSale.address,
        recipientAddress: recipientAddress as Address,
      });
      toast.success('Buyer settlement completed successfully');
    } catch (error: any) {
      console.error('Error settling as buyer:', error);
      toast.error('Settlement Failed', {
        description: getErrorMessage(error),
      });
    }
  };

  const handleSellerSettle = async () => {
    try {
      await sellerSettle({
        tokenSaleAddress: tokenSale.address,
      });
      toast.success('Seller settlement completed successfully');
    } catch (error: any) {
      console.error('Error settling as seller:', error);
      toast.error('Settlement Failed', {
        description: getErrorMessage(error),
      });
    }
  };

  return (
    <ModalBase
      isOpen={isOpen}
      onClose={onClose}
      title="Token Sale Dev Menu"
      isCentered={false}
      size="2xl"
    >
      <VStack
        spacing={6}
        align="stretch"
      >
        {/* Verification Section */}
        <Box>
          <HStack mb={4}>
            <Icon
              as={CheckCircle}
              color="color-lilac-100"
            />
            <Text
              textStyle="text-lg-semibold"
              color="color-white"
            >
              Verification
            </Text>
          </HStack>
          <VStack
            spacing={4}
            align="stretch"
          >
            <Button
              onClick={handleGetVerificationSignature}
              isLoading={verificationLoading}
              loadingText="Getting signature..."
              variant="primary"
              leftIcon={<Wrench />}
            >
              Get Verification Signature
            </Button>

            {verificationSignature?.signature && (
              <Box
                p={4}
                bg="color-neutral-900"
                borderRadius="0.75rem"
                border="1px solid"
                borderColor="color-neutral-800"
              >
                <Text
                  textStyle="text-sm-medium"
                  mb={3}
                  color="color-lilac-100"
                >
                  Verification Signature:
                </Text>
                <Code
                  p={3}
                  fontSize="xs"
                  wordBreak="break-all"
                  bg="color-neutral-950"
                  color="color-neutral-200"
                  borderRadius="0.5rem"
                  display="block"
                >
                  {verificationSignature.signature}
                </Code>
                <HStack
                  mt={3}
                  spacing={4}
                >
                  {verificationSignature?.expiration && (
                    <Text
                      textStyle="text-xs"
                      color="color-neutral-400"
                    >
                      Expires: {new Date(verificationSignature.expiration * 1000).toLocaleString()}
                    </Text>
                  )}
                  {verificationSignature?.signature !== undefined && (
                    <Text
                      textStyle="text-xs"
                      color="color-neutral-400"
                    >
                      Verified: {verificationSignature.signature ? 'Yes' : 'No'}
                    </Text>
                  )}
                </HStack>
              </Box>
            )}
          </VStack>
        </Box>

        <Divider />

        {/* Commitment Section */}
        <Box>
          <HStack mb={4}>
            <Icon
              as={CurrencyEth}
              color="color-lilac-100"
            />
            <Text
              textStyle="text-lg-semibold"
              color="color-white"
            >
              Commitment Functions
            </Text>
          </HStack>
          <VStack
            spacing={4}
            align="stretch"
          >
            {/* Native Token Commitment */}
            <Box>
              <FormControl>
                <FormLabel fontSize="sm">Native Token Amount (ETH)</FormLabel>
                <Input
                  value={nativeAmount}
                  onChange={e => setNativeAmount(e.target.value)}
                  placeholder="0.01"
                />
              </FormControl>
              <Button
                onClick={handleIncreaseCommitmentNative}
                isLoading={contractLoading.increaseCommitmentNative}
                loadingText="Calling..."
                variant="secondary"
                leftIcon={<CurrencyEth />}
                width="100%"
                mt={2}
              >
                increaseCommitmentNative
              </Button>
            </Box>

            {/* ERC20 Token Commitment */}
            <Box>
              <FormControl>
                <FormLabel fontSize="sm">ERC20 Amount (USDC)</FormLabel>
                <Input
                  value={erc20Amount}
                  onChange={e => setErc20Amount(e.target.value)}
                  placeholder="100"
                />
              </FormControl>

              {/* Token Balance and Allowance Info */}
              <Box
                p={3}
                bg="color-neutral-900"
                borderRadius="0.5rem"
                border="1px solid"
                borderColor="color-neutral-800"
                mt={2}
              >
                <VStack
                  spacing={2}
                  align="stretch"
                >
                  <HStack justify="space-between">
                    <Text
                      fontSize="xs"
                      color="color-neutral-400"
                    >
                      Balance:
                    </Text>
                    <Text
                      fontSize="xs"
                      color="color-neutral-200"
                    >
                      {formatUnits(commitmentTokenBalance, commitmentTokenDecimals)} USDC
                    </Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text
                      fontSize="xs"
                      color="color-neutral-400"
                    >
                      Allowance:
                    </Text>
                    <Text
                      fontSize="xs"
                      color="color-neutral-200"
                    >
                      {formatUnits(commitmentTokenAllowance, commitmentTokenDecimals)} USDC
                    </Text>
                  </HStack>
                </VStack>
              </Box>

              {/* Approval Button */}
              {parseUnits(erc20Amount || '0', commitmentTokenDecimals) >
                commitmentTokenAllowance && (
                <Button
                  onClick={handleApproveCommitmentToken}
                  isLoading={approveCallPending}
                  loadingText="Approving..."
                  variant="outline"
                  leftIcon={<CheckCircle />}
                  width="100%"
                  mt={2}
                  colorScheme="blue"
                >
                  Approve Commitment Token
                </Button>
              )}

              <Button
                onClick={handleIncreaseCommitmentERC20}
                isLoading={contractLoading.increaseCommitmentERC20}
                loadingText="Calling..."
                variant="secondary"
                leftIcon={<Coins />}
                width="100%"
                mt={2}
                isDisabled={
                  parseUnits(erc20Amount || '0', commitmentTokenDecimals) > commitmentTokenAllowance
                }
              >
                increaseCommitmentERC20
              </Button>
            </Box>
          </VStack>
        </Box>

        <Divider />

        {/* Settlement Section */}
        <Box>
          <HStack mb={4}>
            <Icon
              as={Handshake}
              color="color-lilac-100"
            />
            <Text
              textStyle="text-lg-semibold"
              color="color-white"
            >
              Settlement Functions
            </Text>
          </HStack>
          <VStack
            spacing={4}
            align="stretch"
          >
            {/* Buyer Settlement */}
            <Box>
              <FormControl>
                <FormLabel fontSize="sm">Recipient Address (for buyerSettle)</FormLabel>
                <Input
                  value={recipientAddress}
                  onChange={e => setRecipientAddress(e.target.value)}
                  placeholder="0x..."
                />
              </FormControl>
              <Button
                onClick={handleBuyerSettle}
                isLoading={contractLoading.buyerSettle}
                loadingText="Calling..."
                leftIcon={<Handshake />}
                width="100%"
                mt={2}
              >
                buyerSettle
              </Button>
            </Box>

            {/* Seller Settlement */}
            <Box>
              <FormControl>
                <FormLabel fontSize="sm">Seller Settlement</FormLabel>
              </FormControl>
              <Button
                onClick={handleSellerSettle}
                isLoading={contractLoading.sellerSettle}
                loadingText="Calling..."
                leftIcon={<UserMinus />}
                width="100%"
              >
                sellerSettle
              </Button>
            </Box>
          </VStack>
        </Box>

        {/* Token Sale Info */}
        <Box>
          <HStack mb={4}>
            <Icon
              as={Info}
              color="color-lilac-100"
            />
            <Text
              textStyle="text-lg-semibold"
              color="color-white"
            >
              Token Sale Info
            </Text>
          </HStack>
          <Box
            p={4}
            bg="color-neutral-900"
            borderRadius="0.75rem"
            border="1px solid"
            borderColor="color-neutral-800"
          >
            <Grid
              templateColumns="1fr 1fr"
              gap={4}
            >
              <GridItem>
                <Text
                  textStyle="text-sm-medium"
                  color="color-neutral-400"
                  mb={1}
                >
                  Sale Address
                </Text>
                <Code
                  p={2}
                  fontSize="xs"
                  wordBreak="break-all"
                  bg="color-neutral-950"
                  color="color-neutral-200"
                  borderRadius="0.375rem"
                  display="block"
                >
                  {tokenSale.address}
                </Code>
              </GridItem>

              <GridItem>
                <Text
                  textStyle="text-sm-medium"
                  color="color-neutral-400"
                  mb={1}
                >
                  Sale Token
                </Text>
                <Code
                  p={2}
                  fontSize="xs"
                  wordBreak="break-all"
                  bg="color-neutral-950"
                  color="color-neutral-200"
                  borderRadius="0.375rem"
                  display="block"
                >
                  {tokenSale.saleToken}
                </Code>
              </GridItem>

              <GridItem>
                <Text
                  textStyle="text-sm-medium"
                  color="color-neutral-400"
                  mb={1}
                >
                  Commitment Token
                </Text>
                <Code
                  p={2}
                  fontSize="xs"
                  wordBreak="break-all"
                  bg="color-neutral-950"
                  color="color-neutral-200"
                  borderRadius="0.375rem"
                  display="block"
                >
                  {tokenSale.commitmentToken}
                </Code>
              </GridItem>

              <GridItem>
                <Text
                  textStyle="text-sm-medium"
                  color="color-neutral-400"
                  mb={1}
                >
                  Sale State
                </Text>
                <Text
                  textStyle="text-sm"
                  color={getSaleStateColor(tokenSale.saleState)}
                  fontWeight="medium"
                >
                  {getSaleStateText(tokenSale.saleState)}
                </Text>
              </GridItem>
            </Grid>
          </Box>
        </Box>
      </VStack>
    </ModalBase>
  );
}
