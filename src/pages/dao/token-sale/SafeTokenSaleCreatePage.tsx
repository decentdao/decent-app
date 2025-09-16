import { Box, Button, Flex, VStack } from '@chakra-ui/react';
import { abis, legacy } from '@decentdao/decent-contracts';
import { Formik, Form } from 'formik';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Address, encodeFunctionData, encodePacked, getCreate2Address, keccak256 } from 'viem';
import { ZodiacModuleProxyFactoryAbi } from '../../../assets/abi/ZodiacModuleProxyFactoryAbi';
import PageHeader from '../../../components/ui/page/Header/PageHeader';
import { CONTENT_MAXW } from '../../../constants/common';
import { DAO_ROUTES } from '../../../constants/routes';
import { getRandomBytes } from '../../../helpers';
import { useCurrentDAOKey } from '../../../hooks/DAO/useCurrentDAOKey';
import { generateContractByteCodeLinear, generateSalt } from '../../../models/helpers/utils';
import { useDAOStore } from '../../../providers/App/AppProvider';
import { useNetworkConfigStore } from '../../../providers/NetworkConfig/useNetworkConfigStore';
import { useProposalActionsStore } from '../../../store/actions/useProposalActionsStore';
import { CreateProposalTransaction, ProposalActionType } from '../../../types';
import { BuyerRequirementsForm } from './components/BuyerRequirementsForm';
import { SaleTermsForm } from './components/SaleTermsForm';
import { TokenSaleFormValues } from './types';

const stages = ['Sale Terms', 'Buyer Requirements'];
const initialValues: TokenSaleFormValues = {
  saleName: '',

  // Token Details
  tokenName: '',
  tokenSymbol: '',
  maxTokenSupply: { value: '', bigintValue: undefined },
  tokenPrice: 0,

  // Sale Pricing & Terms
  minimumFundraise: 0,
  fundraisingCap: 0,
  valuation: 0,
  startDate: null,
  acceptedToken: [],
  minPurchase: 0,
  maxPurchase: 0,

  // Legacy fields
  endDate: null,
  totalSupply: '',
  salePrice: '',
  whitelistAddress: '',
  kycProvider: '',
};

export function SafeTokenSaleCreatePage() {
  const [currentStage, setCurrentStage] = useState(0);
  const {
    contracts: { tokenSaleV1MasterCopy, keyValuePairs, zodiacModuleProxyFactory, decentVerifierV1 },
  } = useNetworkConfigStore();

  const { daoKey } = useCurrentDAOKey();
  const {
    node: { safe },
  } = useDAOStore({ daoKey });
  const { addAction, resetActions } = useProposalActionsStore();
  const navigate = useNavigate();
  const { addressPrefix } = useNetworkConfigStore();

  const handleNext = () => {
    if (currentStage < stages.length - 1) {
      setCurrentStage(currentStage + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStage > 0) {
      setCurrentStage(currentStage - 1);
    }
  };

  const handleSubmit = (values: TokenSaleFormValues) => {
    console.log('Form submitted:', values);
    if (!safe?.address) {
      throw new Error('Safe address is not set');
    }
    if (
      !tokenSaleV1MasterCopy ||
      !keyValuePairs ||
      !zodiacModuleProxyFactory ||
      !decentVerifierV1
    ) {
      console.error('Required contract addresses not available');
      return;
    }

    // Mock data for token sale deployment
    const mockTokenSaleData = {
      saleName: 'DecentDAO Token Sale',
      saleStartTimestamp: Math.floor(Date.now() / 1000) + 86400, // Start in 24 hours
      saleEndTimestamp: Math.floor(Date.now() / 1000) + 86400 * 30, // End in 30 days
      commitmentToken: '0x0A7ECA73Bfecbc20fc73FE9Af480D12306d39e34' as Address, // USDC on mainnet
      saleToken: '0x0A7ECA73Bfecbc20fc73FE9Af480D12306d39e34' as Address, // Will be set to actual token address
      verifier: decentVerifierV1,
      saleProceedsReceiver: safe.address, // DAO address
      protocolFeeReceiver: '0x629750317d320B8bB4d48D345A6d699Cc855c4a6' as Address, // Protocol fee receiver
      minimumCommitment: BigInt('1000000'), // $1 USDC (6 decimals)
      maximumCommitment: BigInt('50000000'), // $50 USDC
      minimumTotalCommitment: BigInt('5000000'), // $5 USDC
      maximumTotalCommitment: BigInt('9500000000'), // $9,500 USDC (will need ~9,975 tokens to escrow)
      saleTokenPrice: BigInt('1000000'), // $1.00 per token (USDC has 6 decimals, so 1.0 * 10^6)
      commitmentTokenProtocolFee: BigInt('50000000000000000'), // 5% (18 decimal precision)
      saleTokenProtocolFee: BigInt('50000000000000000'), // 5%
      saleTokenHolder: safe.address, // DAO address - must hold the sale tokens
      hedgeyLockupParams: {
        enabled: false,
        start: 0n,
        cliff: 0n,
        ratePercentage: 0n,
        period: 0n,
        votingTokenLockupPlans: '0x0000000000000000000000000000000000000000' as Address,
      },
    };

    const txs: CreateProposalTransaction[] = [];

    try {
      // Debug: Log the escrow calculation
      const escrowAmount =
        (mockTokenSaleData.maximumTotalCommitment *
          (BigInt('1000000000000000000') + mockTokenSaleData.saleTokenProtocolFee)) /
        mockTokenSaleData.saleTokenPrice;
      console.log('Escrow amount needed:', escrowAmount.toString(), 'tokens');
      console.log('Sale token holder:', mockTokenSaleData.saleTokenHolder);
      console.log('Sale token address:', mockTokenSaleData.saleToken);

      // 1. Generate nonce for deployment
      const tokenSaleNonce = getRandomBytes();

      // 2. Encode the initialization data first
      const encodedSetupTokenSaleData = encodeFunctionData({
        abi: abis.deployables.TokenSaleV1,
        functionName: 'initialize',
        args: [
          {
            saleStartTimestamp: mockTokenSaleData.saleStartTimestamp,
            saleEndTimestamp: mockTokenSaleData.saleEndTimestamp,
            commitmentToken: mockTokenSaleData.commitmentToken,
            saleToken: mockTokenSaleData.saleToken,
            verifier: mockTokenSaleData.verifier,
            saleProceedsReceiver: mockTokenSaleData.saleProceedsReceiver,
            protocolFeeReceiver: mockTokenSaleData.protocolFeeReceiver,
            minimumCommitment: mockTokenSaleData.minimumCommitment,
            maximumCommitment: mockTokenSaleData.maximumCommitment,
            minimumTotalCommitment: mockTokenSaleData.minimumTotalCommitment,
            maximumTotalCommitment: mockTokenSaleData.maximumTotalCommitment,
            saleTokenPrice: mockTokenSaleData.saleTokenPrice,
            commitmentTokenProtocolFee: mockTokenSaleData.commitmentTokenProtocolFee,
            saleTokenProtocolFee: mockTokenSaleData.saleTokenProtocolFee,
            saleTokenHolder: mockTokenSaleData.saleTokenHolder,
            hedgeyLockupParams: mockTokenSaleData.hedgeyLockupParams,
          },
        ],
      });

      // 3. Calculate predicted TokenSale address
      const tokenSaleByteCodeLinear = generateContractByteCodeLinear(tokenSaleV1MasterCopy);
      const tokenSaleSalt = generateSalt(encodedSetupTokenSaleData, tokenSaleNonce);
      const predictedTokenSaleAddress = getCreate2Address({
        from: zodiacModuleProxyFactory,
        salt: tokenSaleSalt,
        bytecodeHash: keccak256(encodePacked(['bytes'], [tokenSaleByteCodeLinear])),
      });

      // 4. Add approval transaction for the predicted TokenSale contract
      txs.push({
        targetAddress: mockTokenSaleData.saleToken,
        ethValue: {
          bigintValue: 0n,
          value: '0',
        },
        calldata: encodeFunctionData({
          abi: legacy.abis.VotesERC20,
          functionName: 'approve',
          args: [predictedTokenSaleAddress, escrowAmount],
        }),
        functionName: 'approve',
        parameters: [
          {
            signature: 'address',
            value: predictedTokenSaleAddress,
          },
          {
            signature: 'uint256',
            value: escrowAmount.toString(),
          },
        ],
      });

      const deployModuleCalldata = encodeFunctionData({
        abi: ZodiacModuleProxyFactoryAbi,
        functionName: 'deployModule',
        args: [tokenSaleV1MasterCopy, encodedSetupTokenSaleData, tokenSaleNonce],
      });
      // Add TokenSale deployment transaction
      txs.push({
        targetAddress: zodiacModuleProxyFactory,
        ethValue: {
          bigintValue: 0n,
          value: '0',
        },
        functionName: 'deployModule',
        calldata: deployModuleCalldata,
        parameters: [
          {
            signature: 'address',
            value: tokenSaleV1MasterCopy,
          },
          {
            signature: 'bytes',
            value: encodedSetupTokenSaleData,
          },
          {
            signature: 'uint256',
            value: tokenSaleNonce.toString(),
          },
        ],
      });

      // 2. Update KeyValuePairs with new token sale info
      const tokenSaleMetadata = {
        address: predictedTokenSaleAddress,
        name: mockTokenSaleData.saleName,
      };

      const updateValuesCalldata = encodeFunctionData({
        abi: legacy.abis.KeyValuePairs,
        functionName: 'updateValues',
        args: [['newtokensale'], [JSON.stringify(tokenSaleMetadata)]],
      });

      txs.push({
        targetAddress: keyValuePairs,
        ethValue: {
          bigintValue: 0n,
          value: '0',
        },
        functionName: 'updateValues',
        calldata: updateValuesCalldata,
        parameters: [
          {
            signature: 'string[]',
            valueArray: ['newtokensale'],
          },
          {
            signature: 'string[]',
            valueArray: [JSON.stringify(tokenSaleMetadata)],
          },
        ],
      });

      console.log('Token Sale Deployment Transactions:', txs);
      console.log('Predicted Token Sale Address:', predictedTokenSaleAddress);

      // Add token sale deployment action to proposal actions store
      resetActions();
      addAction({
        actionType: ProposalActionType.EDIT,
        transactions: txs,
        content: <>Token Sale Deployment</>,
      });

      // Navigate to proposal creation page with actions
      navigate(DAO_ROUTES.proposalWithActionsNew.relative(addressPrefix, safe.address));
    } catch (error) {
      console.error('Error creating token sale deployment transactions:', error);
    }
  };

  const renderCurrentStage = (values: TokenSaleFormValues, setFieldValue: any) => {
    switch (currentStage) {
      case 0:
        return (
          <SaleTermsForm
            values={values}
            setFieldValue={setFieldValue}
          />
        );
      case 1:
        return (
          <BuyerRequirementsForm
            values={values}
            setFieldValue={setFieldValue}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Box
      maxW={CONTENT_MAXW}
      mx="auto"
    >
      <PageHeader
        breadcrumbs={[
          {
            terminus: 'Token Sale',
            path: DAO_ROUTES.tokenSale.relative(addressPrefix, safe?.address || ''),
          },
          {
            terminus: 'Create New Sale',
            path: '',
          },
        ]}
      />

      <Formik
        initialValues={initialValues}
        onSubmit={handleSubmit}
      >
        {({ values, setFieldValue }) => (
          <Form>
            <VStack
              spacing={8}
              align="stretch"
            >
              {renderCurrentStage(values, setFieldValue)}

              <Flex
                justify="space-between"
                pt={6}
              >
                <Button
                  variant="secondary"
                  onClick={handlePrevious}
                  isDisabled={currentStage === 0}
                >
                  Previous
                </Button>
                {currentStage !== stages.length - 1 ? (
                  <Button
                    onClick={e => {
                      e.preventDefault();
                      handleNext();
                    }}
                    type="button"
                  >
                    Continue
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    type="submit"
                  >
                    Create Token Sale
                  </Button>
                )}
              </Flex>
            </VStack>
          </Form>
        )}
      </Formik>
    </Box>
  );
}
