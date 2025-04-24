import { abis } from '@fractal-framework/fractal-contracts';
import { useEffect, useState } from 'react';
import { Address, getAbiItem, getContract, Hex, toFunctionSelector } from 'viem';
import { useStore } from '../../../providers/App/AppProvider.js';
import { useNetworkConfigStore } from '../../../providers/NetworkConfig/useNetworkConfigStore';
import { useDaoInfoStore } from '../../../store/daoInfo/useDaoInfoStore';
import { FractalTokenType } from '../../../types/fractal.js';
import useNetworkPublicClient from '../../useNetworkPublicClient';
import { useCurrentDAOKey } from '../useCurrentDAOKey.js';

export function usePaymasterValidatorStatus() {
  const [isValidatorSet, setIsValidatorSet] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const { paymasterAddress } = useDaoInfoStore();
  const publicClient = useNetworkPublicClient();
  const { contracts } = useNetworkConfigStore();

  const { daoKey } = useCurrentDAOKey();
  const { governanceContracts } = useStore({ daoKey });

  useEffect(() => {
    const checkValidatorStatus = async () => {
      setIsLoading(true);

      const strategies = governanceContracts.strategies;

      if (!paymasterAddress || strategies.length === 0) {
        setIsValidatorSet(false);
        setIsLoading(false);
        return;
      }

      try {
        const paymasterContract = getContract({
          address: paymasterAddress,
          abi: abis.DecentPaymasterV1,
          client: publicClient,
        });

        let anyValidatorSet = false;
        for (const strategy of strategies) {
          let validatorAddress: Address | undefined;
          let selector: Hex | undefined;
          if (strategy.type === FractalTokenType.erc20) {
            validatorAddress = contracts.paymaster.linearERC20VotingV1ValidatorV1;
            selector = toFunctionSelector(
              getAbiItem({ abi: abis.LinearERC20VotingV1, name: 'vote' }),
            );
          } else if (strategy.type === FractalTokenType.erc721) {
            validatorAddress = contracts.paymaster.linearERC721VotingV1ValidatorV1;
            selector = toFunctionSelector(
              getAbiItem({ abi: abis.LinearERC721VotingV1, name: 'vote' }),
            );
          }

          if (!validatorAddress || !selector) continue;

          const registeredValidator = await paymasterContract.read.getFunctionValidator([
            strategy.address,
            selector,
          ]);

          // Check if the *expected* validator is registered
          if (registeredValidator === validatorAddress) {
            anyValidatorSet = true;
            break; // Found at least one valid validator, no need to check others
          }
        }
        setIsValidatorSet(anyValidatorSet);
      } catch (error) {
        setIsValidatorSet(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkValidatorStatus();
  }, [
    contracts.paymaster.linearERC20VotingV1ValidatorV1,
    contracts.paymaster.linearERC721VotingV1ValidatorV1,
    governanceContracts.strategies,
    paymasterAddress,
    publicClient,
  ]);

  return { isValidatorSet, isLoading };
}
