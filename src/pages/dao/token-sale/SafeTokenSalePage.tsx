import { Box, Button, Flex, VStack } from '@chakra-ui/react';
import { Formik, Form } from 'formik';
import { useState } from 'react';
import PageHeader from '../../../components/ui/page/Header/PageHeader';
import { CONTENT_MAXW } from '../../../constants/common';
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

export function SafeTokenSalePage() {
  const [currentStage, setCurrentStage] = useState(0);

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
    // Handle form submission logic here
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

                <Button
                  variant="primary"
                  onClick={currentStage === stages.length - 1 ? undefined : handleNext}
                  type={currentStage === stages.length - 1 ? 'submit' : 'button'}
                >
                  {currentStage === stages.length - 1 ? 'Create Token Sale' : 'Continue'}
                </Button>
              </Flex>
            </VStack>
          </Form>
        )}
      </Formik>
    </Box>
  );
}
