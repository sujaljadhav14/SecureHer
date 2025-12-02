// src/components/TranslationLoader.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslations } from '../hooks/useTranslations';
import { fetchTranslationsFromGemini } from '../i18n';

const TRANSLATIONS_STORAGE_KEY = 'app_translations';

const TranslationLoader = () => {
  const { t, currentLanguage } = useTranslations();
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [languages, setLanguages] = useState([]);
  const [progress, setProgress] = useState(null);

  useEffect(() => {
    loadAvailableLanguages();
  }, []);

  const loadAvailableLanguages = async () => {
    try {
      const allTranslations = await AsyncStorage.getItem(TRANSLATIONS_STORAGE_KEY);
      if (allTranslations) {
        const parsedTranslations = JSON.parse(allTranslations);
        const loadedLanguages = Object.keys(parsedTranslations);
        
        setLanguages(loadedLanguages);
      }
    } catch (error) {
      console.error('Error loading available languages:', error);
    }
  };

  const handleDownloadAll = async () => {
    setLoading(true);
    setProgress({ current: 0, total: 15, language: '' });
    
    // List of languages to download
    const languagesToDownload = [
      { code: 'fr', name: 'French' },
      { code: 'es', name: 'Spanish' },
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
      { code: 'te', name: 'Telugu' },
      { code: 'ur', name: 'Urdu' }
    ];
    
    // Check which languages are already downloaded
    const allTranslations = await AsyncStorage.getItem(TRANSLATIONS_STORAGE_KEY);
    const parsedTranslations = allTranslations ? JSON.parse(allTranslations) : {};
    
    // Filter out already downloaded languages
    const toDownload = languagesToDownload.filter(lang => !parsedTranslations[lang.code]);
    
    if (toDownload.length === 0) {
      setLoading(false);
      setProgress(null);
      return;
    }
    
    setProgress({ current: 0, total: toDownload.length, language: '' });
    
    for (let i = 0; i < toDownload.length; i++) {
      const lang = toDownload[i];
      
      setProgress({ 
        current: i, 
        total: toDownload.length, 
        language: lang.name 
      });
      
      try {
        // Download translations
        const translations = await fetchTranslationsFromGemini(lang.code);
        
        if (translations) {
          // Save to storage
          parsedTranslations[lang.code] = translations;
          await AsyncStorage.setItem(TRANSLATIONS_STORAGE_KEY, JSON.stringify(parsedTranslations));
        }
      } catch (error) {
        console.error(`Error downloading ${lang.name} translations:`, error);
      }
      
      // Small delay to prevent rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    setLoading(false);
    setProgress(null);
    
    // Reload available languages
    loadAvailableLanguages();
  };

  const handleDeleteTranslations = async () => {
    try {
      await AsyncStorage.removeItem(TRANSLATIONS_STORAGE_KEY);
      setLanguages([]);
      setVisible(false);
    } catch (error) {
      console.error('Error deleting translations:', error);
    }
  };

  return (
    <View>
      <TouchableOpacity
        style={styles.manageButton}
        onPress={() => setVisible(true)}
      >
        <Ionicons name="cloud-download" size={20} color="#FFB5D8" />
        <Text style={styles.manageButtonText}>{t('profile.manage_translations', 'Manage Translations')}</Text>
      </TouchableOpacity>
      
      <Modal
        visible={visible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('profile.manage_translations', 'Manage Translations')}</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setVisible(false)}
              >
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.downloadSection}>
              <Text style={styles.sectionTitle}>{t('profile.available_languages', 'Available Languages')}</Text>
              
              {languages.length > 0 ? (
                <FlatList
                  data={languages}
                  keyExtractor={(item) => item}
                  renderItem={({ item }) => (
                    <View style={styles.languageItem}>
                      <Text style={styles.languageCode}>{item.toUpperCase()}</Text>
                      <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                    </View>
                  )}
                  ListHeaderComponent={
                    <Text style={styles.infoText}>
                      {t('profile.downloaded_languages', 'Downloaded Languages:')}
                    </Text>
                  }
                />
              ) : (
                <Text style={styles.noLanguagesText}>
                  {t('profile.no_languages', 'No languages downloaded yet')}
                </Text>
              )}
              
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#FFB5D8" />
                  {progress && (
                    <Text style={styles.progressText}>
                      {t('profile.downloading', 'Downloading')} {progress.language}... ({progress.current + 1}/{progress.total})
                    </Text>
                  )}
                </View>
              ) : (
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={styles.downloadButton}
                    onPress={handleDownloadAll}
                  >
                    <Text style={styles.buttonText}>
                      {t('profile.download_all', 'Download All Languages')}
                    </Text>
                  </TouchableOpacity>
                  
                  {languages.length > 0 && (
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={handleDeleteTranslations}
                    >
                      <Text style={styles.deleteButtonText}>
                        {t('profile.delete_translations', 'Delete All')}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  manageButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  downloadSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  languageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  languageCode: {
    fontSize: 16,
  },
  infoText: {
    marginBottom: 12,
    color: '#666',
  },
  noLanguagesText: {
    color: '#666',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  loadingContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  progressText: {
    marginTop: 12,
    color: '#666',
  },
  buttonRow: {
    marginTop: 16,
  },
  downloadButton: {
    backgroundColor: '#FFB5D8',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: {
    color: '#FFF',
    fontWeight: '600',
  },
  deleteButton: {
    borderWidth: 1,
    borderColor: '#FF4444',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#FF4444',
  },
});

export default TranslationLoader;