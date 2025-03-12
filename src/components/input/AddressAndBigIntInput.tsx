import { Flex, IconButton } from '@chakra-ui/react';
import { MinusCircle } from '@phosphor-icons/react';
import { Field, FieldAttributes } from 'formik';
import { AddressInput } from '../ui/forms/EthAddressInput';
import { IRemoval, ITextInput } from './Interfaces';

export function EmbeddedAddressAndBigIntInput({
  id,
  placeholder,
  fieldName,
  isDisabled = false,
  testId,
  onValueChange,
  removalLabel,
  removalIndex,
  onRemoval,
}: ITextInput & IRemoval) {
  return (
    <Flex
      flexDirection="column"
      gap={2}
    >
      <Field name={fieldName}>
        {({ field }: FieldAttributes<any>) => (
          <AddressInput
            {...field}
            id={id}
            minWidth="50%"
            placeholder={placeholder}
            isDisabled={isDisabled}
            data-testid={testId ?? ''}
            onChange={cEvent => onValueChange?.(cEvent.target.value)}
            onBlur={cEvent => onValueChange?.(cEvent.target.value.trim())}
          />
        )}
      </Field>

      {onRemoval && fieldName && (
        <IconButton
          aria-label={removalLabel ?? 'Remove'}
          variant="secondary"
          border="0"
          minW="12"
          icon={<MinusCircle size="24" />}
          onClick={async () => {
            onRemoval(removalIndex);
          }}
          data-testid={'multisig.numOfSigners-' + removalIndex}
        />
      )}
    </Flex>
  );
}
