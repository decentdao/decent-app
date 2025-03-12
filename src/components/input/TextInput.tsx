import { Flex, IconButton, Input } from '@chakra-ui/react';
import { MinusCircle } from '@phosphor-icons/react';
import { Field, FieldAttributes } from 'formik';
import { useFormHelpers } from '../../hooks/utils/useFormHelpers';
import { BigIntInput } from '../ui/forms/BigIntInput';
import { AddressInput } from '../ui/forms/EthAddressInput';
import { LabelComponent } from '../ui/forms/InputComponent';
import LabelWrapper from '../ui/forms/LabelWrapper';
import { ITextInput, IRemoval, ILabeledTextInput, ILabeledBigIntTextInput } from './Interfaces';

export function EmbeddedAddressInput({
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

export function TextInput({
  id,
  label,
  description,
  placeholder,
  error,
  fieldName,
  value,
  isDisabled = false,
  isRequired,
  testId,
  onValueChange,
}: ILabeledTextInput) {
  if (fieldName) {
    return (
      <LabelComponent
        label={label}
        helper={description}
        isRequired={isRequired}
      >
        <LabelWrapper errorMessage={error}>
          <Field name={fieldName}>
            {({ field }: FieldAttributes<any>) => (
              <Input
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
        </LabelWrapper>
      </LabelComponent>
    );
  } else {
    return (
      <LabelComponent
        label={label}
        helper={description}
        isRequired={isRequired}
      >
        <LabelWrapper errorMessage={error}>
          <Input
            id={id}
            minWidth="50%"
            value={value}
            onChange={cEvent => onValueChange?.(cEvent.target.value)}
            onBlur={cEvent => onValueChange?.(cEvent.target.value.trim())}
            isDisabled={isDisabled}
            data-testid={testId ?? ''}
            placeholder={placeholder}
            isInvalid={!!error}
          />
        </LabelWrapper>
      </LabelComponent>
    );
  }
}

export function FullWidthTextInput({
  id,
  placeholder,
  error,
  fieldName,
  value,
  isDisabled = false,
  isRequired,
  testId,
  onChange,
}: ITextInput) {
  if (fieldName) {
    return (
      <LabelWrapper errorMessage={error}>
        <Field name={fieldName}>
          {({ field }: FieldAttributes<any>) => (
            <Input
              {...field}
              id={id}
              placeholder={placeholder}
              isDisabled={isDisabled}
              data-testid={testId ?? ''}
              isRequired={isRequired}
              onChange={cEvent => onChange?.(cEvent)}
            />
          )}
        </Field>
      </LabelWrapper>
    );
  } else {
    return (
      <LabelWrapper errorMessage={error}>
        <Input
          name={id}
          value={value}
          placeholder={placeholder}
          isInvalid={!!error}
          isRequired={isRequired}
          onChange={cEvent => onChange?.(cEvent)}
        />
      </LabelWrapper>
    );
  }
}

export function BigIntTextInput({
  id,
  label,
  description,
  error,
  value,
  isRequired,
  testId,
  onValueChange,
}: ILabeledBigIntTextInput) {
  const { restrictChars } = useFormHelpers();
  return (
    <LabelComponent
      label={label}
      helper={description}
      isRequired={isRequired}
    >
      <LabelWrapper errorMessage={error}>
        <BigIntInput
          id={id}
          value={value}
          onChange={valuePair => onValueChange?.(valuePair)}
          data-testid={testId ?? ''}
          onKeyDown={restrictChars}
          placeholder="100,000,000"
        />
      </LabelWrapper>
    </LabelComponent>
  );
}
