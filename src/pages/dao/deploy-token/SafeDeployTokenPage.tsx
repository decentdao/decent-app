import { Box, Button, Flex } from '@chakra-ui/react';
import { ArrowLeft } from '@phosphor-icons/react';
import { Formik } from 'formik';
import { useTranslation } from 'react-i18next';
import { initialState } from '../../../components/DaoCreator/constants';
import { AzoriusTokenDetails } from '../../../components/DaoCreator/formComponents/AzoriusTokenDetails';
import { DAOCreateMode } from '../../../components/DaoCreator/formComponents/EstablishEssentials';
import { usePrepareFormData } from '../../../components/DaoCreator/hooks/usePrepareFormData';
import PageHeader from '../../../components/ui/page/Header/PageHeader';
import useDeployToken from '../../../hooks/DAO/useDeployToken';
import { useERC20TokenSchema } from '../../../hooks/schemas/DAOCreate/useERC20TokenSchema';
import { CreatorFormState, CreatorSteps, GovernanceType, ICreationStepProps } from '../../../types';

export function SafeDeployTokenPage() {
  const { t } = useTranslation();
  const { erc20TokenValidation } = useERC20TokenSchema();
  const { deployToken, pending: transactionPending } = useDeployToken();
  const { prepareAzoriusERC20FormData } = usePrepareFormData();

  const pageHeaderBreadcrumbs = [
    {
      terminus: t('deployToken', { ns: 'breadcrumbs' }),
      path: '',
    },
  ];

  return (
    <Box mt="2rem">
      <PageHeader
        title={t('tokenPageDeployTokenButton', { ns: 'settings' })}
        breadcrumbs={pageHeaderBreadcrumbs}
        ButtonIcon={ArrowLeft}
        buttonProps={{
          isDisabled: false,
          variant: 'secondary',
          onClick: undefined,
        }}
      />

      <Formik<Pick<CreatorFormState, 'essentials' | 'erc20Token'>>
        initialValues={{
          erc20Token: initialState.erc20Token,
          essentials: {
            daoName: 'to_pass_useStepRedirect_check',
            governance: GovernanceType.AZORIUS_ERC20,
            snapshotENS: '',
          },
        }}
        validationSchema={erc20TokenValidation}
        onSubmit={async values => {
          const daoData = await prepareAzoriusERC20FormData({
            ...initialState.essentials,
            ...initialState.azorius,
            ...values.erc20Token,
            freezeGuard: undefined,
          });

          if (daoData) {
            deployToken(daoData, () => {});
          }
        }}
        enableReinitialize
        validateOnMount
      >
        {({ handleSubmit, isSubmitting, ...rest }) => (
          <form onSubmit={handleSubmit}>
            <AzoriusTokenDetails
              steps={[CreatorSteps.ERC20_DETAILS]}
              mode={DAOCreateMode.EDIT}
              withSteps={false}
              {...(rest as any as Omit<ICreationStepProps, 'steps' | 'mode'>)}
            />

            <Flex
              alignItems="center"
              justifyContent="flex-end"
              width="100%"
              mt="1.5rem"
              gap="0.75rem"
            >
              <Button
                type="submit"
                isDisabled={transactionPending || isSubmitting}
              >
                {t('createProposal', { ns: 'proposal' })}
              </Button>
            </Flex>
          </form>
        )}
      </Formik>
    </Box>
  );
}
