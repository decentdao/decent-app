import { Box, Flex, Icon, Table, Tbody, Td, Text, Th, Thead, Tr } from '@chakra-ui/react';
import { PencilLine } from '@phosphor-icons/react';
import { useFormikContext } from 'formik';
import { useTranslation } from 'react-i18next';
import { Address, Hex } from 'viem';
import useAvatar from '../../../hooks/utils/useAvatar';
import { useGetAccountName } from '../../../hooks/utils/useGetAccountName';
import { DecentTree } from '../../../store/roles/rolesStoreUtils';
import { useRolesStore } from '../../../store/roles/useRolesStore';
import NoDataCard from '../../ui/containers/NoDataCard';
import Avatar from '../../ui/page/Header/Avatar';
import EditBadge from './EditBadge';
import { RoleCardLoading } from './RolePageCard';
import { EditBadgeStatus, RoleEditProps, RoleFormValues, RoleProps } from './types';

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
        textStyle="label-base"
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
          <Text
            textStyle="body-base"
            color="lilac-0"
          >
            {roleName}
          </Text>
          <EditBadge editStatus={editStatus} />
        </Flex>
        <Icon
          className="edit-role-icon"
          as={PencilLine}
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
  currentRoleTermStatus,
  isTermed,
}: {
  isTermed?: boolean;
  wearerAddress?: Address;
  currentRoleTermStatus?: 'active' | 'inactive' | undefined;
}) {
  const { displayName: accountDisplayName } = useGetAccountName(wearerAddress);
  const avatarURL = useAvatar(accountDisplayName);

  const { t } = useTranslation('roles');
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
          textStyle="body-base"
          color={isTermed && currentRoleTermStatus === 'inactive' ? 'neutral-6' : 'white-0'}
          ml="0.5rem"
        >
          {wearerAddress ? accountDisplayName : t('unassigned')}
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
      textStyle="body-base"
    >
      {paymentsCount !== undefined ? (
        <Box
          as="span"
          display="inline-block"
          textStyle="helper-text-small"
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
  currentRoleTermStatus,
  isTermed,
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
        textStyle="body-base"
        color="lilac-0"
        width="25%"
        minW="230px"
      >
        {name}
      </Td>
      <MemberColumn
        wearerAddress={wearerAddress}
        currentRoleTermStatus={currentRoleTermStatus}
        isTermed={isTermed}
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
      <MemberColumn wearerAddress={wearerAddress} />
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
            {hatsTree.roleHats.map(role => (
              <RolesRow
                key={role.id.toString()}
                name={role.name}
                wearerAddress={role.wearerAddress}
                handleRoleClick={() => handleRoleClick(role.id)}
                currentRoleTermStatus={role.roleTerms.currentTerm?.termStatus}
                isTermed={role.isTermed}
                paymentsCount={
                  role.payments === undefined
                    ? undefined
                    : role.payments.filter(p => p.isStreaming()).length || undefined
                }
              />
            ))}
          </Tbody>
        </Table>
      )}
    </Box>
  );
}

export function RolesEditTable({ handleRoleClick }: { handleRoleClick: (hatId: Hex) => void }) {
  const { hatsTree } = useRolesStore();
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
          {values.hats.map(role => (
            <RolesRowEdit
              key={role.id}
              name={role.name}
              wearerAddress={role.resolvedWearer}
              handleRoleClick={() => {
                setFieldValue('roleEditing', role);
                handleRoleClick(role.id);
              }}
              editStatus={role.editedRole?.status}
              payments={role.payments}
            />
          ))}
        </Tbody>
      </Table>
    </Box>
  );
}
