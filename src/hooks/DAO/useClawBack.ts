import { abis } from '@fractal-framework/fractal-contracts';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  Address,
  encodeAbiParameters,
  encodeFunctionData,
  erc20Abi,
  getAddress,
  parseAbiParameters,
} from 'viem';
import { logError } from '../../helpers/errorLogging';
import useBalancesAPI from '../../providers/App/hooks/useBalancesAPI';
import { useSafeAPI } from '../../providers/App/hooks/useSafeAPI';
import { FractalModuleType, DecentModule } from '../../types';
import { useCanUserCreateProposal } from '../utils/useCanUserSubmitProposal';
import useSubmitProposal from './proposal/useSubmitProposal';

interface IUseClawBack {
  childSafeInfo: {
    daoAddress?: Address;
    modules: DecentModule[] | null;
  };
  parentAddress: Address | null;
}

export default function useClawBack({ childSafeInfo, parentAddress }: IUseClawBack) {
  const { t } = useTranslation(['proposal', 'proposalMetadata']);
  const safeAPI = useSafeAPI();
  const { submitProposal } = useSubmitProposal();
  const { getCanUserCreateProposal } = useCanUserCreateProposal();
  const { getTokenBalances } = useBalancesAPI();

  const handleClawBack = useCallback(async () => {
    if (childSafeInfo.daoAddress && parentAddress && safeAPI) {
      try {
        const childSafeTokenBalance = await getTokenBalances(childSafeInfo.daoAddress);

        if (childSafeTokenBalance.error || !childSafeTokenBalance.data) {
          toast.error(t('clawBackBalancesError', { duration: Infinity }));
          return;
        }

        if (childSafeTokenBalance.data.length === 0) {
          toast.error(t('clawBackEmptyTreasuryError', { duration: Infinity }));
          return;
        }

        const parentSafeInfo = await safeAPI.getSafeData(parentAddress);
        const canUserCreateProposal = await getCanUserCreateProposal(parentAddress);

        if (canUserCreateProposal && parentAddress && parentSafeInfo && childSafeInfo.modules) {
          const fractalModule = childSafeInfo.modules!.find(
            module => module.moduleType === FractalModuleType.FRACTAL,
          );

          if (fractalModule) {
            const transactions = childSafeTokenBalance.data
              .filter(tokenBalance => !tokenBalance.possibleSpam)
              .map(asset => {
                if (!asset.nativeToken) {
                  // We're operating with native coin e.g. ETH
                  const fractalModuleCalldata = encodeFunctionData({
                    abi: abis.FractalModule,
                    functionName: 'execTx',
                    args: [
                      encodeAbiParameters(parseAbiParameters('address, uint256, bytes, uint8'), [
                        parentAddress,
                        BigInt(asset.balance),
                        '0x',
                        0,
                      ]),
                    ],
                  });

                  return {
                    target: fractalModule.moduleAddress,
                    value: 0n,
                    calldata: fractalModuleCalldata,
                  };
                } else {
                  const clawBackCalldata = encodeFunctionData({
                    abi: erc20Abi,
                    functionName: 'transfer',
                    args: [parentAddress, BigInt(asset.balance)] as const,
                  });

                  const txData = encodeAbiParameters(
                    parseAbiParameters('address, uint256, bytes, uint8'),
                    [asset.tokenAddress, 0n, clawBackCalldata, 0],
                  );

                  const fractalModuleCalldata = encodeFunctionData({
                    abi: abis.FractalModule,
                    functionName: 'execTx',
                    args: [txData],
                  });

                  return {
                    target: fractalModule.moduleAddress,
                    value: 0n,
                    calldata: fractalModuleCalldata,
                  };
                }
              });

            if (transactions.length === 0) {
              toast.error(t('clawBackEmptyTransactionsError', { duration: Infinity }));
              return;
            }

            await submitProposal({
              proposalData: {
                metaData: {
                  title: t('clawbackProposal', { ns: 'proposalMetadata' }),
                  description: t('clawbackDescription', {
                    ns: 'proposalMetadata',
                  }),
                  documentationUrl: '',
                },
                targets: transactions.map(tx => tx.target),
                values: transactions.map(tx => tx.value),
                calldatas: transactions.map(tx => tx.calldata),
              },
              nonce: parentSafeInfo.nonce,
              pendingToastMessage: t('clawBackPendingToastMessage'),
              failedToastMessage: t('clawBackFailedToastMessage'),
              successToastMessage: t('clawBackSuccessToastMessage'),
              safeAddress: getAddress(parentAddress),
            });
          } else {
            // @dev - User shouldn't get into this case, but better safe than sorry. We're enforcing types here
            throw new Error(
              'Could not find FractalModule on child Safe - clawback is not possible without FractalModule',
            );
          }
        } else {
          // @dev - Either error on fetching parent safe info or user is not eligible for creating proposals on parent safe
          throw new Error(
            'Parent safe info is missing or user can not create proposals on parent safe',
          );
        }
      } catch (e) {
        logError('Unexpected error while preparing clawback proposal', e);
        toast.error(t('clawBackFailedToastMessage'));
      }
    }
  }, [
    childSafeInfo.daoAddress,
    childSafeInfo.modules,
    parentAddress,
    safeAPI,
    getTokenBalances,
    getCanUserCreateProposal,
    t,
    submitProposal,
  ]);

  return { handleClawBack };
}
