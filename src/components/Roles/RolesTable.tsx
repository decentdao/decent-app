import { Box, Flex, Icon, Table, Tbody, Td, Text, Th, Thead, Tr } from '@chakra-ui/react';
import { useFormikContext } from 'formik';
import { useTranslation } from 'react-i18next';
import { Address, getAddress, Hex } from 'viem';
import PencilWithLineIcon from '../../assets/theme/custom/icons/PencilWithLineIcon';
import { useNetworkEnsAvatar } from '../../hooks/useNetworkEnsAvatar';
import { useGetAccountName } from '../../hooks/utils/useGetAccountName';
import { useRolesStore } from '../../store/roles/useRolesStore';
import {
  DecentTree,
  EditBadgeStatus,
  RoleEditProps,
  RoleFormValues,
  RoleProps,
} from '../../types/roles';
import NoDataCard from '../ui/containers/NoDataCard';
import Avatar from '../ui/page/Header/Avatar';
import EditBadge from './EditBadge';
import { RoleCardLoading } from './RolePageCard';

function RolesHeader() {
  const { t } = useTranslation(['roles']);
  return (
    <Thead
      sx={{
        th: {
          padding: '0.75rem',
          textTransform: 'none',
          fontWeight: 'normal',
        },
      }}
      bg="white-alpha-04"
    >
      <Tr
        textStyle="labels-large"
        color="neutral-7"
      >
        <Th
          width="25%"
          minW="230px"
        >
          {t('role')}
        </Th>
        <Th width="60%">{t('member')}</Th>
        <Th
          width="15%"
          minWidth="140px"
          textAlign="center"
        >
          {t('activePayments')}
        </Th>
      </Tr>
    </Thead>
  );
}

function RoleNameEditColumn({
  roleName,
  editStatus,
}: {
  roleName?: string;
  editStatus?: EditBadgeStatus;
}) {
  return (
    <Td
      width="25%"
      minW="230px"
    >
      <Flex
        alignItems="center"
        justifyContent="space-between"
        gap="1rem"
      >
        <Flex
          alignItems="center"
          justifyContent="space-between"
          w="full"
        >
          <Text color="lilac-0">{roleName}</Text>
          <EditBadge editStatus={editStatus} />
        </Flex>
        <Icon
          className="edit-role-icon"
          as={PencilWithLineIcon}
          color="white-0"
          boxSize="1rem"
          opacity={0}
          transition="opacity 0.3s ease-out"
        />
      </Flex>
    </Td>
  );
}

function MemberColumn({
  wearerAddress,
  isCurrentTermActive,
  isMemberTermPending,
}: {
  isMemberTermPending?: boolean;
  wearerAddress?: Address;
  isCurrentTermActive?: boolean;
}) {
  const { displayName: accountDisplayName } = useGetAccountName(wearerAddress);
  const { data: avatarURL } = useNetworkEnsAvatar({ name: accountDisplayName });

  const { t } = useTranslation('roles');

  // @dev undefined = not termed
  const memberTextColor = isCurrentTermActive === false ? 'neutral-6' : 'white-0';
  const isPendingText = isMemberTermPending ? t('wearerPending') : '';

  const wearerAddressText = wearerAddress
    ? `${accountDisplayName} ${isPendingText}`
    : t('unassigned');

  return (
    <Td width="60%">
      <Flex alignItems="center">
        {wearerAddress ? (
          <Avatar
            size="icon"
            address={wearerAddress}
            url={avatarURL}
          />
        ) : (
          <Box
            boxSize="1.5rem"
            borderRadius="100%"
            bg="white-alpha-04"
          />
        )}
        <Text
          color={memberTextColor}
          ml="0.5rem"
        >
          {wearerAddressText}
        </Text>
      </Flex>
    </Td>
  );
}

function PaymentsColumn({ paymentsCount }: { paymentsCount?: number }) {
  const { t } = useTranslation('common');
  return (
    <Td
      width="15%"
      minWidth="140px"
      textAlign="center"
      color="neutral-5"
    >
      {paymentsCount !== undefined ? (
        <Box
          as="span"
          display="inline-block"
          textStyle="labels-small"
          lineHeight="1rem"
          textAlign="center"
          bg="celery--2"
          color="neutral-3"
          borderColor="neutral-3"
          borderWidth="2px"
          borderRadius="50%"
          w="1.25rem"
          h="1.25rem"
        >
          {paymentsCount}
        </Box>
      ) : (
        t('none')
      )}
    </Td>
  );
}

export function RolesRow({
  name,
  wearerAddress,
  paymentsCount,
  handleRoleClick,
  isCurrentTermActive,
}: RoleProps) {
  return (
    <Tr
      sx={{
        td: { padding: '0.75rem', height: '4rem' },
        '&:hover': {
          '.edit-role-icon': { opacity: 1 },
        },
      }}
      _hover={{ bg: 'neutral-3' }}
      _active={{ bg: 'neutral-2', border: '1px solid', borderColor: 'neutral-3' }}
      transition="all ease-out 300ms"
      cursor="pointer"
      onClick={handleRoleClick}
    >
      <Td
        color="lilac-0"
        width="25%"
        minW="230px"
      >
        {name}
      </Td>
      <MemberColumn
        wearerAddress={wearerAddress}
        isCurrentTermActive={isCurrentTermActive}
      />
      <PaymentsColumn paymentsCount={paymentsCount} />
    </Tr>
  );
}

export function RolesRowEdit({
  name,
  wearerAddress,
  editStatus,
  payments,
  handleRoleClick,
  isCurrentTermActive,
  isMemberTermPending,
}: RoleEditProps) {
  const isRemovedRole = editStatus === EditBadgeStatus.Removed;
  return (
    <Tr
      sx={{
        td: { padding: '0.75rem', height: '4rem' },
        '&:hover': {
          '.edit-role-icon': { opacity: isRemovedRole ? 0 : 1 },
        },
      }}
      _hover={{ bg: 'neutral-3' }}
      _active={{ bg: 'neutral-2', border: '1px solid', borderColor: 'neutral-3' }}
      transition="all ease-out 300ms"
      onClick={!isRemovedRole ? handleRoleClick : undefined}
      cursor={!isRemovedRole ? 'pointer' : 'not-allowed'}
    >
      <RoleNameEditColumn
        roleName={name}
        editStatus={editStatus}
      />
      <MemberColumn
        wearerAddress={wearerAddress}
        isMemberTermPending={isMemberTermPending}
        isCurrentTermActive={isCurrentTermActive}
      />
      <PaymentsColumn paymentsCount={payments?.filter(p => p.isStreaming()).length || undefined} />
    </Tr>
  );
}

export function RolesTable({
  handleRoleClick,
  hatsTree,
}: {
  handleRoleClick: (hatId: Address) => void;
  hatsTree: DecentTree;
}) {
  return (
    <Box
      overflow="hidden"
      borderRadius="0.75rem"
      border="1px solid"
      borderColor="white-alpha-08"
    >
      {hatsTree.roleHats.length && (
        <Table variant="unstyled">
          <RolesHeader />
          <Tbody
            sx={{
              tr: {
                transition: 'all ease-out 300ms',
                borderBottom: '1px solid',
                borderColor: 'white-alpha-08',
              },
              'tr:last-child': {
                borderBottom: 'none',
              },
            }}
          >
            {hatsTree.roleHats.map(role => {
              const isCurrentTermActive = role?.roleTerms.currentTerm?.isActive;

              return (
                <RolesRow
                  key={role.id.toString()}
                  name={role.name}
                  wearerAddress={role.wearerAddress}
                  handleRoleClick={() => handleRoleClick(role.id)}
                  isCurrentTermActive={isCurrentTermActive}
                  paymentsCount={role.payments.filter(p => p.isStreaming()).length || undefined}
                />
              );
            })}
          </Tbody>
        </Table>
      )}
    </Box>
  );
}

export function RolesEditTable({ handleRoleClick }: { handleRoleClick: (hatId: Hex) => void }) {
  const { hatsTree, getHat } = useRolesStore();
  const { values, setFieldValue } = useFormikContext<RoleFormValues>();
  if (hatsTree === undefined) {
    return <RoleCardLoading />;
  }
  if (hatsTree === null && !values.hats.length) {
    return (
      <NoDataCard
        translationNameSpace="roles"
        emptyText="noRoles"
        emptyTextNotProposer="noRolesNotProposer"
      />
    );
  }
  return (
    <Box
      overflow="hidden"
      borderRadius="0.75rem"
      border="1px solid"
      borderColor="white-alpha-08"
    >
      <Table variant="unstyled">
        <RolesHeader />
        <Tbody
          sx={{
            tr: {
              transition: 'all ease-out 300ms',
              borderBottom: '1px solid',
              borderColor: 'white-alpha-08',
            },
            'tr:last-child': {
              borderBottom: 'none',
            },
          }}
        >
          {values.hats.map(role => {
            const existingRole = getHat(role.id);
            const isCurrentTermActive = existingRole?.roleTerms.currentTerm?.isActive;
            const roleTermNominee = role.roleTerms?.[0]?.nominee;
            const isMemberTermPending =
              !isCurrentTermActive && existingRole?.wearerAddress !== roleTermNominee;
            return (
              <RolesRowEdit
                key={role.id}
                name={role.name}
                wearerAddress={
                  role.isTermed
                    ? roleTermNominee
                      ? getAddress(roleTermNominee)
                      : undefined
                    : role.resolvedWearer
                }
                handleRoleClick={() => {
                  setFieldValue('roleEditing', role);
                  handleRoleClick(role.id);
                }}
                editStatus={role.editedRole?.status}
                payments={role.payments}
                isCurrentTermActive={isCurrentTermActive}
                isMemberTermPending={role.isTermed ? isMemberTermPending : undefined}
              />
            );
          })}
        </Tbody>
      </Table>
    </Box>
  );
}
