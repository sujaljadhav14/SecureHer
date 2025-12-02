// src/components/LanguageSelector.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { changeLanguage, loadSavedLanguage } from '../i18n';

// List of supported languages
const languages = [
    { code: 'en', name: 'English' },
    // Indian languages
    { code: 'hi', name: 'हिन्दी (Hindi)' },
    { code: 'bn', name: 'বাংলা (Bengali)' },
    { code: 'ta', name: 'தமிழ் (Tamil)' },
    { code: 'te', name: 'తెలుగు (Telugu)' },
    { code: 'mr', name: 'मराठी (Marathi)' },
    { code: 'gu', name: 'ગુજરાતી (Gujarati)' },
    { code: 'kn', name: 'ಕನ್ನಡ (Kannada)' },
    { code: 'ml', name: 'മലയാളം (Malayalam)' },
    { code: 'pa', name: 'ਪੰਜਾਬੀ (Punjabi)' },
    { code: 'or', name: 'ଓଡ଼ିଆ (Odia)' },
    { code: 'as', name: 'অসমীয়া (Assamese)' },
    { code: 'ur', name: 'اردو (Urdu)' },
    { code: 'sd', name: 'سنڌي (Sindhi)' },
    { code: 'ks', name: 'कॉशुर (Kashmiri)' },
    { code: 'ne', name: 'नेपाली (Nepali)' },
    { code: 'sa', name: 'संस्कृतम् (Sanskrit)' },
    // Other international languages
    { code: 'es', name: 'Español (Spanish)' },
    { code: 'fr', name: 'Français (French)' },
    { code: 'de', name: 'Deutsch (German)' },
    { code: 'it', name: 'Italiano (Italian)' },
    { code: 'pt', name: 'Português (Portuguese)' },
    { code: 'ru', name: 'Русский (Russian)' },
    { code: 'ja', name: '日本語 (Japanese)' },
    { code: 'zh', name: '中文 (Chinese)' },
    { code: 'ko', name: '한국어 (Korean)' },
    { code: 'ar', name: 'العربية (Arabic)' }
  ];
  

const LanguageSelector = () => {
  const { t, i18n } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [loading, setLoading] = useState(false);
  const [changingLanguage, setChangingLanguage] = useState('');

  useEffect(() => {
    const loadLanguage = async () => {
      const savedLanguage = await loadSavedLanguage();
      setCurrentLanguage(savedLanguage);
    };
    
    loadLanguage();
  }, []);

  const handleLanguageChange = async (languageCode) => {
    if (languageCode === currentLanguage) {
      setVisible(false);
      return;
    }
    
    setChangingLanguage(languageCode);
    setLoading(true);
    
    try {
      const success = await changeLanguage(languageCode);
      if (success) {
        setCurrentLanguage(languageCode);
      }
    } catch (error) {
      console.error('Error changing language:', error);
    } finally {
      setLoading(false);
      setChangingLanguage('');
      setVisible(false);
    }
  };

  const renderLanguageItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.languageItem,
        currentLanguage === item.code && styles.selectedLanguage
      ]}
      onPress={() => handleLanguageChange(item.code)}
      disabled={loading}
    >
      <Text style={[
        styles.languageName,
        currentLanguage === item.code && styles.selectedLanguageText
      ]}>
        {item.name}
      </Text>
      
      {currentLanguage === item.code && (
        <Ionicons name="checkmark" size={24} color="#FFB5D8" />
      )}
      
      {changingLanguage === item.code && (
        <ActivityIndicator size="small" color="#FFB5D8" />
      )}
    </TouchableOpacity>
  );

  return (
    <View>
      <TouchableOpacity
        style={styles.languageButton}
        onPress={() => setVisible(true)}
      >
        <Ionicons name="language" size={24} color="#FFB5D8" />
        <Text style={styles.buttonText}>
          {languages.find(lang => lang.code === currentLanguage)?.name || 'English'}
        </Text>
      </TouchableOpacity>
      
      <Modal
        visible={visible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('profile.select_language', 'Select Language')}</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setVisible(false)}
              >
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            
            {loading && changingLanguage === '' && (
              <ActivityIndicator size="large" color="#FFB5D8" style={styles.loader} />
            )}
            
            <FlatList
              data={languages}
              renderItem={renderLanguageItem}
              keyExtractor={(item) => item.code}
              contentContainerStyle={styles.languageList}
            />
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
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
  languageList: {
    paddingHorizontal: 16,
  },
  languageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  selectedLanguage: {
    backgroundColor: 'rgba(255, 181, 216, 0.1)',
  },
  languageName: {
    fontSize: 16,
    color: '#333',
  },
  selectedLanguageText: {
    fontWeight: 'bold',
    color: '#000',
  },
  loader: {
    marginVertical: 20,
  },
});

export default LanguageSelector;