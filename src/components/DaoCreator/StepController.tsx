import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { useAccount } from 'wagmi';
import { useNetworkConfigStore } from '../../providers/NetworkConfig/useNetworkConfigStore';
import {
  ChildERC20Steps,
  ChildERC721Steps,
  ChildMultisigSteps,
  CreatorSteps,
  GovernanceType,
  ICreationStepProps,
  RootERC20Steps,
  RootERC721Steps,
  RootMultisigSteps,
} from '../../types';
import { AzoriusGovernance } from './formComponents/AzoriusGovernance';
import AzoriusNFTDetails from './formComponents/AzoriusNFTDetails';
import { AzoriusTokenDetails } from './formComponents/AzoriusTokenDetails';
import { DAOCreateMode, EstablishEssentials } from './formComponents/EstablishEssentials';
import GuardDetails from './formComponents/GuardDetails';
import { Multisig } from './formComponents/Multisig';
import useStepRedirect from './hooks/useStepRedirect';

function StepController(props: Omit<ICreationStepProps, 'steps'>) {
  const { t } = useTranslation('daoCreate');
  const { createOptions } = useNetworkConfigStore();
  const location = useLocation();

  const { values, mode, setFieldValue } = props;

  const { redirectToInitialStep } = useStepRedirect({ values, redirectOnMount: false });

  const { isConnected } = useAccount();
  useEffect(() => {
    if (isConnected) {
      return;
    }
    const disconnectedToast = toast.info(t('toastDisconnectedPersistent', { ns: 'daoCreate' }), {
      duration: Infinity,
      closeButton: false,
      dismissible: false,
    });

    return () => {
      toast.dismiss(disconnectedToast);
    };
  }, [isConnected, t]);

  const steps = useMemo(() => {
    const isMultisig = values.essentials.governance === GovernanceType.MULTISIG;
    const isERC20 = values.essentials.governance === GovernanceType.AZORIUS_ERC20;
    const isERC721 = values.essentials.governance === GovernanceType.AZORIUS_ERC721;

    if (mode === DAOCreateMode.ROOTDAO || mode === DAOCreateMode.EDIT) {
      if (isMultisig) {
        return RootMultisigSteps;
      } else if (isERC20) {
        return RootERC20Steps;
      } else if (isERC721) {
        return RootERC721Steps;
      } else {
        throw new Error('Unknown Governance Type');
      }
    } else {
      if (isMultisig) {
        return ChildMultisigSteps;
      } else if (isERC20) {
        return ChildERC20Steps;
      } else if (isERC721) {
        return ChildERC721Steps;
      } else {
        throw new Error('Unknown Governance Type');
      }
    }
  }, [mode, values.essentials.governance]);

  useEffect(() => {
    // @dev - The only possible way for this to become true if someone will choose governance option and then would switch network
    if (!createOptions.includes(values.essentials.governance)) {
      setFieldValue('essentials.governance', GovernanceType.MULTISIG);
      redirectToInitialStep();
      toast.error(t('errorUnsupportedCreateOption'));
    }
  }, [createOptions, setFieldValue, values.essentials.governance, t, redirectToInitialStep]);

  return (
    <Routes>
      <Route
        path={CreatorSteps.ESSENTIALS}
        element={
          <EstablishEssentials
            {...props}
            steps={steps}
          />
        }
      />
      {steps.includes(CreatorSteps.MULTISIG_DETAILS) && (
        <Route
          path={CreatorSteps.MULTISIG_DETAILS}
          element={
            <Multisig
              {...props}
              steps={steps}
            />
          }
        />
      )}
      {steps.includes(CreatorSteps.AZORIUS_DETAILS) && (
        <Route
          path={CreatorSteps.AZORIUS_DETAILS}
          element={
            <AzoriusGovernance
              {...props}
              steps={steps}
            />
          }
        />
      )}
      {steps.includes(CreatorSteps.ERC20_DETAILS) && (
        <Route
          path={CreatorSteps.ERC20_DETAILS}
          element={
            <AzoriusTokenDetails
              {...props}
              steps={steps}
              withSteps
            />
          }
        />
      )}
      {steps.includes(CreatorSteps.ERC721_DETAILS) && (
        <Route
          path={CreatorSteps.ERC721_DETAILS}
          element={
            <AzoriusNFTDetails
              {...props}
              steps={steps}
            />
          }
        />
      )}
      {steps.includes(CreatorSteps.FREEZE_DETAILS) && (
        <Route
          path={CreatorSteps.FREEZE_DETAILS}
          element={
            <GuardDetails
              {...props}
              steps={steps}
            />
          }
        />
      )}
      <Route
        path="*"
        element={
          <Navigate
            to={`${CreatorSteps.ESSENTIALS}${location.search}`}
            replace
          />
        }
      />
    </Routes>
  );
}

export default StepController;
