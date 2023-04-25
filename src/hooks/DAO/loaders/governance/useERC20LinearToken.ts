import { VotesToken } from '@fractal-framework/fractal-contracts';
import { useCallback, useEffect, useRef } from 'react';
import { useProvider } from 'wagmi';
import { getEventRPC } from '../../../../helpers';
import { useFractal } from '../../../../providers/App/AppProvider';
import { FractalGovernanceAction } from '../../../../providers/App/governance/action';
export const useERC20LinearToken = ({ onMount = true }: { onMount?: boolean }) => {
  const isTokenLoaded = useRef(false);
  const tokenAccount = useRef<string>();

  const {
    governanceContracts: { tokenContract, underlyingTokenAddress },
    action,
    readOnly: { user },
  } = useFractal();
  const account = user.address;

  const {
    network: { chainId },
  } = useProvider();

  const loadERC20Token = useCallback(async () => {
    if (!tokenContract) {
      return;
    }
    const tokenAddress = tokenContract.asSigner.address;

    const [tokenName, tokenSymbol, tokenDecimals, totalSupply] = await Promise.all([
      tokenContract.asSigner.name(),
      tokenContract.asSigner.symbol(),
      tokenContract.asSigner.decimals(),
      tokenContract.asSigner.totalSupply(),
    ]);
    const tokenData = {
      name: tokenName,
      symbol: tokenSymbol,
      decimals: tokenDecimals,
      address: tokenAddress,
      totalSupply,
    };
    isTokenLoaded.current = true;
    action.dispatch({ type: FractalGovernanceAction.SET_TOKEN_DATA, payload: tokenData });
  }, [tokenContract, action]);

  const loadUnderlyingERC20Token = useCallback(async () => {
    if (!tokenContract || !underlyingTokenAddress) {
      return;
    }

    const erc20WrapperContract = tokenContract.asSigner.attach(underlyingTokenAddress);

    const [tokenName, tokenSymbol] = await Promise.all([
      erc20WrapperContract.name(),
      erc20WrapperContract.symbol(),
    ]);
    const tokenData = {
      name: tokenName,
      symbol: tokenSymbol,
      address: underlyingTokenAddress,
    };
    action.dispatch({
      type: FractalGovernanceAction.SET_UNDERLYING_TOKEN_DATA,
      payload: tokenData,
    });
  }, [tokenContract, underlyingTokenAddress, action]);

  const loadERC20TokenAccountData = useCallback(async () => {
    if (!tokenContract || !account) {
      action.dispatch({ type: FractalGovernanceAction.RESET_TOKEN_ACCOUNT_DATA });
      return;
    }
    // @todo We could probably save on some requests here.
    const [tokenBalance, tokenDelegatee, tokenVotingWeight, delegateChangeEvents] =
      await Promise.all([
        tokenContract.asSigner.balanceOf(account),
        tokenContract.asSigner.delegates(account),
        tokenContract.asSigner.getVotes(account),
        tokenContract.asSigner.queryFilter(tokenContract.asSigner.filters.DelegateChanged()),
      ]);
    const tokenAccountData = {
      balance: tokenBalance,
      delegatee: tokenDelegatee,
      votingWeight: tokenVotingWeight,
      isDelegatesSet: delegateChangeEvents.length > 0,
    };

    action.dispatch({
      type: FractalGovernanceAction.SET_TOKEN_ACCOUNT_DATA,
      payload: tokenAccountData,
    });
  }, [tokenContract, action, account]);

  useEffect(() => {
    if (
      tokenContract &&
      isTokenLoaded.current &&
      tokenAccount.current !== account + tokenContract.asSigner.address &&
      onMount
    ) {
      tokenAccount.current = account + tokenContract.asSigner.address;
      loadERC20TokenAccountData();
    }
  }, [account, tokenContract, onMount, loadERC20TokenAccountData]);

  useEffect(() => {
    if (!tokenContract || !onMount) {
      return;
    }
    const rpc = getEventRPC<VotesToken>(tokenContract, chainId);
    const delegateVotesChangedfilter = rpc.filters.DelegateVotesChanged();
    const delegateChangedfilter = rpc.filters.DelegateChanged();
    rpc.on(delegateVotesChangedfilter, loadERC20TokenAccountData);
    rpc.on(delegateChangedfilter, loadERC20TokenAccountData);

    return () => {
      rpc.off(delegateVotesChangedfilter, loadERC20TokenAccountData);
      rpc.off(delegateChangedfilter, loadERC20TokenAccountData);
    };
  }, [tokenContract, chainId, loadERC20TokenAccountData, onMount]);

  useEffect(() => {
    if (!tokenContract || !account || !onMount) {
      return;
    }
    const rpc = getEventRPC<VotesToken>(tokenContract, chainId);
    const filterTo = rpc.filters.Transfer(null, account);
    const filterFrom = rpc.filters.Transfer(account, null);
    rpc.on(filterTo, loadERC20TokenAccountData);
    rpc.on(filterFrom, loadERC20TokenAccountData);
    return () => {
      rpc.off(filterTo, loadERC20TokenAccountData);
      rpc.off(filterFrom, loadERC20TokenAccountData);
    };
  }, [tokenContract, chainId, account, onMount, loadERC20TokenAccountData]);

  return { loadERC20Token, loadUnderlyingERC20Token, loadERC20TokenAccountData };
};
