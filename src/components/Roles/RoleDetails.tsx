import { Badge, Box, Button, Flex, Grid, GridItem, Icon, Text } from '@chakra-ui/react';
import { ArrowLeft, CheckSquare, List, User } from '@phosphor-icons/react';
import { RefObject, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import PencilWithLineIcon from '../../assets/theme/custom/icons/PencilWithLineIcon';
import { DAO_ROUTES } from '../../constants/routes';
import { useNetworkEnsAvatar } from '../../hooks/useNetworkEnsAvatar';
import useAddress from '../../hooks/utils/useAddress';
import { useCanUserCreateProposal } from '../../hooks/utils/useCanUserSubmitProposal';
import { useCopyText } from '../../hooks/utils/useCopyText';
import { useGetAccountName } from '../../hooks/utils/useGetAccountName';
import { useNetworkConfigStore } from '../../providers/NetworkConfig/useNetworkConfigStore';
import { useDaoInfoStore } from '../../store/daoInfo/useDaoInfoStore';
import {
  paymentSorterByActiveStatus,
  paymentSorterByStartDate,
  paymentSorterByWithdrawAmount,
} from '../../store/roles/rolesStoreUtils';
import {
  RoleDetailsDrawerEditingRoleHatProp,
  RoleDetailsDrawerRoleHatProp,
} from '../../types/roles';
import { BarLoader } from '../ui/loaders/BarLoader';
import ModalTooltip from '../ui/modals/ModalTooltip';
import Avatar from '../ui/page/Header/Avatar';
import PageHeader from '../ui/page/Header/PageHeader';
import Markdown from '../ui/proposal/Markdown';
import Divider from '../ui/utils/Divider';
import RoleDetailsTabs from './RoleDetailsTabs';

export function RoleProposalPermissionBadge({
  containerRef,
}: {
  containerRef: RefObject<HTMLDivElement>;
}) {
  const { t } = useTranslation('roles');
  return (
    <ModalTooltip
      containerRef={containerRef}
      label={t('permissionsProposalsTooltip')}
    >
      <Badge
        color="celery-0"
        bgColor="celery--6"
        textTransform="unset"
        fontSize="1rem"
        lineHeight="1.5rem"
        fontWeight="normal"
        borderRadius="0.25rem"
        px="0.5rem"
      >
        {t('permissionsProposals')}
      </Badge>
    </ModalTooltip>
  );
}
function RoleAndDescriptionLabel({ label, icon }: { label: string; icon: React.ElementType }) {
  return (
    <Flex
      gap="0.5rem"
      alignItems="center"
    >
      <Icon as={icon} />
      <Text
        textStyle="labels-large"
        color="neutral-7"
      >
        {label}
      </Text>
    </Flex>
  );
}

export default function RolesDetails({
  roleHat,
}: {
  roleHat: RoleDetailsDrawerRoleHatProp | RoleDetailsDrawerEditingRoleHatProp;
}) {
  const { safe } = useDaoInfoStore();
  const navigate = useNavigate();
  const { addressPrefix } = useNetworkConfigStore();
  const permissionsContainerRef = useRef<HTMLDivElement>(null);

  const roleHatWearer = 'wearer' in roleHat ? roleHat.wearer : roleHat.wearerAddress;

  const { address: roleHatWearerAddress, isLoading: loadingRoleHatWearerAddress } =
    useAddress(roleHatWearer);

  const { displayName } = useGetAccountName(roleHatWearerAddress);

  const { t } = useTranslation(['roles']);
  const { data: avatarURL } = useNetworkEnsAvatar({ name: roleHatWearer });

  const sortedPayments = useMemo(
    () =>
      roleHat.payments
        ? [...roleHat.payments]
            .sort(paymentSorterByWithdrawAmount)
            .sort(paymentSorterByStartDate)
            .sort(paymentSorterByActiveStatus)
        : [],
    [roleHat.payments],
  );

  const { canUserCreateProposal } = useCanUserCreateProposal();
  const copyToClipboard = useCopyText();

  if (!safe?.address) return null;

  return (
    <>
      <PageHeader
        breadcrumbs={[
          {
            terminus: t('roles'),
            path: DAO_ROUTES.roles.relative(addressPrefix, safe.address),
          },
          {
            terminus: roleHat.name,
            path: '',
          },
        ]}
        buttonProps={
          canUserCreateProposal
            ? {
                variant: 'secondary',
                size: 'sm',
                leftIcon: (
                  <Box mr="-0.25rem">
                    <PencilWithLineIcon
                      w="1rem"
                      h="1rem"
                    />
                  </Box>
                ),
                gap: 0,
                children: t('editRole'),
                onClick: () => {
                  navigate(
                    DAO_ROUTES.rolesEditDetails.relative(addressPrefix, safe.address, roleHat.id),
                  );
                },
              }
            : undefined
        }
      />
      <Flex justifyContent="space-between">
        <Text
          textStyle="heading-large"
          color="white-0"
          my="1rem"
        >
          {roleHat.name}
        </Text>
        <Button
          variant="tertiary"
          width="min-content"
          color="lilac-0"
          pr={2}
          leftIcon={<ArrowLeft />}
          onClick={() => navigate(DAO_ROUTES.roles.relative(addressPrefix, safe.address))}
        />
      </Flex>
      <Grid
        gridTemplateAreas={`
              "mLabel mValue"
              "dLabel dValue"
              "pLabel pValue"
            `}
        gridRowGap="1rem"
        gridColumnGap="2rem"
        alignItems="center"
      >
        <GridItem area="mLabel">
          <RoleAndDescriptionLabel
            label={t('member')}
            icon={User}
          />
        </GridItem>
        <GridItem area="dLabel">
          <RoleAndDescriptionLabel
            label={t('description')}
            icon={List}
          />
        </GridItem>
        <GridItem area="pLabel">
          {roleHat.canCreateProposals && (
            <RoleAndDescriptionLabel
              label={t('permissions')}
              icon={CheckSquare}
            />
          )}
        </GridItem>
        <GridItem area="mValue">
          <Flex
            alignItems="center"
            gap="0.5rem"
            p="0.25rem 0.5rem"
            ml="-0.75rem"
            rounded="1rem"
            bg="neutral-3"
            color="lilac-0"
            _hover={{
              color: 'white-0',
              bg: 'neutral-4',
            }}
            cursor="pointer"
            maxW="fit-content"
            onClick={() => copyToClipboard(roleHatWearerAddress)}
          >
            {loadingRoleHatWearerAddress || !roleHatWearerAddress ? (
              <BarLoader />
            ) : (
              <Avatar
                size="icon"
                address={roleHatWearerAddress}
                url={avatarURL}
              />
            )}
            <Text>{displayName}</Text>
          </Flex>
        </GridItem>
        <GridItem area="dValue">
          <Markdown
            content={roleHat.description}
            collapsedLines={100}
          />
        </GridItem>
        <GridItem
          area="pValue"
          ref={permissionsContainerRef}
        >
          {roleHat.canCreateProposals && (
            <RoleProposalPermissionBadge containerRef={permissionsContainerRef} />
          )}
        </GridItem>
      </Grid>
      <Divider
        variant="darker"
        my={4}
      />
      <RoleDetailsTabs
        hatId={roleHat.id}
        roleHatSmartAccountAddress={roleHat.smartAddress}
        roleTerms={roleHat.roleTerms}
        roleHatWearerAddress={roleHatWearerAddress}
        sortedPayments={sortedPayments}
      />
    </>
  );
}
