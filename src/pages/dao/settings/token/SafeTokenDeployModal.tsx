import { Box } from '@chakra-ui/react';
import { Formik } from 'formik';
import { initialState } from '../../../../components/DaoCreator/constants';
import { AzoriusTokenDetails } from '../../../../components/DaoCreator/formComponents/AzoriusTokenDetails';
import { DAOCreateMode } from '../../../../components/DaoCreator/formComponents/EstablishEssentials';
import { useERC20TokenSchema } from '../../../../hooks/schemas/DAOCreate/useERC20TokenSchema';
import {
  CreatorFormState,
  CreatorSteps,
  GovernanceType,
  ICreationStepProps,
} from '../../../../types';

export function SafeTokenDeployModal({
  closeModal,
  closeAllModals,
}: {
  closeModal: () => void;
  closeAllModals: () => void;
}) {
  const { erc20TokenValidation } = useERC20TokenSchema();

  return (
    <Box>
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
        onSubmit={async values => {}}
        enableReinitialize
        validateOnMount
      >
        {({ handleSubmit, ...rest }) => (
          <Box
            as="form"
            onSubmit={handleSubmit}
          >
            <AzoriusTokenDetails
              steps={[CreatorSteps.ERC20_DETAILS]}
              mode={DAOCreateMode.EDIT}
              {...(rest as any as Omit<ICreationStepProps, 'steps' | 'mode'>)}
            />
          </Box>
        )}
      </Formik>
    </Box>
  );
}
