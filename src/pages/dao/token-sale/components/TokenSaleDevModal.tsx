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
import { useState } from 'react';
import { toast } from 'sonner';
import { Address } from 'viem';
import { ModalBase } from '../../../../components/ui/modals/ModalBase';
import { useTokenSaleContract } from '../../../../hooks/DAO/tokenSale/useTokenSaleContract';
import { useTokenSaleVerification } from '../../../../hooks/DAO/tokenSale/useTokenSaleVerification';
import { useNetworkWalletClient } from '../../../../hooks/useNetworkWalletClient';
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

  const {
    getVerificationSignature,
    verificationSignature,
    isLoading: verificationLoading,
  } = useTokenSaleVerification();

  const {
    increaseCommitmentERC20,
    buyerSettle,
    sellerSettle,
    isLoading: contractLoading,
  } = useTokenSaleContract();

  const [erc20Amount, setErc20Amount] = useState('100');
  const [recipientAddress, setRecipientAddress] = useState('');

  const getErrorMessage = (error: any): string => {
    const message = error?.message || 'Unknown error occurred';

    // Just return the message as-is, it's already user-friendly from the API
    return message;
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
          ? `Expires at: ${new Date(verificationSignature.data.expiration * 1000).toLocaleString()}`
          : undefined,
      });
    } catch (error: any) {
      console.error('Error getting verification signature:', error);
      toast.error('Verification Failed', {
        description: getErrorMessage(error),
      });
    }
  };
  // @dev not implemented
  // const handleIncreaseCommitmentNative = async () => {
  //   if (!verificationSignature?.signature || !verificationSignature?.data.expiration) {
  //     toast({
  //       title: 'Please get verification signature first',
  //       status: 'warning',
  //       duration: 3000,
  //     });
  //     return;
  //   }

  //   try {
  //     await increaseCommitmentNative({
  //       tokenSaleAddress: tokenSale.address,
  //       verificationSignature: verificationSignature.signature,
  //       signatureExpiration: verificationSignature.data.expiration,
  //       amount: nativeAmount,
  //     });
  //   } catch (error) {
  //     console.error('Error increasing commitment with native token:', error);
  //   }
  // };

  const handleIncreaseCommitmentERC20 = async () => {
    if (!verificationSignature?.signature || !verificationSignature?.data.expiration) {
      toast.warning('Please get verification signature first');
      return;
    }

    try {
      await increaseCommitmentERC20({
        tokenSaleAddress: tokenSale.address,
        verificationSignature: verificationSignature.signature,
        signatureExpiration: verificationSignature.data.expiration,
        amount: erc20Amount,
      });
      toast.success('ERC20 commitment increased successfully');
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
                  {verificationSignature?.data.expiration && (
                    <Text
                      textStyle="text-xs"
                      color="color-neutral-400"
                    >
                      Expires:{' '}
                      {new Date(verificationSignature.data.expiration * 1000).toLocaleString()}
                    </Text>
                  )}
                  {verificationSignature?.data.verified !== undefined && (
                    <Text
                      textStyle="text-xs"
                      color="color-neutral-400"
                    >
                      Verified: {verificationSignature.data.verified ? 'Yes' : 'No'}
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
            {/* <Box>
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
            </Box> */}

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
              <Button
                onClick={handleIncreaseCommitmentERC20}
                isLoading={contractLoading.increaseCommitmentERC20}
                loadingText="Calling..."
                variant="secondary"
                leftIcon={<Coins />}
                width="100%"
                mt={2}
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
