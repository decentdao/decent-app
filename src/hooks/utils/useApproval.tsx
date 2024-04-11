import { VotesERC20, VotesERC20Wrapper } from '@fractal-framework/fractal-contracts';
import { BigNumber } from 'ethers';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAccount } from 'wagmi';
import { useTransaction } from './useTransaction';

const useApproval = (
  tokenContract?: VotesERC20 | VotesERC20Wrapper,
  spenderAddress?: string,
  userBalance?: BigNumber | null,
) => {
  const { address: account } = useAccount();
  const [allowance, setAllowance] = useState(BigNumber.from(0));
  const [approved, setApproved] = useState(false);
  const [contractCall, pending] = useTransaction();
  const { t } = useTranslation('treasury');

  const fetchAllowance = useCallback(async () => {
    if (!tokenContract || !account || !spenderAddress) return;

    const userAllowance = await tokenContract.allowance(account, spenderAddress);
    setAllowance(userAllowance);
  }, [account, tokenContract, spenderAddress]);

  const approveTransaction = useCallback(async () => {
    if (!tokenContract || !account || !spenderAddress) return;

    contractCall({
      contractFn: () => tokenContract.approve(spenderAddress, BigNumber.from(2).pow(256).sub(1)),
      pendingMessage: t('approvalPendingMessage'),
      failedMessage: t('approvalFailedMessage'),
      successMessage: t('approvalSuccessMessage'),
      successCallback: () => {
        setApproved(true);
      },
    });
  }, [account, contractCall, tokenContract, spenderAddress, t]);

  useEffect(() => {
    fetchAllowance();
  }, [fetchAllowance]);

  useEffect(() => {
    setApproved(!allowance.isZero() || (!!userBalance && !userBalance.gt(allowance)));
  }, [allowance, userBalance]);

  return { approved, allowance, approveTransaction, pending };
};

export default useApproval;
