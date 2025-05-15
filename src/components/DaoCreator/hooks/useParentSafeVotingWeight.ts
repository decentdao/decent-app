import { useEffect, useState } from 'react';
import { formatUnits } from 'viem';
import { useCurrentDAOKey } from '../../../hooks/DAO/useCurrentDAOKey';
import { useGlobalStore } from '../../../store/store';
import { AzoriusGovernance, GovernanceType } from '../../../types/fractal';

export const useParentSafeVotingWeight = () => {
  const { daoKey } = useCurrentDAOKey();
  const { getGovernance, getDaoNode } = useGlobalStore();
  const [parentVotingQuorum, setParentVotingQuorum] = useState<bigint>();
  const [totalParentVotingWeight, setTotalParentVotingWeight] = useState<bigint>();

  useEffect(() => {
    if (!daoKey) {
      return;
    }
    const governance = getGovernance(daoKey);
    const safe = getDaoNode(daoKey).safe;
    if (!safe) {
      return;
    }

    switch (governance.type) {
      case GovernanceType.AZORIUS_ERC20:
      case GovernanceType.AZORIUS_ERC721:
        const governanceAzorius = governance as AzoriusGovernance;

        if (governance.isAzorius === false || !governanceAzorius.votingStrategy) {
          return;
        }

        // Setup Azorius parent total voting weight
        if (governanceAzorius.votesToken) {
          const totalSupplyFormatted = formatUnits(
            governanceAzorius.votesToken.totalSupply,
            governanceAzorius.votesToken.decimals,
          );

          if (totalSupplyFormatted.indexOf('.') === -1) {
            setTotalParentVotingWeight(BigInt(totalSupplyFormatted));
          } else {
            const supplyWithoutDecimals = totalSupplyFormatted.substring(
              0,
              totalSupplyFormatted.indexOf('.'),
            );
            setTotalParentVotingWeight(BigInt(supplyWithoutDecimals));
          }
        } else if (governanceAzorius.erc721Tokens) {
          const totalVotingWeight = governanceAzorius.erc721Tokens.reduce(
            (prev, curr) => curr.votingWeight * (curr.totalSupply || 1n) + prev,
            0n,
          );

          setTotalParentVotingWeight(totalVotingWeight);
        }

        // Setup Azorius parent voting quorum
        const quorumThreshold =
          governanceAzorius.votingStrategy.quorumThreshold?.value ||
          governanceAzorius.votingStrategy.quorumPercentage?.value;
        if (!quorumThreshold) {
          throw new Error('Parent voting quorum is undefined');
        }
        setParentVotingQuorum(quorumThreshold);

        break;

      case GovernanceType.MULTISIG:
        setTotalParentVotingWeight(BigInt(safe.owners.length));
        setParentVotingQuorum(BigInt(safe.threshold));
    }
  }, [daoKey, getGovernance, getDaoNode]);

  return {
    totalParentVotingWeight,
    parentVotingQuorum,
  };
};
