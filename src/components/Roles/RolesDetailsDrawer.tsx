import {
  Badge,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerOverlay,
  Flex,
  Grid,
  GridItem,
  Icon,
  IconButton,
  Text,
} from '@chakra-ui/react';
import { CheckSquare, List, User, X } from '@phosphor-icons/react';
import { RefObject, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import PencilWithLineIcon from '../../assets/theme/custom/icons/PencilWithLineIcon';
import { BACKGROUND_SEMI_TRANSPARENT } from '../../constants/common';
import { useCurrentDAOKey } from '../../hooks/DAO/useCurrentDAOKey';
import { useNetworkEnsAvatar } from '../../hooks/useNetworkEnsAvatar';
import useAddress from '../../hooks/utils/useAddress';
import { useCanUserCreateProposal } from '../../hooks/utils/useCanUserSubmitProposal';
import { useCopyText } from '../../hooks/utils/useCopyText';
import { useGetAccountName } from '../../hooks/utils/useGetAccountName';
import { useDAOStore } from '../../providers/App/AppProvider';
import {
  paymentSorterByActiveStatus,
  paymentSorterByStartDate,
  paymentSorterByWithdrawAmount,
} from '../../store/roles/rolesStoreUtils';
import { RoleDetailsDrawerProps } from '../../types/roles';
import { BarLoader } from '../ui/loaders/BarLoader';
import ModalTooltip from '../ui/modals/ModalTooltip';
import Avatar from '../ui/page/Header/Avatar';
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
        color="color-green-400"
        bgColor="color-green-950"
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
        textStyle="text-sm-medium"
        color="color-neutral-300"
      >
        {label}
      </Text>
    </Flex>
  );
}

export default function RolesDetailsDrawer({
  roleHat,
  onClose,
  isOpen = true,
  onEdit,
}: RoleDetailsDrawerProps) {
  const { daoKey } = useCurrentDAOKey();
  const {
    node: { safe },
  } = useDAOStore({ daoKey });
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
    <Drawer
      placement="right"
      onClose={onClose ?? (() => {})}
      isOpen={isOpen}
    >
      <DrawerOverlay
        bg={BACKGROUND_SEMI_TRANSPARENT}
        backdropFilter="auto"
        backdropBlur="10px"
      />
      <DrawerContent
        minW="50%"
        bg="color-neutral-950"
        pt="1rem"
      >
        <DrawerBody h="100vh">
          <Flex
            justifyContent="space-between"
            my="1rem"
          >
            <IconButton
              variant="tertiary"
              size="icon-sm"
              aria-label="Close Drawer"
              as={X}
              cursor="pointer"
              onClick={onClose}
            />
            <Flex
              gap="0.5rem"
              alignItems="center"
            >
              {/* @todo add `...` Menu? */}
              {canUserCreateProposal && (
                <IconButton
                  variant="tertiary"
                  size="icon-sm"
                  aria-label="Edit Role"
                  cursor="pointer"
                  as={PencilWithLineIcon}
                  onClick={() => onEdit(roleHat.id)}
                />
              )}
            </Flex>
          </Flex>
          <Text
            textStyle="text-3xl-regular"
            color="color-white"
            my="1rem"
          >
            {roleHat.name}
          </Text>
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
                bg="color-neutral-900"
                color="color-lilac-100"
                _hover={{
                  color: 'color-white',
                  bg: 'color-neutral-800',
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
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
