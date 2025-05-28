import { Button, Flex, Text } from '@chakra-ui/react';
import { Trash, WarningCircle } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';

interface UnsavedChangesWarningContentProps {
  onDiscard: () => void;
  onKeepEditing: () => void;
}

export function UnsavedChangesWarningContent({
  onDiscard,
  onKeepEditing,
}: UnsavedChangesWarningContentProps) {
  const { t } = useTranslation(['common']);
  return (
    <>
      <Flex
        direction="column"
        alignItems="center"
        px="4rem"
        pb="2rem"
      >
        <WarningCircle size="2.5rem" />
        <Text
          mt="1rem"
          textStyle="text-2xl-regular"
        >
          {t('unsavedChanges')}
        </Text>
        <Text
          mt="0.5rem"
          textAlign="center"
        >
          {t('unsavedChangesDescription')}
        </Text>
      </Flex>
      <Flex
        justifyContent="center"
        gap="0.75rem"
      >
        <Button
          color="color-error-400"
          borderWidth="1px"
          borderColor="color-error-400"
          border-radius="0.25rem"
          leftIcon={<Trash />}
          variant="outline"
          px="2rem"
          onClick={onDiscard}
        >
          {t('discardChanges')}
        </Button>
        <Button
          onClick={onKeepEditing}
          px="2rem"
        >
          {t('keepEditing')}
        </Button>
      </Flex>
    </>
  );
}
