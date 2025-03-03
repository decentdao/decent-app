import { Button, Flex, Show, Text } from '@chakra-ui/react';
import { abis } from '@fractal-framework/fractal-contracts';
import { ChangeEventHandler, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { encodeFunctionData, zeroAddress } from 'viem';
import { GaslessVotingToggleDAOSettings } from '../../../../components/GaslessVoting/GaslessVotingToggle';
import { SettingsContentBox } from '../../../../components/SafeSettings/SettingsContentBox';
import { InputComponent } from '../../../../components/ui/forms/InputComponent';
import { BarLoader } from '../../../../components/ui/loaders/BarLoader';
import NestedPageHeader from '../../../../components/ui/page/Header/NestedPageHeader';
import Divider from '../../../../components/ui/utils/Divider';
import { DAO_ROUTES } from '../../../../constants/routes';
import useSubmitProposal from '../../../../hooks/DAO/proposal/useSubmitProposal';
import { useCanUserCreateProposal } from '../../../../hooks/utils/useCanUserSubmitProposal';
import { createAccountSubstring } from '../../../../hooks/utils/useGetAccountName';
import { useNetworkConfigStore } from '../../../../providers/NetworkConfig/useNetworkConfigStore';
import { useDaoInfoStore } from '../../../../store/daoInfo/useDaoInfoStore';
import { BigIntValuePair, ProposalExecuteData } from '../../../../types';
import { validateENSName } from '../../../../utils/url';
export function SafeGeneralSettingsPage() {
  const { t } = useTranslation(['settings', 'settingsMetadata']);
  const [name, setName] = useState('');
  const [snapshotENS, setSnapshotENS] = useState('');
  const [snapshotENSValid, setSnapshotENSValid] = useState<boolean>();

  const [isGaslessVotingEnabled, setIsGaslessVotingEnabled] = useState<boolean>(false);
  const [gasTankTopupAmount, setGasTankTopupAmount] = useState<BigIntValuePair>();

  const navigate = useNavigate();

  const { submitProposal } = useSubmitProposal();
  const { canUserCreateProposal } = useCanUserCreateProposal();
  const { subgraphInfo, safe } = useDaoInfoStore();
  const {
    addressPrefix,
    contracts: { keyValuePairs },
  } = useNetworkConfigStore();

  const safeAddress = safe?.address;

  const currentIsGaslessVotingEnabled = subgraphInfo?.gaslessVotingEnabled ?? false;

  useEffect(() => {
    if (
      subgraphInfo?.daoName &&
      safeAddress &&
      createAccountSubstring(safeAddress) !== subgraphInfo?.daoName
    ) {
      setName(subgraphInfo.daoName);
    }

    if (subgraphInfo?.daoSnapshotENS) {
      setSnapshotENS(subgraphInfo?.daoSnapshotENS);
    }
  }, [subgraphInfo?.daoName, subgraphInfo?.daoSnapshotENS, safeAddress]);

  const handleSnapshotENSChange: ChangeEventHandler<HTMLInputElement> = e => {
    const lowerCasedValue = e.target.value.toLowerCase();
    setSnapshotENS(lowerCasedValue);
    if (
      validateENSName(lowerCasedValue) ||
      (e.target.value === '' && subgraphInfo?.daoSnapshotENS)
    ) {
      setSnapshotENSValid(true);
    } else {
      setSnapshotENSValid(false);
    }
  };

  const submitProposalSuccessCallback = () => {
    if (safeAddress) {
      navigate(DAO_ROUTES.proposals.relative(addressPrefix, safeAddress));
    }
  };

  const nameChanged = name !== subgraphInfo?.daoName;
  const snapshotChanged = snapshotENSValid && snapshotENS !== subgraphInfo?.daoSnapshotENS;
  const gaslessVotingChanged = isGaslessVotingEnabled !== currentIsGaslessVotingEnabled;
  const gasTankTopupAmountSet =
    gasTankTopupAmount?.bigintValue !== undefined && gasTankTopupAmount.bigintValue > 0n;

  const handleEditGeneralGovernance = () => {
    const changeTitles = [];
    const keyArgs = [];
    const valueArgs = [];

    if (nameChanged) {
      changeTitles.push(t('updatesSafeName', { ns: 'proposalMetadata' }));
      keyArgs.push('daoName');
      valueArgs.push(name);
    }

    if (snapshotChanged) {
      changeTitles.push(t('updateSnapshotSpace', { ns: 'proposalMetadata' }));
      keyArgs.push('snapshotENS');
      valueArgs.push(snapshotENS);
    }

    if (gaslessVotingChanged) {
      changeTitles.push(t('enableGaslessVoting', { ns: 'proposalMetadata' }));

      // @todo Is KV pairs the place we're storing this flag?
      keyArgs.push('gaslessVotingEnabled');
      valueArgs.push(`${isGaslessVotingEnabled}`);
    }

    if (gasTankTopupAmountSet) {
      changeTitles.push(t('topupGasTank', { ns: 'proposalMetadata' }));

      // @todo add tx to send `gasTankTopupAmount` to gas tank address
    }

    const title = changeTitles.join(`; `);

    const proposalData: ProposalExecuteData = {
      metaData: {
        title,
        description: '',
        documentationUrl: '',
      },
      targets: [keyValuePairs],
      values: [0n],
      calldatas: [
        encodeFunctionData({
          abi: abis.KeyValuePairs,
          functionName: 'updateValues',
          args: [keyArgs, valueArgs],
        }),
      ],
    };

    submitProposal({
      proposalData,
      nonce: safe?.nextNonce,
      pendingToastMessage: t('proposalCreatePendingToastMessage', { ns: 'proposal' }),
      successToastMessage: t('proposalCreateSuccessToastMessage', { ns: 'proposal' }),
      failedToastMessage: t('proposalCreateFailureToastMessage', { ns: 'proposal' }),
      successCallback: submitProposalSuccessCallback,
    });
  };

  return (
    <>
      <Show below="md">
        <NestedPageHeader
          title={t('daoSettingsGeneral')}
          backButton={{
            text: t('settings'),
            href: DAO_ROUTES.settings.relative(addressPrefix, safeAddress || zeroAddress),
          }}
        />
      </Show>
      {!!safe ? (
        <SettingsContentBox>
          <Flex
            flexDir="column"
            gap="1rem"
          >
            <Text textStyle="heading-small">{t('daoMetadataName')}</Text>
            <InputComponent
              isRequired={false}
              onChange={e => setName(e.target.value)}
              disabled={!canUserCreateProposal}
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
          </Flex>
          <Divider
            my="1rem"
            w={{ base: 'calc(100% + 1.5rem)', md: 'calc(100% + 3rem)' }}
            mx={{ base: '-0.75rem', md: '-1.5rem' }}
          />
          <Flex
            flexDir="column"
            gap="1rem"
          >
            <Text textStyle="heading-small">
              {subgraphInfo?.daoSnapshotENS
                ? t('daoMetadataSnapshot')
                : t('daoMetadataConnectSnapshot')}
            </Text>
            <InputComponent
              isRequired={false}
              onChange={handleSnapshotENSChange}
              value={snapshotENS}
              disabled={!canUserCreateProposal}
              placeholder="example.eth"
              testId="daoSettings.snapshotENS"
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
          </Flex>

          <GaslessVotingToggleDAOSettings
            isEnabled={isGaslessVotingEnabled}
            onToggle={() => {
              console.log(
                'onToggle. Add this action to the proposal, to be submitted via propose changes button.',
              );
              setIsGaslessVotingEnabled(!isGaslessVotingEnabled);
            }}
            onGasTankTopupAmountChange={setGasTankTopupAmount}
          />
          {canUserCreateProposal && (
            <>
              <Divider
                my="1rem"
                w={{ base: 'calc(100% + 1.5rem)', md: 'calc(100% + 3rem)' }}
                mx={{ base: '-0.75rem', md: '-1.5rem' }}
              />
              <Button
                variant="secondary"
                size="sm"
                marginLeft="auto"
                isDisabled={!nameChanged && !snapshotChanged}
                onClick={handleEditGeneralGovernance}
              >
                {t('proposeChanges')}
              </Button>
            </>
          )}
        </SettingsContentBox>
      ) : (
        <Flex
          h="8.5rem"
          width="100%"
          alignItems="center"
          justifyContent="center"
        >
          <BarLoader />
        </Flex>
      )}
    </>
  );
}
