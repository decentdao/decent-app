import { Box, Button, Flex, Link } from '@chakra-ui/react';
import { ArrowUpRight } from '@phosphor-icons/react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Shield } from '../../assets/theme/custom/icons/Shield';
import useSnapshotProposal from '../../hooks/DAO/loaders/snapshot/useSnapshotProposal';
import { useGetMetadata } from '../../hooks/DAO/proposal/useGetMetadata';
import { useDaoInfoStore } from '../../store/daoInfo/useDaoInfoStore';
import { ExtendedSnapshotProposal, FractalProposal } from '../../types';
import { ActivityDescription } from '../Activity/ActivityDescription';
import { Badge } from '../ui/badges/Badge';
import { SnapshotButton } from '../ui/badges/Snapshot';
import { ModalType } from '../ui/modals/ModalProvider';
import { useDecentModal } from '../ui/modals/useDecentModal';
import { ProposalCountdown } from '../ui/proposal/ProposalCountdown';
import ProposalExecutableCode from '../ui/proposal/ProposalExecutableCode';
import CeleryButtonWithIcon from '../ui/utils/CeleryButtonWithIcon';

export function ProposalInfo({
  proposal,
}: {
  proposal: FractalProposal | ExtendedSnapshotProposal;
}) {
  const metaData = useGetMetadata(proposal);
  const { t } = useTranslation('proposal');
  const { daoSnapshotENS } = useDaoInfoStore();
  const { snapshotProposal } = useSnapshotProposal(proposal);

  const [modalType, props] = useMemo(() => {
    if (!metaData.documentationUrl) {
      return [ModalType.NONE] as const;
    }
    return [
      ModalType.CONFIRM_URL,
      {
        url: metaData.documentationUrl,
      },
    ] as const;
  }, [metaData.documentationUrl]);

  const confirmUrl = useDecentModal(modalType, props);

  return (
    <Box
      borderRadius={8}
      border="1px solid"
      borderColor="neutral-3"
      padding="1.5rem"
    >
      <Flex
        gap={2}
        alignItems="center"
      >
        {proposal.state && (
          <Badge
            size="base"
            labelKey={proposal.state}
          />
        )}
        <ProposalCountdown
          proposal={proposal}
          showIcon={false}
          textColor="neutral-7"
        />
        {snapshotProposal && (
          <>
            <SnapshotButton
              snapshotENS={`${daoSnapshotENS}/proposal/${snapshotProposal.proposalId}`}
            />
            {(proposal as ExtendedSnapshotProposal).privacy === 'shutter' && (
              <Button
                as={Link}
                target="_blank"
                href="https://blog.shutter.network/announcing-shutter-governance-shielded-voting-for-daos/"
                variant="secondary"
                h={6}
                w={32}
              >
                <Shield
                  width="16px"
                  height="16px"
                  mr={1}
                />
                {t('shutterPrivacy')}
              </Button>
            )}
          </>
        )}
      </Flex>
      <Box mt={4}>
        <ActivityDescription
          activity={proposal}
          showFullDescription
          showAuthor={false}
        />
        {metaData.documentationUrl && (
          <CeleryButtonWithIcon
            iconPosition="end"
            icon={ArrowUpRight}
            onClick={confirmUrl}
            text={metaData.documentationUrl}
          />
        )}
        <ProposalExecutableCode proposal={proposal} />
      </Box>
    </Box>
  );
}
