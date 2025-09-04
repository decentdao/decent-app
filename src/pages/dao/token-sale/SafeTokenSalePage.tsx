import { Box, Button, Flex, Grid, Icon, Input, InputGroup, InputLeftElement, NumberInput, NumberInputField, Text, VStack } from '@chakra-ui/react';
import { DiscordLogo, GithubLogo, Globe, TelegramLogo, XLogo } from '@phosphor-icons/react';
import { Formik, Form } from 'formik';
import { useState } from 'react';
import ContentBox from '../../../components/ui/containers/ContentBox';
import { DatePicker } from '../../../components/ui/forms/DatePicker';
import { InputComponent, LabelComponent, TextareaComponent } from '../../../components/ui/forms/InputComponent';
import PageHeader from '../../../components/ui/page/Header/PageHeader';
import { AssetSelector } from '../../../components/ui/utils/AssetSelector';
import { CONTENT_MAXW } from '../../../constants/common';

interface TokenSaleFormValues {
  // Project Overview
  projectName: string;
  projectDescription: string;
  websiteUrl: string;
  xHandle: string;
  githubLink: string;
  telegramGroup: string;
  discordServer: string;
  
  // Sale Terms
  startDate: Date | null;
  endDate: Date | null;
  totalSupply: string;
  salePrice: string;
  acceptedToken: string[];
  
  // Buyer Requirements
  minPurchase: string;
  maxPurchase: string;
  whitelistAddress: string;
  kycProvider: string;
}

const initialValues: TokenSaleFormValues = {
  projectName: '',
  projectDescription: '',
  websiteUrl: '',
  xHandle: '',
  githubLink: '',
  telegramGroup: '',
  discordServer: '',
  startDate: null,
  endDate: null,
  totalSupply: '',
  salePrice: '',
  acceptedToken: [],
  minPurchase: '',
  maxPurchase: '',
  whitelistAddress: '',
  kycProvider: '',
};

const stages = ['Project Overview', 'Sale Terms', 'Buyer Requirements'];

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
    console.log('Token Sale Form Submitted:', values);
    // Handle final form submission
  };

  const renderProjectOverview = (values: TokenSaleFormValues, setFieldValue: any) => (
    <VStack align="stretch">
      {/* Project Overview Section */}
      <ContentBox containerBoxProps={{ mb: 0 }}>
        <Text
          color="color-layout-foreground"
          textStyle="text-lg-medium"
          mb={2}
        >
          Project Overview
        </Text>
        <Text
          textStyle="text-sm-regular"
          color="color-content-muted"
          mb={6}
        >
          Let&apos;s start with the basics. Make it easy for people to learn about your project.
        </Text>
        
        <VStack spacing={6} align="stretch">
          <InputComponent
            label="What is your project&apos;s name?"
            isRequired={true}
            value={values.projectName}
            onChange={(e) => setFieldValue('projectName', e.target.value)}
            testId="project-name"
            placeholder="e.g. SuperDAO"
            gridContainerProps={{
              templateColumns: '1fr',
            }}
          />
          
          <TextareaComponent
            label="Tell me about your project"
            isRequired={true}
            value={values.projectDescription}
            onChange={(e) => setFieldValue('projectDescription', e.target.value)}
            placeholder="Describe what your project does, the problem it solves, and why it matters. Think of this as your elevator pitch to potential investors."
            rows={4}
            gridContainerProps={{
              templateColumns: '1fr',
            }}
          />
          
          <LabelComponent
            label="Provide your website URL"
            isRequired={true}
            gridContainerProps={{
              templateColumns: '1fr',
            }}
          >
            <InputGroup>
              <InputLeftElement>
                <Icon as={Globe} color="color-neutral-400" />
              </InputLeftElement>
              <Input
                value={values.websiteUrl}
                onChange={(e) => setFieldValue('websiteUrl', e.target.value)}
                placeholder="https://yourproject.xyz"
                pl="2.5rem"
              />
            </InputGroup>
          </LabelComponent>
        </VStack>
      </ContentBox>

      {/* Build Credibility Section */}
      <ContentBox>
        <Text
          fontSize="xl"
          fontWeight="medium"
          color="color-white"
          mb={2}
        >
          Build Credibility
        </Text>
        <Text
          fontSize="sm"
          color="color-neutral-400"
          mb={6}
        >
          These help investors verify your legitimacy and learn more about your project. While optional, they significantly boost trust.
        </Text>
        
        <Grid templateColumns="1fr 1fr" columnGap={6}>
          <LabelComponent
            label="X Handle"
            isRequired={false}
            gridContainerProps={{
              templateColumns: '1fr',
            }}
          >
            <InputGroup>
              <InputLeftElement>
                <Icon as={XLogo} color="color-neutral-400" />
              </InputLeftElement>
              <Input
                value={values.xHandle}
                onChange={(e) => setFieldValue('xHandle', e.target.value)}
                placeholder="@superdao"
                pl="2.5rem"
              />
            </InputGroup>
          </LabelComponent>
          
          <LabelComponent
            label="Github Link"
            isRequired={false}
            gridContainerProps={{
              templateColumns: '1fr',
            }}
          >
            <InputGroup>
              <InputLeftElement>
                <Icon as={GithubLogo} color="color-neutral-400" />
              </InputLeftElement>
              <Input
                value={values.githubLink}
                onChange={(e) => setFieldValue('githubLink', e.target.value)}
                placeholder="https://github.com/yourproject"
                pl="2.5rem"
              />
            </InputGroup>
          </LabelComponent>
          
          <LabelComponent
            label="Telegram Group"
            isRequired={false}
            gridContainerProps={{
              templateColumns: '1fr',
            }}
          >
            <InputGroup>
              <InputLeftElement>
                <Icon as={TelegramLogo} color="color-neutral-400" />
              </InputLeftElement>
              <Input
                value={values.telegramGroup}
                onChange={(e) => setFieldValue('telegramGroup', e.target.value)}
                placeholder="https://t.me/yourgroup"
                pl="2.5rem"
              />
            </InputGroup>
          </LabelComponent>
          
          <LabelComponent
            label="Discord Server"
            isRequired={false}
            gridContainerProps={{
              templateColumns: '1fr',
            }}
          >
            <InputGroup>
              <InputLeftElement>
                <Icon as={DiscordLogo} color="color-neutral-400" />
              </InputLeftElement>
              <Input
                value={values.discordServer}
                onChange={(e) => setFieldValue('discordServer', e.target.value)}
                placeholder="https://discord.gg/yourserver"
                pl="2.5rem"
              />
            </InputGroup>
          </LabelComponent>
        </Grid>
      </ContentBox>
    </VStack>
  );

  const renderSaleTerms = (values: TokenSaleFormValues, setFieldValue: any) => (
    <VStack spacing={6} align="stretch">
      <LabelComponent
        label="Sale Start Date"
        isRequired={true}
      >
        <DatePicker
          selectedDate={values.startDate || undefined}
          onChange={(date) => setFieldValue('startDate', date)}
          minDate={new Date()}
        />
      </LabelComponent>
      
      <LabelComponent
        label="Sale End Date"
        isRequired={true}
      >
        <DatePicker
          selectedDate={values.endDate || undefined}
          onChange={(date) => setFieldValue('endDate', date)}
          minDate={values.startDate || new Date()}
        />
      </LabelComponent>
      
      <LabelComponent
        label="Total Supply"
        isRequired={true}
      >
        <NumberInput
          value={values.totalSupply}
          onChange={(val) => setFieldValue('totalSupply', val)}
          min={0}
        >
          <NumberInputField placeholder="Enter total supply" />
        </NumberInput>
      </LabelComponent>
      
      <LabelComponent
        label="Sale Price"
        isRequired={true}
      >
        <NumberInput
          value={values.salePrice}
          onChange={(val) => setFieldValue('salePrice', val)}
          min={0}
        >
          <NumberInputField placeholder="Enter price per token" />
        </NumberInput>
      </LabelComponent>
      
      <LabelComponent
        label="Accepted Payment Token"
        isRequired={true}
      >
        <AssetSelector
          includeNativeToken={true}
          onSelect={(addresses) => setFieldValue('acceptedToken', addresses)}
        />
      </LabelComponent>
    </VStack>
  );

  const renderBuyerRequirements = (values: TokenSaleFormValues, setFieldValue: any) => (
    <VStack spacing={6} align="stretch">
      <LabelComponent
        label="Minimum Purchase"
        isRequired={true}
      >
        <NumberInput
          value={values.minPurchase}
          onChange={(val) => setFieldValue('minPurchase', val)}
          min={0}
        >
          <NumberInputField placeholder="Enter minimum purchase amount" />
        </NumberInput>
      </LabelComponent>
      
      <LabelComponent
        label="Maximum Purchase"
        isRequired={true}
      >
        <NumberInput
          value={values.maxPurchase}
          onChange={(val) => setFieldValue('maxPurchase', val)}
          min={0}
        >
          <NumberInputField placeholder="Enter maximum purchase amount" />
        </NumberInput>
      </LabelComponent>
      
      <InputComponent
        label="Whitelist Address (Optional)"
        isRequired={false}
        value={values.whitelistAddress}
        onChange={(e) => setFieldValue('whitelistAddress', e.target.value)}
        testId="whitelist-address"
        placeholder="Enter whitelist contract address"
      />
      
      <InputComponent
        label="KYC Provider (Optional)"
        isRequired={false}
        value={values.kycProvider}
        onChange={(e) => setFieldValue('kycProvider', e.target.value)}
        testId="kyc-provider"
        placeholder="Enter KYC provider details"
      />
    </VStack>
  );

  return (
    <Box
      mt={12}
      maxW={CONTENT_MAXW}
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
            <VStack align="stretch">
              <Box>
                {currentStage === 0 && renderProjectOverview(values, setFieldValue)}
                {currentStage === 1 && renderSaleTerms(values, setFieldValue)}
                {currentStage === 2 && renderBuyerRequirements(values, setFieldValue)}
              </Box>
              
              <Flex justify="space-between">
                {currentStage > 0 && (
                  <Button
                    variant="secondaryV1"
                    onClick={handlePrevious}
                  >
                    Previous
                  </Button>
                )}
                
                <Box ml="auto">
                  {currentStage < stages.length - 1 ? (
                    <Button
                      variant="primary"
                      onClick={handleNext}
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
                </Box>
              </Flex>
            </VStack>
          </Form>
        )}
      </Formik>
    </Box>
  );
}
