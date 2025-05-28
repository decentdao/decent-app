import { Box, Flex, Text } from '@chakra-ui/react';
import { Scroll } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { useCurrentDAOKey } from '../../../hooks/DAO/useCurrentDAOKey';
import { useDAOStore } from '../../../providers/App/AppProvider';
import {
  FractalProposal,
  FractalProposalState,
  GovernanceType,
  SnapshotProposal,
} from '../../../types';
import { BarLoader } from '../../ui/loaders/BarLoader';

const isSnapshotProposal = (proposal: FractalProposal) => {
  const snapshotProposal = proposal as SnapshotProposal;
  return !!snapshotProposal.snapshotProposalId;
};

const snapshotProposals = (proposals: FractalProposal[]) => {
  return proposals.filter(proposal => isSnapshotProposal(proposal));
};

const nonSnapshotProposals = (proposals: FractalProposal[]) => {
  return proposals.filter(proposal => !isSnapshotProposal(proposal));
};

const totalProposalsCount = (
  proposals: FractalProposal[] | null,
  type: GovernanceType | undefined,
) => {
  if (!proposals) {
    return undefined;
  }

  switch (type) {
    case GovernanceType.MULTISIG: {
      // Multisig proposals (onchain) and Snapshot proposals (offchain)
      // are all loaded "at once", so just return the length of this set.
      return proposals.length;
    }
    case GovernanceType.AZORIUS_ERC20:
    case GovernanceType.AZORIUS_ERC721: {
      // First, we want to first filter out all of the Snapshot proposals...
      const nonSnapshot = nonSnapshotProposals(proposals);

      // Then, find the highest ID from the Azorius proposals...
      const highestNonSnapshotProposalId = nonSnapshot.reduce((p, c) => {
        // Remember, proposal IDs are one-indexed!
        const propId = Number(c.proposalId) + 1;
        if (propId > p) {
          return propId;
        }
        return p;
      }, 0);

      // Then, return the highest Azorius proposal ID
      // plus the number of Snapshot proposals.
      return highestNonSnapshotProposalId + proposals.length - nonSnapshot.length;
    }
    default: {
      return 0;
    }
  }
};

const isActiveProposal = (proposal: FractalProposal) => {
  return (
    proposal.state === FractalProposalState.ACTIVE ||
    proposal.state === FractalProposalState.EXECUTABLE
  );
};

const activeProposals = (proposals: FractalProposal[]) => {
  return proposals.filter(proposal => isActiveProposal(proposal));
};

const nonActiveProposals = (proposals: FractalProposal[]) => {
  return proposals.filter(proposal => !isActiveProposal(proposal));
};

const allActiveProposalsCount = (
  proposals: FractalProposal[] | null,
  type: GovernanceType | undefined,
) => {
  if (!proposals) {
    return undefined;
  }

  switch (type) {
    case GovernanceType.MULTISIG: {
      return activeProposals(proposals).length;
    }
    case GovernanceType.AZORIUS_ERC20:
    case GovernanceType.AZORIUS_ERC721: {
      const allNonSnapshotProposals = nonSnapshotProposals(proposals);
      const activeNonSnapshotProposals = activeProposals(allNonSnapshotProposals);
      const activeSnapshotProposals = activeProposals(snapshotProposals(proposals));

      if (nonActiveProposals(allNonSnapshotProposals).length > 0) {
        // If we're here, we've loaded proposals to a point where at least one is not active,
        // which means the chances are pretty darn low that there are any more
        // active proposals after this one. So return a value!
        return activeNonSnapshotProposals.length + activeSnapshotProposals.length;
      } else {
        // Getting here means that all of the loaded proposals so far are active
        // or there are no non-Snapshot proposals.
        const totalNonSnapshotProposalsCount = totalProposalsCount(allNonSnapshotProposals, type);
        if (totalNonSnapshotProposalsCount === activeNonSnapshotProposals.length) {
          // If we're here, then all of the proposals on this Safe are active, or there are zero of them!
          return activeNonSnapshotProposals.length + activeSnapshotProposals.length;
        } else {
          // In here, proposals are still loading and all of them so far are active.
          return undefined;
        }
      }
    }
    default: {
      return 0;
    }
  }
};

export function InfoProposals() {
  const { t } = useTranslation('dashboard');
  const { daoKey } = useCurrentDAOKey();
  const {
    governance: { proposals, type },
    node: { safe },
  } = useDAOStore({ daoKey });

  if (!safe?.address || !type) {
    return (
      <Flex
        h="8.5rem"
        width="100%"
        alignItems="center"
        justifyContent="center"
      >
        <BarLoader />
      </Flex>
    );
  }

  const totalProposalsValue = totalProposalsCount(proposals, type);
  const totalProposalsDisplay =
    totalProposalsValue === undefined ? '...' : totalProposalsValue.toString();

  const activeProposalsValue = allActiveProposalsCount(proposals, type);
  const activeProposalsDisplay =
    activeProposalsValue === undefined ? '...' : activeProposalsValue.toString();

  return (
    <Box data-testid="dashboard-daoProposals">
      <Flex
        alignItems="center"
        gap="0.4rem"
        mb="0.5rem"
      >
        <Scroll size="1.5rem" />
        <Text textStyle="text-xl-regular">{t('titleProposals')}</Text>
      </Flex>

      <Flex
        alignItems="center"
        justifyContent="space-between"
        mb="0.25rem"
        gap="0.5rem"
      >
        <Text color="color-neutral-300">{t('titleTotal')}</Text>
        <Text>{totalProposalsDisplay}</Text>
      </Flex>
      <Flex
        alignItems="center"
        justifyContent="space-between"
        mb="0.25rem"
        gap="0.5rem"
      >
        <Text color="color-neutral-300">{t('titleActive')}</Text>
        <Text>{activeProposalsDisplay}</Text>
      </Flex>
    </Box>
  );
}
