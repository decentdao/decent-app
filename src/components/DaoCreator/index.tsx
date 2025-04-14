import { Box } from '@chakra-ui/react';
import { Formik } from 'formik';

import { useDAOCreateSchema } from '../../hooks/schemas/DAOCreate/useDAOCreateSchema';
import {
  AzoriusERC20DAO,
  AzoriusERC721DAO,
  CreatorFormState,
  DAOTrigger,
  GovernanceType,
  SafeMultisigDAO,
  SubDAO,
} from '../../types';
import StepController from './StepController';
import { initialState } from './constants';
import { DAOCreateMode } from './formComponents/EstablishEssentials';
import { useParentSafeVotingWeight } from './hooks/useParentSafeVotingWeight';
import { usePrepareFormData } from './hooks/usePrepareFormData';

function DaoCreator({
  deployDAO,
  pending,
  isSubDAO,
  mode,
}: {
  pending?: boolean;
  deployDAO: DAOTrigger;
  isSubDAO?: boolean;
  mode: DAOCreateMode;
}) {
  const { totalParentVotingWeight } = useParentSafeVotingWeight();

  const { createDAOValidation } = useDAOCreateSchema({
    isSubDAO: !!isSubDAO,
    totalParentVotingWeight,
  });

  const { prepareMultisigFormData, prepareAzoriusERC20FormData, prepareAzoriusERC721FormData } =
    usePrepareFormData();

  return (
    <Box>
      <Formik<CreatorFormState>
        initialValues={initialState}
        validationSchema={createDAOValidation}
        onSubmit={async values => {
          const choosenGovernance = values.essentials.governance;
          const freezeGuard = isSubDAO ? values.freeze : undefined;

          let daoData: SafeMultisigDAO | AzoriusERC20DAO | AzoriusERC721DAO | SubDAO | undefined;
          let customNonce =
            mode === DAOCreateMode.EDIT || freezeGuard !== undefined
              ? values.multisig.customNonce
              : undefined;

          switch (choosenGovernance) {
            case GovernanceType.MULTISIG:
              daoData = await prepareMultisigFormData({
                ...values.essentials,
                ...values.multisig,
                freezeGuard,
              });
              break;

            case GovernanceType.AZORIUS_ERC20:
              daoData = await prepareAzoriusERC20FormData({
                ...values.essentials,
                ...values.azorius,
                ...values.erc20Token,
                freezeGuard,
              });
              break;

            case GovernanceType.AZORIUS_ERC721:
              daoData = await prepareAzoriusERC721FormData({
                ...values.essentials,
                ...values.azorius,
                ...values.erc721Token,
                freezeGuard,
              });
              break;
          }

          if (daoData) {
            deployDAO(daoData, customNonce);
          }
        }}
        enableReinitialize
        validateOnMount
      >
        {({ handleSubmit, ...rest }) => (
          <form onSubmit={handleSubmit}>
            <StepController
              transactionPending={pending}
              isSubDAO={isSubDAO}
              mode={mode}
              {...rest}
            />
          </form>
        )}
      </Formik>
    </Box>
  );
}

export default DaoCreator;
