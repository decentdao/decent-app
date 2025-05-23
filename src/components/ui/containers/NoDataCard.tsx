import { Box, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { useCanUserCreateProposal } from '../../../hooks/utils/useCanUserSubmitProposal';

export default function NoDataCard({
  translationNameSpace,
  emptyText,
  emptyTextNotProposer,
  flatten = false,
}: {
  translationNameSpace: string;
  emptyText: string;
  emptyTextNotProposer?: string;
  flatten?: boolean;
}) {
  const { t } = useTranslation(translationNameSpace);
  const { canUserCreateProposal } = useCanUserCreateProposal();

  const content = (
    <Text
      textAlign="center"
      color="color-neutral-400"
      p="1rem"
    >
      {t(
        emptyTextNotProposer
          ? canUserCreateProposal
            ? emptyText
            : emptyTextNotProposer
          : emptyText,
      )}
    </Text>
  );

  if (flatten) {
    return content;
  }

  return (
    <Box
      bg="color-neutral-950"
      boxShadow="layeredShadowBorder"
      borderRadius="0.75rem"
      p="1rem"
    >
      {content}
    </Box>
  );
}
