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
import { useTokenSaleFormPreparation } from './hooks/useTokenSaleFormPreparation';
import { TokenSaleFormValues } from './types';

const stages = ['Sale Terms', 'Buyer Requirements'];
const initialValues: TokenSaleFormValues = {
  // Project Overview
  saleName: 'DecentDAO Token Sale',

  // Token Details
  tokenAddress: '',
  tokenName: '',
  tokenSymbol: '',
  maxTokenSupply: { value: '', bigintValue: undefined },
  tokenPrice: 0,

  // Sale Timing
  startDate: new Date(Date.now() + 86400 * 1000), // Start in 24 hours
  endDate: new Date(Date.now() + 86400 * 30 * 1000), // End in 30 days

  // Sale Pricing & Terms
  minimumFundraise: 5, // $5 minimum
  fundraisingCap: 9500, // $9,500 maximum
  valuation: 0,
  minPurchase: 1, // $1 minimum purchase
  maxPurchase: 50, // $50 maximum purchase

  // TODO hardcoded to a sepolia token (SUSDC) for testing
  commitmentToken: '0x0A7ECA73Bfecbc20fc73FE9Af480D12306d39e34', // Will be set based on acceptedToken
  verifier: null, // Will be set from network config
  saleProceedsReceiver: null, // Will be set to DAO address
  // TODO this need to be set to specific address for base, sepolia, ethereum mainnet
  protocolFeeReceiver: '0x629750317d320B8bB4d48D345A6d699Cc855c4a6' as Address,
  minimumCommitment: { value: '1', bigintValue: BigInt('1000000') }, // $1 USDC (6 decimals)
  maximumCommitment: { value: '50', bigintValue: BigInt('50000000') }, // $50 USDC
  minimumTotalCommitment: { value: '5', bigintValue: BigInt('5000000') }, // $5 USDC
  maximumTotalCommitment: { value: '9500', bigintValue: BigInt('9500000000') }, // $9,500 USDC
  saleTokenPrice: { value: '1.00', bigintValue: BigInt('1000000') }, // $1.00 per token (USDC 6 decimals)
  commitmentTokenProtocolFee: { value: '5', bigintValue: BigInt('50000000000000000') }, // 5% (18 decimal precision)
  saleTokenProtocolFee: { value: '5', bigintValue: BigInt('50000000000000000') }, // 5%
  saleTokenHolder: null, // Will be set to DAO address

  // Hedgey Lockup Configuration (disabled by default)
  hedgeyLockupEnabled: false,
  hedgeyLockupStart: { value: '0', bigintValue: 0n },
  hedgeyLockupCliff: { value: '0', bigintValue: 0n },
  hedgeyLockupRatePercentage: { value: '0', bigintValue: 0n },
  hedgeyLockupPeriod: { value: '0', bigintValue: 0n },
  hedgeyVotingTokenLockupPlans: '0x0000000000000000000000000000000000000000' as Address,

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
  const { prepareFormData } = useTokenSaleFormPreparation();

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

    // Prepare form data for submission
    let tokenSaleData;
    try {
      tokenSaleData = prepareFormData(values);
      if (!tokenSaleData) {
        throw new Error('Failed to prepare form data');
      }
    } catch (error) {
      console.error('Error preparing form data:', error);
      return;
    }

    const txs: CreateProposalTransaction[] = [];

    try {
      // Debug: Log the escrow calculation
      const escrowAmount =
        (tokenSaleData.maximumTotalCommitment *
          (BigInt('1000000000000000000') + tokenSaleData.saleTokenProtocolFee)) /
        tokenSaleData.saleTokenPrice;
      // 1. Generate nonce for deployment
      const tokenSaleNonce = getRandomBytes();

      // 2. Encode the initialization data first
      const encodedSetupTokenSaleData = encodeFunctionData({
        abi: abis.deployables.TokenSaleV1,
        functionName: 'initialize',
        args: [
          {
            saleStartTimestamp: tokenSaleData.saleStartTimestamp,
            saleEndTimestamp: tokenSaleData.saleEndTimestamp,
            commitmentToken: tokenSaleData.commitmentToken,
            saleToken: tokenSaleData.saleToken,
            verifier: tokenSaleData.verifier,
            saleProceedsReceiver: tokenSaleData.saleProceedsReceiver,
            protocolFeeReceiver: tokenSaleData.protocolFeeReceiver,
            minimumCommitment: tokenSaleData.minimumCommitment,
            maximumCommitment: tokenSaleData.maximumCommitment,
            minimumTotalCommitment: tokenSaleData.minimumTotalCommitment,
            maximumTotalCommitment: tokenSaleData.maximumTotalCommitment,
            saleTokenPrice: tokenSaleData.saleTokenPrice,
            commitmentTokenProtocolFee: tokenSaleData.commitmentTokenProtocolFee,
            saleTokenProtocolFee: tokenSaleData.saleTokenProtocolFee,
            saleTokenHolder: tokenSaleData.saleTokenHolder,
            hedgeyLockupParams: tokenSaleData.hedgeyLockupParams,
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
        targetAddress: tokenSaleData.saleToken,
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
        name: tokenSaleData.saleName,
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
