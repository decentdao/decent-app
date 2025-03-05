import { Button, Flex, Show, Text } from '@chakra-ui/react';
import { abis } from '@fractal-framework/fractal-contracts';
import { ChangeEventHandler, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { encodeFunctionData, zeroAddress } from 'viem';
import { SettingsContentBox } from '../../../../components/SafeSettings/SettingsContentBox';
import { GaslessVotingToggleDAOSettings } from '../../../../components/ui/GaslessVotingToggle';
import { InputComponent } from '../../../../components/ui/forms/InputComponent';
import { BarLoader } from '../../../../components/ui/loaders/BarLoader';
import NestedPageHeader from '../../../../components/ui/page/Header/NestedPageHeader';
import Divider from '../../../../components/ui/utils/Divider';
import { DecentPaymasterFactoryV1Abi, PAYMASTER_SALT } from '../../../../constants/common';
import { DAO_ROUTES } from '../../../../constants/routes';
import useSubmitProposal from '../../../../hooks/DAO/proposal/useSubmitProposal';
import { useAddressContractType } from '../../../../hooks/utils/useAddressContractType';
import { useCanUserCreateProposal } from '../../../../hooks/utils/useCanUserSubmitProposal';
import { createAccountSubstring } from '../../../../hooks/utils/useGetAccountName';
import { useInstallVersionedVotingStrategy } from '../../../../hooks/utils/useInstallVersionedVotingStrategy';
import { useNetworkConfigStore } from '../../../../providers/NetworkConfig/useNetworkConfigStore';
import { useDaoInfoStore } from '../../../../store/daoInfo/useDaoInfoStore';
import { BigIntValuePair, ProposalExecuteData } from '../../../../types';
import { validateENSName } from '../../../../utils/url';

export function SafeGeneralSettingsPage() {
  const { t } = useTranslation(['settings', 'settingsMetadata']);
  const [name, setName] = useState('');
  const [snapshotENS, setSnapshotENS] = useState('');
  const [snapshotENSValid, setSnapshotENSValid] = useState<boolean>();

  const { gaslessVotingEnabled } = useDaoInfoStore();

  const [isGaslessVotingEnabledToggled, setIsGaslessVotingEnabledToggled] =
    useState(gaslessVotingEnabled);

  useEffect(() => {
    setIsGaslessVotingEnabledToggled(gaslessVotingEnabled);
  }, [gaslessVotingEnabled]);

  const [gasTankTopupAmount, setGasTankTopupAmount] = useState<BigIntValuePair>();

  const navigate = useNavigate();

  const { submitProposal } = useSubmitProposal();
  const { canUserCreateProposal } = useCanUserCreateProposal();
  const { subgraphInfo, safe } = useDaoInfoStore();
  const {
    addressPrefix,
    contracts: { keyValuePairs, paymasterFactory },
  } = useNetworkConfigStore();

  const { isIVersionSupport } = useAddressContractType();

  const safeAddress = safe?.address;

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

  const nameChanged = name !== subgraphInfo?.daoName;
  const snapshotChanged = snapshotENSValid && snapshotENS !== subgraphInfo?.daoSnapshotENS;
  const gaslessVotingChanged = isGaslessVotingEnabledToggled !== gaslessVotingEnabled;
  const gasTankTopupAmountSet =
    gasTankTopupAmount?.bigintValue !== undefined && gasTankTopupAmount.bigintValue > 0n;

  const { buildInstallVersionedVotingStrategy } = useInstallVersionedVotingStrategy();

  const handleEditGeneralGovernance = async () => {
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

      keyArgs.push('gaslessVotingEnabled');
      valueArgs.push(`${isGaslessVotingEnabledToggled}`);
    }

    if (gasTankTopupAmountSet) {
      changeTitles.push(t('topupGasTank', { ns: 'proposalMetadata' }));

      // @todo add tx to send `gasTankTopupAmount` to gas tank address
    }

    const title = changeTitles.join(`; `);

    const targets = [keyValuePairs];
    const calldatas = [
      encodeFunctionData({
        abi: abis.KeyValuePairs,
        functionName: 'updateValues',
        args: [keyArgs, valueArgs],
      }),
    ];
    const values = [0n];

    if (gaslessVotingChanged && isGaslessVotingEnabledToggled) {
      if (!safeAddress) {
        throw new Error('Safe address is not set');
      }

      targets.push(paymasterFactory);
      calldatas.push(
        encodeFunctionData({
          // @todo replace with the deployed abi
          abi: DecentPaymasterFactoryV1Abi,
          functionName: 'createPaymaster',
          args: [safeAddress, BigInt(PAYMASTER_SALT)],
        }),
      );
      values.push(0n);

      const modulesAddresses = safe?.modulesAddresses;
      if (modulesAddresses) {
        let isUpdatedModule = false;
        let i = 0;
        while (!isUpdatedModule && i < modulesAddresses.length) {
          const moduleAddress = modulesAddresses[i];
          isUpdatedModule = await isIVersionSupport(moduleAddress);
          i++;
        }

        if (!isUpdatedModule) {
          // The safe is using the old modules.
          // Include txs to disable the old voting strategy and enable the new one.
          const installVersionedStrategyTxData = await buildInstallVersionedVotingStrategy();
          if (!installVersionedStrategyTxData) {
            throw new Error('Error encoding transaction for installing versioned voting strategy');
          }

          targets.push(...installVersionedStrategyTxData.map(tx => tx.targetAddress));
          calldatas.push(...installVersionedStrategyTxData.map(tx => tx.calldata));
          values.push(...installVersionedStrategyTxData.map(() => 0n));
        }
      }
    }

    const proposalData: ProposalExecuteData = {
      metaData: {
        title,
        description: '',
        documentationUrl: '',
      },
      targets,
      values,
      calldatas,
    };

    submitProposal({
      proposalData,
      nonce: safe?.nextNonce,
      pendingToastMessage: t('proposalCreatePendingToastMessage', { ns: 'proposal' }),
      successToastMessage: t('proposalCreateSuccessToastMessage', { ns: 'proposal' }),
      failedToastMessage: t('proposalCreateFailureToastMessage', { ns: 'proposal' }),
      successCallback: () => {
        if (safeAddress) {
          navigate(DAO_ROUTES.proposals.relative(addressPrefix, safeAddress));
        }
      },
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
            isEnabled={isGaslessVotingEnabledToggled}
            onToggle={() => {
              setIsGaslessVotingEnabledToggled(!isGaslessVotingEnabledToggled);
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
                isDisabled={!nameChanged && !snapshotChanged && !gaslessVotingChanged}
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
