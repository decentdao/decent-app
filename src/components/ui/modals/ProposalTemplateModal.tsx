import { Box, Button, Flex, FormControl, FormLabel, Switch, VStack } from '@chakra-ui/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { DAO_ROUTES } from '../../../constants/routes';
import { logError } from '../../../helpers/errorLogging';
import { usePrepareProposal } from '../../../hooks/DAO/proposal/usePrepareProposal';
import useSubmitProposal from '../../../hooks/DAO/proposal/useSubmitProposal';
import { useCurrentDAOKey } from '../../../hooks/DAO/useCurrentDAOKey';
import { useCanUserCreateProposal } from '../../../hooks/utils/useCanUserSubmitProposal';
import { useDAOStore } from '../../../providers/App/AppProvider';
import { useNetworkConfigStore } from '../../../providers/NetworkConfig/useNetworkConfigStore';
import { BigIntValuePair } from '../../../types';
import { ProposalTemplate } from '../../../types/proposalBuilder';
import { CustomNonceInput } from '../forms/CustomNonceInput';
import { BigIntComponent, InputComponent } from '../forms/InputComponent';
import Markdown from '../proposal/Markdown';
import Divider from '../utils/Divider';

interface IProposalTemplateModalProps {
  proposalTemplate: ProposalTemplate;
  onClose: () => void;
}

export default function ProposalTemplateModal({
  proposalTemplate: { title, description, transactions },
  onClose,
}: IProposalTemplateModalProps) {
  const { daoKey } = useCurrentDAOKey();
  const {
    node: { safe },
  } = useDAOStore({ daoKey });
  const { addressPrefix } = useNetworkConfigStore();

  const [filledProposalTransactions, setFilledProposalTransactions] = useState(transactions);
  const [nonce, setNonce] = useState<number | undefined>(safe!.nextNonce);
  const [showAll, setShowAll] = useState(false);
  const { t } = useTranslation(['proposalTemplate', 'proposal']);
  const navigate = useNavigate();
  const { submitProposal } = useSubmitProposal();
  const { canUserCreateProposal } = useCanUserCreateProposal();
  const { prepareProposal } = usePrepareProposal();

  const handleEthValueChange = ({
    transactionIndex,
    value,
  }: {
    transactionIndex: number;
    value: BigIntValuePair;
  }) => {
    setFilledProposalTransactions(prevState =>
      prevState.map((transaction, txIndex) => {
        if (transactionIndex === txIndex) {
          return {
            ...transaction,
            ethValue: value,
          };
        }
        return transaction;
      }),
    );
  };
  const handleParameterChange = ({
    transactionIndex,
    parameterIndex,
    value,
  }: {
    transactionIndex: number;
    parameterIndex: number;
    value: string;
  }) => {
    // We probably could use Formik and Yup here
    // However constructing and validating form will be quite complicated and involving parsing user input
    // Thus, for now - we simply store form state through useState
    setFilledProposalTransactions(prevState =>
      prevState.map((transaction, txIndex) => {
        if (transactionIndex === txIndex) {
          return {
            ...transaction,
            parameters: transaction.parameters.map((parameter, paramIndex) => {
              if (paramIndex === parameterIndex) {
                return {
                  ...parameter,
                  value,
                };
              }
              return parameter;
            }),
          };
        }
        return transaction;
      }),
    );
  };

  const successCallback = () => {
    if (safe?.address) {
      navigate(DAO_ROUTES.dao.relative(addressPrefix, safe.address));
      onClose();
    }
  };

  const handleSubmitProposal = async () => {
    const proposalMetadata = {
      title: `Proposal from ${title} template`,
      description,
      documentationUrl: '',
    };

    try {
      const proposalData = await prepareProposal({
        proposalMetadata,
        transactions: filledProposalTransactions,
      });

      submitProposal({
        proposalData,
        successCallback,
        nonce,
        pendingToastMessage: t('proposalCreatePendingToastMessage', { ns: 'proposal' }),
        successToastMessage: t('proposalCreateSuccessToastMessage', { ns: 'proposal' }),
        failedToastMessage: t('proposalCreateFailureToastMessage', { ns: 'proposal' }),
      });
    } catch (e) {
      logError('Error during submitting proposal from template', e);
    }
  };

  // The form is valid when there's no parameter without filled value
  const isValid = !filledProposalTransactions.find(
    transaction => !!transaction.parameters.find(parameter => !parameter.value),
  );

  return (
    <Box>
      {description && (
        <>
          <Markdown content={description} />
          <Divider />
        </>
      )}
      {filledProposalTransactions.map((transaction, transactionIndex) => (
        <VStack key={transactionIndex}>
          {transaction.parameters.map(
            (parameter, parameterIndex) =>
              (showAll || parameter.label) && (
                <Flex
                  key={parameterIndex}
                  width="100%"
                  flexWrap="wrap"
                  marginTop="1.5rem"
                >
                  <InputComponent
                    label={parameter.label || parameter.signature}
                    placeholder={parameter.signature}
                    value={parameter.value || ''}
                    isRequired={!!parameter.label}
                    disabled={!parameter.label}
                    testId={`proposalTemplate.transactions.${transactionIndex}.parameters.${parameterIndex}`}
                    inputContainerProps={{
                      width: '100%',
                    }}
                    gridContainerProps={{
                      width: '100%',
                      display: 'flex',
                      flexWrap: 'wrap',
                    }}
                    onChange={event =>
                      handleParameterChange({
                        transactionIndex,
                        parameterIndex,
                        value: event.target.value,
                      })
                    }
                  />
                </Flex>
              ),
          )}
          {(showAll ||
            !transactions[transactionIndex].ethValue.bigintValue ||
            transactions[transactionIndex].ethValue.bigintValue === 0n) && (
            <Flex
              width="100%"
              flexWrap="wrap"
              marginTop="1.5rem"
            >
              <BigIntComponent
                label={t('labelEthValue', { ns: 'proposal' })}
                helper={t('helperEthValue', { ns: 'proposal' })}
                isRequired={false}
                errorMessage={undefined}
                value={transaction.ethValue.bigintValue || 0n}
                onChange={value => {
                  handleEthValueChange({ transactionIndex, value });
                }}
                decimalPlaces={18}
              />
            </Flex>
          )}
          {transaction.parameters.length > 0 && <Divider />}
        </VStack>
      ))}
      <FormControl
        my="1rem"
        display="flex"
        alignItems="center"
      >
        <FormLabel mb={0}>{t('showParameters')}</FormLabel>
        <Switch
          isChecked={showAll}
          onChange={() => setShowAll(!showAll)}
          colorScheme="lilac"
          bg="color-neutral-300"
          borderRadius="9999px"
        />
      </FormControl>
      <Divider />
      <Box marginTop="1.5rem">
        <CustomNonceInput
          nonce={nonce}
          onChange={newNonce => setNonce(newNonce ? parseInt(newNonce) : undefined)}
        />
      </Box>
      <Button
        marginTop="1.5rem"
        width="100%"
        isDisabled={!isValid || !canUserCreateProposal}
        onClick={handleSubmitProposal}
      >
        {t('submitProposalFromTemplate')}
      </Button>
    </Box>
  );
}
