import { Text, InputProps, Flex, Input, IconButton } from '@chakra-ui/react';
import { Check, PencilSimple } from '@phosphor-icons/react';
import { useState } from 'react';

export function EditableInput(
  props: InputProps & { onEditCancel: () => void; onEditSave: () => void },
) {
  const [showInput, setShowInput] = useState(false);

  const cancelEdit = () => {
    setShowInput(false);
    props.onEditCancel();
  };

  const saveEdit = () => {
    setShowInput(false);
    props.onEditSave();
  };

  if (!showInput) {
    return (
      <Flex
        alignItems="center"
        h="full"
        gap="1rem"
        minW="10rem"
        px="1rem"
        onClick={e => {
          e.stopPropagation();
          setShowInput(true);
        }}
        borderRadius="0.75rem"
        bg={props.isInvalid ? 'color-error-950' : 'transparent'}
      >
        <Text
          cursor="pointer"
          textStyle="text-sm-regular"
          color={props.isInvalid ? 'color-error-400' : 'color-layout-foreground'}
          whiteSpace="nowrap"
        >
          {props.value}
        </Text>
        <IconButton
          size="icon-sm"
          icon={<PencilSimple />}
          variant="ghostV1"
          onClick={e => {
            e.stopPropagation();
            setShowInput(true);
          }}
          aria-label="Edit"
        />
      </Flex>
    );
  }
  return (
    <Flex
      alignItems="center"
      justifyContent="space-between"
      w="full"
      h="full"
      px="1rem"
      gap="1rem"
    >
      <Input
        {...props}
        onBlur={e => {
          e.stopPropagation();
          cancelEdit();
        }}
        autoFocus
      />
      <IconButton
        size="icon-sm"
        variant="ghostV1"
        icon={<Check />}
        onClick={e => {
          e.stopPropagation();
          saveEdit();
        }}
        aria-label="Save"
      />
    </Flex>
  );
}
