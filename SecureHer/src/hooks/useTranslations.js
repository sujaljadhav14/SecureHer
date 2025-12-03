// src/hooks/useTranslations.js
import { useTranslation } from 'react-i18next';

/**
 * A custom hook that provides easy access to translations
 * and adds some common formatting utilities
 */
export const useTranslations = () => {
  const { t, i18n } = useTranslation();
  
  return {
    // Basic translation function
    t,
    
    // Current language
    currentLanguage: i18n.language,
    
    // Check if the current language is RTL
    isRTL: ['ar', 'he', 'ur'].includes(i18n.language),
    
    // Helper for formatting with variables
    tFormat: (key, options) => t(key, options),
    
    // Helper for conditionally pluralizing
    tPlural: (key, count) => t(key, { count }),
    
    // Get direction based on current language
    getDirection: () => ['ar', 'he', 'ur'].includes(i18n.language) ? 'rtl' : 'ltr',
    
    // Format a string with the appropriate text direction
    formatWithDirection: (text) => {
      const isRTL = ['ar', 'he', 'ur'].includes(i18n.language);
      return { text, textAlign: isRTL ? 'right' : 'left' };
    },
  };
};