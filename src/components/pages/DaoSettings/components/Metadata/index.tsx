import { Flex, Text, Button, Divider } from '@chakra-ui/react';
import { BigNumber } from 'ethers';
import { useState, useEffect, ChangeEventHandler } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { SettingsSection } from '..';
import { DAO_ROUTES } from '../../../../../constants/routes';
import useSubmitProposal from '../../../../../hooks/DAO/proposal/useSubmitProposal';
import { createAccountSubstring } from '../../../../../hooks/utils/useDisplayName';
import { useFractal } from '../../../../../providers/App/AppProvider';
import { ProposalExecuteData } from '../../../../../types';
import { couldBeENS } from '../../../../../utils/url';
import { InputComponent } from '../../../../ui/forms/InputComponent';

export default function MetadataContainer() {
  const [name, setName] = useState('');
  const [snapshotURL, setSnapshotURL] = useState('');
  const [snapshotURLValid, setSnapshotURLValid] = useState<boolean>();
  const { t } = useTranslation(['settings', 'proposalMetadata']);
  const navigate = useNavigate();

  const { canUserCreateProposal, submitProposal } = useSubmitProposal();
  const {
    baseContracts,
    node: { daoName, daoSnapshotURL, daoAddress, safe, daoNetwork },
    readOnly: {
      user: { votingWeight },
    },
  } = useFractal();

  useEffect(() => {
    if (daoName && daoAddress && createAccountSubstring(daoAddress) !== daoName) {
      setName(daoName);
    }

    if (daoSnapshotURL) {
      setSnapshotURL(daoSnapshotURL);
    }
  }, [daoName, daoSnapshotURL, daoAddress]);

  const handleSnapshotURLChange: ChangeEventHandler<HTMLInputElement> = e => {
    if (couldBeENS(e.target.value)) {
      setSnapshotURLValid(true);
    } else {
      setSnapshotURLValid(false);
    }

    setSnapshotURL(e.target.value);
  };

  const userHasVotingWeight = votingWeight.gt(0);

  const submitProposalSuccessCallback = () => {
    if (daoNetwork && daoAddress) {
      navigate(DAO_ROUTES.proposals.relative(daoNetwork, daoAddress));
    }
  };

  const handleEditDAOName = () => {
    if (!baseContracts) {
      return;
    }
    const { fractalRegistryContract } = baseContracts;
    const proposalData: ProposalExecuteData = {
      metaData: {
        title: t('Update Safe Name', { ns: 'proposalMetadata' }),
        description: '',
        documentationUrl: '',
      },
      targets: [fractalRegistryContract.asProvider.address],
      values: [BigNumber.from(0)],
      calldatas: [
        fractalRegistryContract.asProvider.interface.encodeFunctionData('updateDAOName', [name]),
      ],
    };

    submitProposal({
      proposalData,
      nonce: safe?.nonce,
      pendingToastMessage: t('proposalCreatePendingToastMessage', { ns: 'proposal' }),
      successToastMessage: t('proposalCreateSuccessToastMessage', { ns: 'proposal' }),
      failedToastMessage: t('proposalCreateFailureToastMessage', { ns: 'proposal' }),
      successCallback: submitProposalSuccessCallback,
    });
  };

  const handleEditDAOSnapshotURL = () => {
    if (!baseContracts) {
      return;
    }
    const { keyValuePairsContract } = baseContracts;
    const proposalData: ProposalExecuteData = {
      metaData: {
        title: t('Update Snapshot Space', { ns: 'proposalMetadata' }),
        description: '',
        documentationUrl: '',
      },
      targets: [keyValuePairsContract.asProvider.address],
      values: [BigNumber.from(0)],
      calldatas: [
        keyValuePairsContract.asProvider.interface.encodeFunctionData('updateValues', [
          ['snapshotURL'],
          [snapshotURL],
        ]),
      ],
    };

    submitProposal({
      proposalData,
      nonce: safe?.nonce,
      pendingToastMessage: t('proposalCreatePendingToastMessage', { ns: 'proposal' }),
      successToastMessage: t('proposalCreateSuccessToastMessage', { ns: 'proposal' }),
      failedToastMessage: t('proposalCreateFailureToastMessage', { ns: 'proposal' }),
      successCallback: submitProposalSuccessCallback,
    });
  };

  return (
    <SettingsSection
      contentTitle={''}
      contentHeader={
        <Flex
          justifyContent="space-between"
          alignItems="center"
        >
          <Text
            textStyle="text-lg-mono-bold"
            color="grayscale.100"
          >
            {t('daoMetadataName')}
          </Text>
          {canUserCreateProposal && (
            <Button
              variant="tertiary"
              disabled={name === daoName}
              isDisabled={name === daoName}
              onClick={handleEditDAOName}
            >
              {t('proposeChanges')}
            </Button>
          )}
        </Flex>
      }
      descriptionTitle={t('daoMetadataDescriptionTitle')}
      descriptionText={t('daoMetadataDescriptionText')}
    >
      <InputComponent
        isRequired={false}
        onChange={e => setName(e.target.value)}
        disabled={!userHasVotingWeight}
        value={name}
        placeholder="Amazing DAO"
        testId="daoSettings.name"
        gridContainerProps={{
          display: 'inline-flex',
          flexWrap: 'wrap',
          flex: '1',
          width: '100%',
        }}
        inputContainerProps={{
          width: '100%',
        }}
      />
      <Divider
        color="chocolate.400"
        mt={4}
        mb={4}
      />
      <Flex
        justifyContent="space-between"
        alignItems="center"
      >
        <Text
          textStyle="text-lg-mono-bold"
          color="grayscale.100"
        >
          {t('daoMetadataSnapshot')}
        </Text>
        {canUserCreateProposal && (
          <Button
            variant="tertiary"
            disabled={!snapshotURLValid || snapshotURL === daoSnapshotURL}
            isDisabled={!snapshotURLValid || snapshotURL === daoSnapshotURL}
            onClick={handleEditDAOSnapshotURL}
          >
            {t('proposeChanges')}
          </Button>
        )}
      </Flex>
      <InputComponent
        isRequired={false}
        onChange={handleSnapshotURLChange}
        value={snapshotURL}
        disabled={!userHasVotingWeight}
        placeholder="httpsexample.eth"
        testId="daoSettings.snapshotUrl"
        gridContainerProps={{
          display: 'inline-flex',
          flexWrap: 'wrap',
          flex: '1',
          width: '100%',
        }}
        inputContainerProps={{
          width: '100%',
        }}
      />
    </SettingsSection>
  );
}
