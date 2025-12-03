// src/i18n/index.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// Initial default translations (English)
import en from './en.json'

const LANGUAGE_STORAGE_KEY = 'user_language';
const TRANSLATIONS_STORAGE_KEY = 'app_translations';
const GEMINI_API_KEY = 'AIzaSyDb66Y1MVBDi7RXjHo2BfNN1E-YoRIYKM8'; // Replace with your actual API key
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

// Initialize with English as the default language
i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3',
    resources: {
      en: { translation: en }
    },
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

// Function to load the saved language preference
export const loadSavedLanguage = async () => {
  try {
    const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (savedLanguage) {
      await changeLanguage(savedLanguage);
      return savedLanguage;
    }
    return 'en'; // Default to English if no language is saved
  } catch (error) {
    console.error('Error loading language preference:', error);
    return 'en';
  }
};

// Function to save language translations to AsyncStorage
export const saveTranslations = async (languageCode, translations) => {
  try {
    const allTranslations = await AsyncStorage.getItem(TRANSLATIONS_STORAGE_KEY);
    const parsedTranslations = allTranslations ? JSON.parse(allTranslations) : {};
    
    // Update or add the translations for this language
    parsedTranslations[languageCode] = translations;
    
    await AsyncStorage.setItem(
      TRANSLATIONS_STORAGE_KEY, 
      JSON.stringify(parsedTranslations)
    );
  } catch (error) {
    console.error('Error saving translations:', error);
  }
};

// Function to load translations from AsyncStorage
export const loadTranslations = async (languageCode) => {
  try {
    const allTranslations = await AsyncStorage.getItem(TRANSLATIONS_STORAGE_KEY);
    if (allTranslations) {
      const parsedTranslations = JSON.parse(allTranslations);
      return parsedTranslations[languageCode];
    }
    return null;
  } catch (error) {
    console.error('Error loading translations:', error);
    return null;
  }
};

// Function to change the app language
export const changeLanguage = async (languageCode) => {
  try {
    // First, check if we have cached translations
    let translations = await loadTranslations(languageCode);
    
    // If not cached, and it's not English (which is our default), fetch from Gemini
    if (!translations && languageCode !== 'en') {
      translations = await fetchTranslationsFromGemini(languageCode);
      // Save the fetched translations
      if (translations) {
        await saveTranslations(languageCode, translations);
      }
    }
    
    // If we have translations, update i18n resources
    if (translations) {
      i18n.addResourceBundle(languageCode, 'translation', translations);
    }
    
    // Change the language
    await i18n.changeLanguage(languageCode);
    
    // Save the language preference
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, languageCode);
    
    return true;
  } catch (error) {
    console.error('Error changing language:', error);
    return false;
  }
};

// Function to translate content using Gemini API
export const fetchTranslationsFromGemini = async (targetLanguage) => {
    try {
      // Get the English translations as the source
      const sourceTranslations = i18n.getResourceBundle('en', 'translation');
      
      // Format the prompt for Gemini
      const prompt = `
        Please translate all the following JSON key-value pairs from English to ${targetLanguage}. 
        Maintain the same JSON structure with the same keys, but translate only the values.
        Here is the content to translate:
        
        ${JSON.stringify(sourceTranslations, null, 2)}
        
        Only return the translated JSON object, without any additional text or explanations.
      `;
      
      // Make the API call to Gemini with corrected format
      const response = await axios.post(
        GEMINI_API_URL,
        {
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ]
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    
    // Extract the translated JSON from the response
    const translatedText = response.data.candidates[0].content.parts[0].text;
    
    // Find the JSON object in the response
    const jsonMatch = translatedText.match(/```json\n([\s\S]*)\n```/) || 
                       translatedText.match(/{[\s\S]*}/);
                       
    let translatedJSON;
    
    if (jsonMatch) {
      // If we found JSON in code block or directly
      translatedJSON = JSON.parse(jsonMatch[1] || jsonMatch[0]);
    } else {
      // If no JSON formatting, try to parse the whole text
      translatedJSON = JSON.parse(translatedText);
    }
    
    return translatedJSON;
  } catch (error) {
    console.error('Error fetching translations from Gemini:', error);
    return null;
  }
};

export default i18n;