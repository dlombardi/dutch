import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemePreference = 'system' | 'light' | 'dark';

interface ThemeState {
  preference: ThemePreference;
  _hasHydrated: boolean;

  // Actions
  setPreference: (preference: ThemePreference) => void;
  setHasHydrated: (value: boolean) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      preference: 'dark', // Default to dark
      _hasHydrated: false,

      setPreference: (preference) => set({ preference }),
      setHasHydrated: (value) => set({ _hasHydrated: value }),
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        preference: state.preference,
      }),
      onRehydrateStorage: () => () => {
        useThemeStore.getState().setHasHydrated(true);
      },
    }
  )
);
