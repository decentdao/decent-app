import { create } from 'zustand';
import { SafeSettingsEdits } from '../../components/ui/modals/SafeSettingsModal';

interface SettingsFormStore {
  formState: SafeSettingsEdits | null;
  setFormState: (state: SafeSettingsEdits) => void;
  updateFormState: (updates: Partial<SafeSettingsEdits>) => void;
}

export const useSettingsFormStore = create<SettingsFormStore>(set => ({
  formState: null,
  setFormState: state => set({ formState: state }),
  updateFormState: updates =>
    set(state => ({
      formState: state.formState
        ? { ...state.formState, ...updates }
        : (updates as SafeSettingsEdits),
    })),
}));
