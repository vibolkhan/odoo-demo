import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

export const useThemeStore = defineStore('theme', () => {
  const isDarkMode = ref(localStorage.getItem('theme') === 'dark');

  const toggleTheme = () => {
    isDarkMode.value = !isDarkMode.value;
  };

  const applyTheme = () => {
    if (isDarkMode.value) {
      document.documentElement.classList.add('ion-palette-dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('ion-palette-dark');
      localStorage.setItem('theme', 'light');
    }
  };

  watch(isDarkMode, applyTheme, { immediate: true });

  return {
    isDarkMode,
    toggleTheme,
    applyTheme,
  };
});
