import { Text, InputProps, Flex, Input, IconButton } from '@chakra-ui/react';
import { Check, PencilSimple } from '@phosphor-icons/react';
import { useRef, useState } from 'react';
import { useClickOutside } from '../../../hooks/useClickOutside';

export function EditableInput(
  props: InputProps & { onEditCancel: () => void; onEditSave: () => void; isReadOnly?: boolean },
) {
  const { onEditCancel, onEditSave, ...rest } = props;
  const [showInput, setShowInput] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const cancelEdit = () => {
    setShowInput(false);
    onEditCancel();
  };

  const saveEdit = () => {
    setShowInput(false);
    onEditSave();
  };

  useClickOutside(ref, () => {
    if (showInput) {
      cancelEdit();
    }
  });

  if (!showInput) {
    return (
      <Flex
        alignItems="center"
        h="full"
        py="0.5rem"
        gap="1rem"
        minW="10rem"
        px="1rem"
        onClick={e => {
          e.stopPropagation();
          if (!props.isReadOnly) {
            setShowInput(true);
          }
        }}
        borderRadius="0.75rem"
        bg={props.isInvalid ? 'color-error-950' : 'transparent'}
      >
        <Text
          cursor={props.isReadOnly ? 'default' : 'pointer'}
          textStyle="text-base-regular"
          color={props.isInvalid ? 'color-error-400' : 'color-layout-foreground'}
          whiteSpace="nowrap"
        >
          {props.value}
        </Text>
        {!props.isReadOnly && (
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
        )}
      </Flex>
    );
  }
  return (
    <Flex
      ref={ref}
      alignItems="center"
      justifyContent="space-between"
      w="full"
      h="full"
      gap="1rem"
    >
      <Input
        {...rest}
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
