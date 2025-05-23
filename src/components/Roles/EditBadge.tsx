import { Box } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { BadgeStatus, BadgeStatusColor, EditBadgeStatus } from '../../types/roles';

interface EditBadgeProps {
  editStatus?: EditBadgeStatus;
}

export default function EditBadge({ editStatus }: EditBadgeProps) {
  const { t } = useTranslation('roles');
  if (editStatus === undefined) return null;
  const displayColor = BadgeStatusColor[editStatus];
  const displayText = t(BadgeStatus[editStatus]);
  return (
    <Box
      rounded="0.75rem"
      w="fit-content"
      textStyle="text-sm-medium"
      borderColor={displayColor}
      textColor={displayColor}
      border="1px solid"
      px="0.5rem"
      h="1.5rem"
      lineHeight={1.5}
    >
      {displayText}
    </Box>
  );
}
