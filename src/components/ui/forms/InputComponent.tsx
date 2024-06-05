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
}

interface InputProps extends Omit<BaseProps, 'children'> {
  onChange: React.ChangeEventHandler<HTMLInputElement> | undefined;
  onBlur?: React.ChangeEventHandler<HTMLInputElement> | undefined;
  placeholder?: string;
  testId: string;
}

interface TextareaProps extends Omit<BaseProps, 'children'> {
  onChange: React.ChangeEventHandler<HTMLTextAreaElement> | undefined;
  placeholder?: string;
  rows?: number;
  resize?: ResponsiveValue<'vertical' | 'horizontal' | 'both' | 'none'>;
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
      <GridItem alignSelf="center">
        {isStringLabel ? (
          <HStack
            pb={1}
            textStyle="body-base"
          >
            <Text color={disabled ? 'white-0' : 'white-2'}>{label}</Text>
            {isRequired && <Text color="lilac-0">*</Text>}
          </HStack>
        ) : (
          label
        )}
        {helperSlot === 'start' && <Text color="neutral-7">{helper}</Text>}
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
          <Text color="neutral-7">{helper}</Text>
        </GridItem>
      )}
    </Grid>
  );
}

export function InputComponent(props: InputProps) {
  const { id, value, disabled, onChange, onBlur, placeholder, testId, maxLength } = props;
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
