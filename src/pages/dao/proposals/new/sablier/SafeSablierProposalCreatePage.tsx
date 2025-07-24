import * as amplitude from '@amplitude/analytics-browser';
import { Center } from '@chakra-ui/react';
import { abis } from '@decentdao/decent-contracts';
import groupBy from 'lodash.groupby';
import { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Address, encodeFunctionData, erc20Abi, getAddress, Hash, zeroAddress } from 'viem';
import SablierV2BatchAbi from '../../../../../assets/abi/SablierV2Batch';
import { ProposalBuilder } from '../../../../../components/ProposalBuilder/ProposalBuilder';
import { StreamsDetails } from '../../../../../components/ProposalBuilder/ProposalDetails';
import { DEFAULT_PROPOSAL_METADATA_TYPE_PROPS } from '../../../../../components/ProposalBuilder/ProposalMetadata';
import { ProposalStreams } from '../../../../../components/ProposalBuilder/ProposalStreams';
import { GoToTransactionsStepButton } from '../../../../../components/ProposalBuilder/StepButtons';
import { DEFAULT_SABLIER_PROPOSAL } from '../../../../../components/ProposalBuilder/constants';
import NoDataCard from '../../../../../components/ui/containers/NoDataCard';
import { BarLoader } from '../../../../../components/ui/loaders/BarLoader';
import { ROLES } from '../../../../../constants/accessControlRoles';
import { useHeaderHeight } from '../../../../../constants/common';
import { DAO_ROUTES } from '../../../../../constants/routes';
import { useCurrentDAOKey } from '../../../../../hooks/DAO/useCurrentDAOKey';
import useLockedToken from '../../../../../hooks/DAO/useLockedToken';
import { useFilterSpamTokens } from '../../../../../hooks/utils/useFilterSpamTokens';
import { analyticsEvents } from '../../../../../insights/analyticsEvents';
import { useDAOStore } from '../../../../../providers/App/AppProvider';
import { useNetworkConfigStore } from '../../../../../providers/NetworkConfig/useNetworkConfigStore';
import { useProposalActionsStore } from '../../../../../store/actions/useProposalActionsStore';
import {
  CreateProposalForm,
  CreateProposalSteps,
  CreateSablierProposalForm,
} from '../../../../../types';

export function SafeSablierProposalCreatePage() {
  useEffect(() => {
    amplitude.track(analyticsEvents.SablierProposalCreatePageOpened);
  }, []);
  const { daoKey } = useCurrentDAOKey();
  const {
    governance: { type },
    treasury: { assetsFungible },
    node: { safe },
  } = useDAOStore({ daoKey });
  const {
    addressPrefix,
    contracts: { sablierV2Batch, sablierV2LockupTranched },
  } = useNetworkConfigStore();
  const filterSpamTokens = useFilterSpamTokens();
  const { t } = useTranslation('proposal');
  const navigate = useNavigate();
  const { proposalMetadata: actionsProposalMetadata } = useProposalActionsStore();
  const { loadTokenState } = useLockedToken();

  const prepareProposalData = useCallback(
    async (values: CreateProposalForm | CreateSablierProposalForm) => {
      const { streams, proposalMetadata } = values as CreateSablierProposalForm;
      if (!safe?.address) {
        throw new Error('Can not create stream without DAO address set');
      } else if (!streams) {
        throw new Error('Can not create streams without streams values set');
      }
      const targets: Address[] = [];
      const txValues: bigint[] = [];
      const calldatas: Hash[] = [];

      const groupedStreams = groupBy(streams, 'tokenAddress');
      const isBatchWhitelistedOfStreams = await Promise.allSettled(
        Object.keys(groupedStreams).map(token => loadTokenState(token as Address, sablierV2Batch)),
      );
      const isLockupWhitelistedOfStreams = await Promise.allSettled(
        Object.keys(groupedStreams).map(token =>
          loadTokenState(token as Address, sablierV2LockupTranched),
        ),
      );

      Object.keys(groupedStreams).forEach((token, index) => {
        const tokenAddress = getAddress(token);
        const tokenStreams = groupedStreams[token];
        const approvedTotal = tokenStreams.reduce(
          (prev, curr) => prev + (curr.totalAmount.bigintValue || 0n),
          0n,
        );
        const approveCalldata = encodeFunctionData({
          abi: erc20Abi,
          functionName: 'approve',
          args: [sablierV2Batch, approvedTotal],
        });

        targets.push(tokenAddress);
        txValues.push(0n);
        calldatas.push(approveCalldata);

        if (
          isBatchWhitelistedOfStreams[index].status === 'fulfilled' &&
          isBatchWhitelistedOfStreams[index].value.needWhitelist
        ) {
          const whitelistCalldata = encodeFunctionData({
            abi: abis.deployables.VotesERC20V1,
            functionName: 'grantRole',
            args: [ROLES.TRANSFER_FROM_ROLE, sablierV2Batch],
          });
          targets.push(tokenAddress);
          txValues.push(0n);
          calldatas.push(whitelistCalldata);
        }

        if (
          isLockupWhitelistedOfStreams[index].status === 'fulfilled' &&
          isLockupWhitelistedOfStreams[index].value.needWhitelist
        ) {
          const whitelistCalldata = encodeFunctionData({
            abi: abis.deployables.VotesERC20V1,
            functionName: 'grantRole',
            args: [ROLES.TRANSFER_FROM_ROLE, sablierV2LockupTranched],
          });
          targets.push(tokenAddress);
          txValues.push(0n);
          calldatas.push(whitelistCalldata);
        }

        const createStreamsCalldata = encodeFunctionData({
          abi: SablierV2BatchAbi,
          functionName: 'createWithDurationsLT',
          args: [
            sablierV2LockupTranched,
            tokenAddress,
            tokenStreams.map(stream => ({
              sender: safe?.address,
              recipient: getAddress(stream.recipientAddress),
              totalAmount: stream.totalAmount.bigintValue!,
              broker: {
                account: zeroAddress,
                fee: 0n,
              },
              cancelable: stream.cancelable,
              transferable: stream.transferable,
              tranches: stream.tranches.map(tranche => ({
                amount: tranche.amount.bigintValue!,
                duration: Number(tranche.duration.bigintValue!),
              })),
            })),
          ],
        });

        targets.push(sablierV2Batch);
        txValues.push(0n);
        calldatas.push(createStreamsCalldata);
      });

      return {
        targets,
        values: txValues,
        calldatas,
        metaData: proposalMetadata,
      };
    },
    [loadTokenState, sablierV2Batch, sablierV2LockupTranched, safe?.address],
  );

  const HEADER_HEIGHT = useHeaderHeight();

  if (!type || !safe?.address || !safe) {
    return (
      <Center minH={`calc(100vh - ${HEADER_HEIGHT})`}>
        <BarLoader />
      </Center>
    );
  }

  const fungibleNonNativeAssetsWithBalance = filterSpamTokens(assetsFungible);
  if (!fungibleNonNativeAssetsWithBalance.length) {
    return (
      <NoDataCard
        emptyText="noAssetsWithBalance"
        emptyTextNotProposer="noAssetsWithBalanceNotProposer"
        translationNameSpace="modals"
      />
    );
  }
  const defaultTokenAddress = fungibleNonNativeAssetsWithBalance[0].tokenAddress;
  const sablierProposalInitialValues: CreateSablierProposalForm = {
    ...DEFAULT_SABLIER_PROPOSAL,
    proposalMetadata: {
      ...DEFAULT_SABLIER_PROPOSAL.proposalMetadata,
      nonce: safe.nextNonce,
      ...(actionsProposalMetadata && { ...actionsProposalMetadata }),
    },
    streams: DEFAULT_SABLIER_PROPOSAL.streams.map(s => {
      return {
        ...s,
        tokenAddress: defaultTokenAddress,
      };
    }),
  };

  const pageHeaderBreadcrumbs = [
    {
      terminus: t('proposals', { ns: 'breadcrumbs' }),
      path: DAO_ROUTES.dao.relative(addressPrefix, safe.address),
    },
    {
      terminus: t('proposalNew', { ns: 'breadcrumbs' }),
      path: '',
    },
  ];

  const pageHeaderButtonClickHandler = () => {
    navigate(DAO_ROUTES.dao.relative(addressPrefix, safe.address));
  };

  const stepButtons = ({
    formErrors,
    onStepChange,
  }: {
    formErrors: boolean;
    createProposalBlocked: boolean;
    onStepChange: (step: CreateProposalSteps) => void;
  }) => (
    <GoToTransactionsStepButton
      isDisabled={formErrors}
      onStepChange={onStepChange}
    />
  );

  return (
    <ProposalBuilder
      initialValues={sablierProposalInitialValues}
      pageHeaderTitle={t('createProposal', { ns: 'proposal' })}
      pageHeaderBreadcrumbs={pageHeaderBreadcrumbs}
      pageHeaderButtonClickHandler={pageHeaderButtonClickHandler}
      proposalMetadataTypeProps={DEFAULT_PROPOSAL_METADATA_TYPE_PROPS(t)}
      stepButtons={stepButtons}
      transactionsDetails={null}
      templateDetails={null}
      streamsDetails={streams => <StreamsDetails streams={streams} />}
      prepareProposalData={prepareProposalData}
      mainContent={(formikProps, pendingCreateTx, nonce, currentStep) => {
        if (currentStep !== CreateProposalSteps.TRANSACTIONS) return null;
        return (
          <ProposalStreams
            pendingTransaction={pendingCreateTx}
            {...formikProps}
            values={formikProps.values as CreateSablierProposalForm}
            defaultTokenAddress={defaultTokenAddress}
          />
        );
      }}
    />
  );
}
