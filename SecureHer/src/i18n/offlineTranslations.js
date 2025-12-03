// src/i18n/offlineTranslations.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

const TRANSLATIONS_STORAGE_KEY = 'app_translations';
const CACHED_RETRY_KEY = 'cached_translation_retries';

/**
 * Check if the device is online
 * @returns {Promise<boolean>} Whether the device is connected to the internet
 */
export const isOnline = async () => {
  try {
    const state = await NetInfo.fetch();
    return state.isConnected && state.isInternetReachable;
  } catch (error) {
    console.error('Error checking network status:', error);
    return false;
  }
};

/**
 * Save a failed translation request to retry later
 * @param {string} languageCode - The language code
 * @param {Object} sourceStrings - The strings to translate
 */
export const cacheTranslationRetry = async (languageCode, sourceStrings) => {
  try {
    const cached = await AsyncStorage.getItem(CACHED_RETRY_KEY);
    const retries = cached ? JSON.parse(cached) : {};
    
    retries[languageCode] = {
      sourceStrings,
      timestamp: Date.now()
    };
    
    await AsyncStorage.setItem(CACHED_RETRY_KEY, JSON.stringify(retries));
  } catch (error) {
    console.error('Error caching translation retry:', error);
  }
};

/**
 * Get all pending translation retry requests
 * @returns {Promise<Object>} Object with language codes as keys and retry info as values
 */
export const getPendingRetries = async () => {
  try {
    const cached = await AsyncStorage.getItem(CACHED_RETRY_KEY);
    return cached ? JSON.parse(cached) : {};
  } catch (error) {
    console.error('Error getting pending retries:', error);
    return {};
  }
};

/**
 * Remove a language from the retry cache
 * @param {string} languageCode - The language code to remove
 */
export const clearRetryForLanguage = async (languageCode) => {
  try {
    const cached = await AsyncStorage.getItem(CACHED_RETRY_KEY);
    if (cached) {
      const retries = JSON.parse(cached);
      delete retries[languageCode];
      await AsyncStorage.setItem(CACHED_RETRY_KEY, JSON.stringify(retries));
    }
  } catch (error) {
    console.error('Error clearing retry cache for language:', error);
  }
};

/**
 * Process all pending translation retries
 * @param {Function} translationFunction - Function to call for each retry (should accept language code and source strings)
 */
export const processRetries = async (translationFunction) => {
  try {
    const online = await isOnline();
    if (!online) {
      console.log('Device is offline, skipping retry processing');
      return;
    }
    
    const retries = await getPendingRetries();
    const languageCodes = Object.keys(retries);
    
    if (languageCodes.length === 0) {
      return;
    }
    
    console.log(`Processing ${languageCodes.length} pending translation retries`);
    
    for (const languageCode of languageCodes) {
      try {
        const { sourceStrings } = retries[languageCode];
        await translationFunction(languageCode, sourceStrings);
        await clearRetryForLanguage(languageCode);
      } catch (error) {
        console.error(`Error processing retry for ${languageCode}:`, error);
      }
    }
  } catch (error) {
    console.error('Error processing retries:', error);
  }
};

/**
 * Get all available offline translations
 * @returns {Promise<Object>} Object with language codes as keys and translations as values
 */
export const getOfflineTranslations = async () => {
  try {
    const allTranslations = await AsyncStorage.getItem(TRANSLATIONS_STORAGE_KEY);
    return allTranslations ? JSON.parse(allTranslations) : {};
  } catch (error) {
    console.error('Error getting offline translations:', error);
    return {};
  }
};

/**
 * Check if translations are available for a specific language
 * @param {string} languageCode - The language code to check
 * @returns {Promise<boolean>} Whether translations are available
 */
export const hasOfflineTranslations = async (languageCode) => {
  try {
    const allTranslations = await getOfflineTranslations();
    return !!allTranslations[languageCode];
  } catch (error) {
    console.error(`Error checking offline translations for ${languageCode}:`, error);
    return false;
  }
};

/**
 * Get translations for a specific language
 * @param {string} languageCode - The language code
 * @returns {Promise<Object|null>} The translations or null if not available
 */
export const getTranslationsForLanguage = async (languageCode) => {
  try {
    const allTranslations = await getOfflineTranslations();
    return allTranslations[languageCode] || null;
  } catch (error) {
    console.error(`Error getting translations for ${languageCode}:`, error);
    return null;
  }
};

/**
 * Save translations for a language
 * @param {string} languageCode - The language code
 * @param {Object} translations - The translations to save
 */
export const saveOfflineTranslations = async (languageCode, translations) => {
  try {
    const allTranslations = await getOfflineTranslations();
    allTranslations[languageCode] = translations;
    await AsyncStorage.setItem(TRANSLATIONS_STORAGE_KEY, JSON.stringify(allTranslations));
  } catch (error) {
    console.error(`Error saving offline translations for ${languageCode}:`, error);
  }
};

/**
 * Clear all stored translations
 */
export const clearAllTranslations = async () => {
  try {
    await AsyncStorage.removeItem(TRANSLATIONS_STORAGE_KEY);
    await AsyncStorage.removeItem(CACHED_RETRY_KEY);
  } catch (error) {
    console.error('Error clearing all translations:', error);
  }
};