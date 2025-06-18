import { create } from 'zustand';
import {
  SafeSettingsEdits,
  SafeSettingsFormikErrors,
} from '../../components/ui/modals/SafeSettingsModal';

interface SettingsFormStore {
  formState: SafeSettingsEdits | undefined;
  formErrors: SafeSettingsFormikErrors | undefined;
  setFormState: (state: SafeSettingsEdits) => void;
  setFormErrors: (errors: SafeSettingsFormikErrors) => void;
}

export const useSettingsFormStore = create<SettingsFormStore>(set => ({
  formState: undefined,
  formErrors: undefined,
  setFormState: state => set({ formState: state }),
  setFormErrors: errors => set({ formErrors: errors }),
}));
