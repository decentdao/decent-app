import { ChangeEvent } from 'react';
import { BigIntValuePair } from '../../types';

export interface IInput {
  label: string; // label
  description?: string; // optional description
}

export interface IInputRequirements {
  error?: string; // error message
  isDisabled?: boolean; // is disabled
  isRequired: boolean; // is required
}

export interface ITextValueChange {
  onValueChange?: (value: string) => void; // on change callback with input value
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void; // on change callback with the raw event
}

export interface ISelectionOption {
  value: string; // value of the item
  label: string; // label of the item
  description?: string; // optional description
  icon?: string; // optional icon of the item
  testId?: string; // optional test id
}

export interface ISelectionInput extends IInput, IInputRequirements, ITextValueChange {
  id: string; // id of the input
  selected?: string; // selected item
  options: ISelectionOption[]; // list of options
}

export interface ITextInput extends ITextValueChange, IInputRequirements {
  id: string; // id of the input
  fieldName?: string; // key path for Formik,
  value?: string; // current value
  placeholder?: string; // placeholder
  testId?: string; // optional test id
}

export interface IToggleValueChange {
  onValueChange?: (value: boolean) => void; // on change callback with input value
}

export interface IToggleInput extends IToggleValueChange {
  id: string; // id of the input
  fieldName?: string; // key path for Formik,
  value?: boolean; // current value
}

export interface IRemoval {
  removalLabel?: string;
  removalIndex: number;
  onRemoval?: (index: number) => void; // on removal button is clicked
}

export interface ILabeledTextInput extends IInput, ITextInput {}

export interface IBigIntTextInput extends IInputRequirements {
  id: string; // id of the input
  fieldName?: string; // key path for Formik,
  value?: bigint; // current value
  placeholder: string; // placeholder
  testId?: string; // optional test id
  min?: string; // min value
  max?: string; // max value
  decimalPlaces?: number; // decimal places
  suffix?: string; // suffix
  onValueChange?: (value: BigIntValuePair) => void; // on change callback with input value
}

export interface ILabeledBigIntTextInput extends IInput, IBigIntTextInput {}

export interface IInputSection {
  label?: string; // title of the section
}

export interface IStepperInput extends IInput {
  id: string; // id of the input
  unit?: string; // stepper unit
  value: number; // current value
  onValueChange?: (value: number) => void; // on change callback with input value
}
