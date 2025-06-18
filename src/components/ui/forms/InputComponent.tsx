import {
  Input,
  HStack,
  Text,
  Textarea,
  Grid,
  GridItem,
  GridProps,
  GridItemProps,
  ResponsiveValue,
  TextareaProps as ChakraTextareaProps,
} from '@chakra-ui/react';
import { BigIntInput, BigIntInputProps } from './BigIntInput';
import LabelWrapper from './LabelWrapper';

interface BaseProps {
  label?: JSX.Element | string;
  id?: string;
  helper?: string;
  isRequired: boolean;
  value: string;
  disabled?: boolean;
  subLabel?: JSX.Element | string | null;
  errorMessage?: string;
  children: JSX.Element | JSX.Element[];
  gridContainerProps?: GridProps;
  inputContainerProps?: GridItemProps;
  maxLength?: number;
  helperSlot?: 'start' | 'end';
  alignLabel?: 'flex-start' | 'center';
}

interface InputProps extends Omit<BaseProps, 'children'> {
  onChange: React.ChangeEventHandler<HTMLInputElement> | undefined;
  onBlur?: React.ChangeEventHandler<HTMLInputElement> | undefined;
  placeholder?: string;
  testId: string;
  isInvalid?: boolean;
}

interface TextareaProps extends Omit<BaseProps, 'children'> {
  onChange: React.ChangeEventHandler<HTMLTextAreaElement> | undefined;
  placeholder?: string;
  rows?: number;
  resize?: ResponsiveValue<'vertical' | 'horizontal' | 'both' | 'none'>;
  textAreaProps?: ChakraTextareaProps;
}
interface BigIntProps
  extends Omit<BaseProps, 'children' | 'value'>,
    Omit<BigIntInputProps, 'isRequired'> {}

export function LabelComponent(props: Omit<BaseProps, 'value'>) {
  const {
    label,
    helper,
    isRequired,
    subLabel,
    errorMessage,
    children,
    gridContainerProps,
    inputContainerProps,
    disabled,
    helperSlot = 'start',
    alignLabel,
  } = props;

  const isStringLabel = typeof label === 'string';

  return (
    <Grid
      columnGap={4}
      templateColumns={{ base: '1fr', md: '2fr 3fr' }}
      alignItems="start"
      cursor={disabled ? 'not-allowed' : 'default'}
      {...gridContainerProps}
    >
      <GridItem
        alignSelf={alignLabel ?? 'center'}
        mt={alignLabel === 'flex-start' ? '0.75rem' : 0}
      >
        {isStringLabel ? (
          <HStack spacing={0}>
            <Text>{label}</Text>
            {isRequired && <Text color="color-lilac-100">*</Text>}
          </HStack>
        ) : (
          label
        )}
        {helperSlot === 'start' && (
          <Text
            color="color-neutral-400"
            wordBreak="break-word"
          >
            {helper}
          </Text>
        )}
      </GridItem>

      <GridItem {...inputContainerProps}>
        <LabelWrapper
          subLabel={subLabel}
          errorMessage={errorMessage}
        >
          {children}
        </LabelWrapper>
      </GridItem>

      {helperSlot === 'end' && (
        <GridItem>
          <Text color="color-neutral-400">{helper}</Text>
        </GridItem>
      )}
    </Grid>
  );
}

export function InputComponent(props: InputProps) {
  const { id, value, disabled, onChange, onBlur, placeholder, testId, maxLength, isInvalid } =
    props;
  return (
    <LabelComponent
      {...props}
      disabled={disabled}
    >
      <Input
        id={id}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        isDisabled={disabled}
        data-testid={testId}
        placeholder={placeholder}
        maxLength={maxLength}
        isInvalid={isInvalid}
      />
    </LabelComponent>
  );
}

export function TextareaComponent(props: TextareaProps) {
  const {
    id,
    value,
    disabled,
    onChange,
    rows,
    placeholder,
    maxLength,
    resize = 'vertical',
    textAreaProps,
  } = props;
  return (
    <LabelComponent
      {...props}
      disabled={disabled}
    >
      <Textarea
        id={id}
        resize={resize}
        onChange={onChange}
        value={value}
        isDisabled={disabled}
        rows={rows}
        placeholder={placeholder}
        size="base"
        p="0.5rem 1rem"
        maxLength={maxLength}
        {...textAreaProps}
      />
    </LabelComponent>
  );
}

export function BigIntComponent(props: BigIntProps) {
  const { id, value, disabled, onChange, decimalPlaces } = props;
  return (
    <LabelComponent
      {...props}
      disabled={disabled}
    >
      <BigIntInput
        value={value}
        id={id}
        onChange={onChange}
        decimalPlaces={decimalPlaces}
        placeholder="0.0"
        isDisabled={disabled}
      />
    </LabelComponent>
  );
}
