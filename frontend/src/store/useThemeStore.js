import { create } from 'zustand';

export const useThemeStore = create((set) => ({
  theme: localStorage.getItem('theme') || 'lofi',
  setTheme: (theme) => {
    localStorage.setItem('theme', theme);
    set({ theme });
  }
}));