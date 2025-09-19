import { Box, Button, Flex, VStack } from '@chakra-ui/react';
import { abis, legacy } from '@decentdao/decent-contracts';
import { Formik, Form } from 'formik';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Address, encodeFunctionData, encodePacked, getCreate2Address, keccak256 } from 'viem';
import { ZodiacModuleProxyFactoryAbi } from '../../../assets/abi/ZodiacModuleProxyFactoryAbi';
import { InfoBoxLoader } from '../../../components/ui/loaders/InfoBoxLoader';
import PageHeader from '../../../components/ui/page/Header/PageHeader';
import { CONTENT_MAXW } from '../../../constants/common';
import { DAO_ROUTES } from '../../../constants/routes';
import { getRandomBytes } from '../../../helpers';
import { logError } from '../../../helpers/errorLogging';
import { useCurrentDAOKey } from '../../../hooks/DAO/useCurrentDAOKey';
import { useTokenSaleSchema } from '../../../hooks/schemas/useTokenSaleSchema';
import { generateContractByteCodeLinear, generateSalt } from '../../../models/helpers/utils';
import { useDAOStore } from '../../../providers/App/AppProvider';
import { useNetworkConfigStore } from '../../../providers/NetworkConfig/useNetworkConfigStore';
import { useProposalActionsStore } from '../../../store/actions/useProposalActionsStore';
import { CreateProposalTransaction, ProposalActionType } from '../../../types';
import { TokenSaleFormValues } from '../../../types/tokenSale';
import { BuyerRequirementsForm } from './components/BuyerRequirementsForm';
import { SaleTermsForm } from './components/SaleTermsForm';
import { useTokenSaleFormPreparation } from './hooks/useTokenSaleFormPreparation';

const stages = ['Sale Terms', 'Buyer Requirements'];

// todo remove mocked values
const getInitialValues = (usdcAddress?: Address): TokenSaleFormValues => ({
  // @dev these values are calculated in the form
  saleTokenHolder: null, // Will be set to DAO address
  saleTokenPrice: { value: '', bigintValue: undefined }, // Will be calculated from FDV and token supply
  // TODO this need to be set to specific address for base, sepolia, ethereum mainnet
  protocolFeeReceiver: '0x629750317d320B8bB4d48D345A6d699Cc855c4a6' as Address,
  commitmentToken: usdcAddress || null, // Set to current network's USDC

  saleName: 'DecentDAO Token Sale',

  // Token Details
  tokenAddress: '',
  tokenName: '',
  tokenSymbol: '',
  maxTokenSupply: { value: '', bigintValue: undefined },

  // Sale Timing
  startDate: new Date(Date.now() + 86400 * 1000), // Start in 24 hours
  endDate: new Date(Date.now() + 86400 * 30 * 1000), // End in 30 days

  // Sale Pricing & Terms
  minimumFundraise: 5, // $5 minimum
  fundraisingCap: 9500, // $9,500 maximum
  valuation: 1000000,
  minPurchase: 1, // $1 minimum purchase
  maxPurchase: 50, // $50 maximum purchase

  verifier: null, // Will be set from network config
  saleProceedsReceiver: null, // Will be set to DAO address
  minimumCommitment: { value: '1', bigintValue: BigInt('1000000') }, // $1 USDC (6 decimals)
  maximumCommitment: { value: '50', bigintValue: BigInt('50000000') }, // $50 USDC
  minimumTotalCommitment: { value: '5', bigintValue: BigInt('5000000') }, // $5 USDC
  maximumTotalCommitment: { value: '9500', bigintValue: BigInt('9500000000') }, // $9,500 USDC
  commitmentTokenProtocolFee: { value: '5', bigintValue: BigInt('50000000000000000') }, // 5% (18 decimal precision)
  saleTokenProtocolFee: { value: '5', bigintValue: BigInt('50000000000000000') }, // 5%

  // Hedgey Lockup Configuration (disabled by default)
  hedgeyLockupEnabled: false,
  hedgeyLockupStart: { value: '0', bigintValue: 0n },
  hedgeyLockupCliff: { value: '0', bigintValue: 0n },
  hedgeyLockupRatePercentage: { value: '0', bigintValue: 0n },
  hedgeyLockupPeriod: { value: '0', bigintValue: 0n },
  hedgeyVotingTokenLockupPlans: '0x0000000000000000000000000000000000000000' as Address,

  // Buyer Requirements
  kycEnabled: false,
  buyerRequirements: [],
});

export function SafeTokenSaleCreatePage() {
  const { t } = useTranslation('tokenSale');
  const [currentStage, setCurrentStage] = useState(0);
  const {
    contracts: { tokenSaleV1MasterCopy, keyValuePairs, zodiacModuleProxyFactory, decentVerifierV1 },
    stablecoins,
  } = useNetworkConfigStore();

  const { daoKey } = useCurrentDAOKey();
  const {
    node: { safe },
  } = useDAOStore({ daoKey });
  const { addAction, resetActions } = useProposalActionsStore();
  const navigate = useNavigate();
  const { addressPrefix } = useNetworkConfigStore();
  const { prepareFormData } = useTokenSaleFormPreparation();
  const { tokenSaleValidationSchema } = useTokenSaleSchema();

  const handleNext = async (validateForm: () => Promise<any>) => {
    // Validate current stage before proceeding
    const errors = await validateForm();
    const hasErrors = Object.keys(errors).length > 0;

    if (!hasErrors && currentStage < stages.length - 1) {
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
      logError(error);
      return;
    }

    const txs: CreateProposalTransaction[] = [];

    try {
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
      const approvalCalldata = encodeFunctionData({
        abi: legacy.abis.VotesERC20,
        functionName: 'approve',
        args: [predictedTokenSaleAddress, tokenSaleData.saleTokenEscrowAmount],
      });
      txs.push({
        targetAddress: tokenSaleData.saleToken,
        ethValue: {
          bigintValue: 0n,
          value: '0',
        },
        calldata: approvalCalldata,
        functionName: 'approve',
        parameters: [
          {
            signature: 'address',
            value: predictedTokenSaleAddress,
          },
          {
            signature: 'uint256',
            value: tokenSaleData.saleTokenEscrowAmount.toString(),
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
      // todo update for api expected values; update fetcher and listener; update token sale details page
      console.log('🚀 ~ values.buyerRequirements:', values.buyerRequirements);
      const tokenSaleMetadata = {
        tokenSaleAddress: predictedTokenSaleAddress,
        saleName: tokenSaleData.saleName,
        buyerRequirements: values.buyerRequirements,
        kycEnabled: values.kycEnabled,
        kyc: {
          type: 'key',
          provider: 'sumsub',
        },
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
        content: <>{t('tokenSaleDeployment', { saleName: tokenSaleData.saleName })}</>,
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

  if (!safe?.address) {
    return <InfoBoxLoader />;
  }

  return (
    <Box
      maxW={CONTENT_MAXW}
      mx="auto"
    >
      <PageHeader
        breadcrumbs={[
          {
            terminus: t('tokenSaleBreadcrumb'),
            path: DAO_ROUTES.tokenSale.relative(addressPrefix, safe.address),
          },
          {
            terminus: t('createNewSaleBreadcrumb'),
            path: '',
          },
        ]}
      />

      <Formik
        initialValues={getInitialValues(stablecoins.usdc)}
        validationSchema={tokenSaleValidationSchema}
        onSubmit={handleSubmit}
      >
        {({ values, setFieldValue, validateForm }) => (
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
                  {t('previousButton')}
                </Button>
                {currentStage !== stages.length - 1 ? (
                  <Button
                    onClick={e => {
                      e.preventDefault();
                      handleNext(validateForm);
                    }}
                    type="button"
                  >
                    {t('continueButton')}
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    type="submit"
                  >
                    {t('createTokenSaleButton')}
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
