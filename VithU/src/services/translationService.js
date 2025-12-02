// src/services/translationService.js
import NetInfo from '@react-native-community/netinfo';
import { fetchTranslationsFromGemini } from '../i18n';
import { 
  getOfflineTranslations, 
  saveOfflineTranslations,
  getPendingRetries,
  clearRetryForLanguage,
  isOnline
} from '../i18n/offlineTranslations';

class TranslationService {
  constructor() {
    this.isInitialized = false;
    this.unsubscribeNetInfo = null;
    this.pendingLanguages = new Set();
  }

  /**
   * Initialize the translation service
   */
  init() {
    if (this.isInitialized) return;
    
    // Set up network state change listener
    this.unsubscribeNetInfo = NetInfo.addEventListener(this.handleNetworkChange);
    
    // Check for pending retries on startup
    this.checkPendingRetries();
    
    this.isInitialized = true;
    console.log('Translation service initialized');
  }

  /**
   * Clean up resources
   */
  cleanup() {
    if (this.unsubscribeNetInfo) {
      this.unsubscribeNetInfo();
      this.unsubscribeNetInfo = null;
    }
    this.isInitialized = false;
  }

  /**
   * Handle network state changes
   */
  handleNetworkChange = (state) => {
    if (state.isConnected && state.isInternetReachable) {
      // When connection is restored, check for pending retries
      this.checkPendingRetries();
    }
  };

  /**
   * Check for pending translation retries
   */
  async checkPendingRetries() {
    try {
      const online = await isOnline();
      if (!online) return;
      
      const retries = await getPendingRetries();
      const languageCodes = Object.keys(retries);
      
      if (languageCodes.length === 0) return;
      
      // Process each pending language
      for (const languageCode of languageCodes) {
        // Skip if already being processed
        if (this.pendingLanguages.has(languageCode)) continue;
        
        // Process this language
        this.pendingLanguages.add(languageCode);
        this.processLanguageRetry(languageCode);
      }
    } catch (error) {
      console.error('Error checking pending retries:', error);
    }
  }

  /**
   * Process a single language retry
   */
  async processLanguageRetry(languageCode) {
    try {
      // Fetch translations from API
      const translations = await fetchTranslationsFromGemini(languageCode);
      
      if (translations) {
        // Save to offline storage
        await saveOfflineTranslations(languageCode, translations);
        
        // Clear this language from retry cache
        await clearRetryForLanguage(languageCode);
        
        console.log(`Successfully processed retry for ${languageCode}`);
      }
    } catch (error) {
      console.error(`Error processing retry for ${languageCode}:`, error);
    } finally {
      // Remove from pending set
      this.pendingLanguages.delete(languageCode);
    }
  }

  /**
   * Download translations for a specific language
   */
  async downloadLanguage(languageCode) {
    try {
      // Check if already being processed
      if (this.pendingLanguages.has(languageCode)) {
        return { success: false, message: 'Already in progress' };
      }
      
      // Check if we're online
      const online = await isOnline();
      if (!online) {
        return { success: false, message: 'Offline' };
      }
      
      // Mark as pending
      this.pendingLanguages.add(languageCode);
      
      // Fetch translations
      const translations = await fetchTranslationsFromGemini(languageCode);
      
      if (translations) {
        // Save to offline storage
        await saveOfflineTranslations(languageCode, translations);
        
        return { success: true };
      } else {
        return { success: false, message: 'Failed to fetch translations' };
      }
    } catch (error) {
      console.error(`Error downloading language ${languageCode}:`, error);
      return { success: false, message: error.message };
    } finally {
      // Remove from pending set
      this.pendingLanguages.delete(languageCode);
    }
  }

  /**
   * Get all available languages with their download status
   */
  async getLanguageStatus() {
    try {
      const offlineTranslations = await getOfflineTranslations();
      const availableLanguages = Object.keys(offlineTranslations);
      
      const allLanguages = [
        { code: 'en', name: 'English' },
        { code: 'es', name: 'Spanish' },
        { code: 'fr', name: 'French' },
        { code: 'de', name: 'German' },
        { code: 'it', name: 'Italian' },
        { code: 'pt', name: 'Portuguese' },
        { code: 'ru', name: 'Russian' },
        { code: 'ja', name: 'Japanese' },
        { code: 'zh', name: 'Chinese' },
        { code: 'ko', name: 'Korean' },
        { code: 'ar', name: 'Arabic' },
        { code: 'hi', name: 'Hindi' },
        { code: 'bn', name: 'Bengali' },
        { code: 'ta', name: 'Tamil' },
        { code: 'te', name: 'Telugu' }
      ];
      
      return allLanguages.map(lang => ({
        ...lang,
        downloaded: availableLanguages.includes(lang.code),
        inProgress: this.pendingLanguages.has(lang.code)
      }));
    } catch (error) {
      console.error('Error getting language status:', error);
      return [];
    }
  }
}

// Create singleton instance
const translationService = new TranslationService();

export default translationService;