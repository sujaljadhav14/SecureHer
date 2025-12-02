// src/services/locationSharing.js
import * as Location from 'expo-location';
import { Alert, Linking, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

class LocationSharingService {
  static async getCurrentLocation() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission denied');
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });

      return location;
    } catch (error) {
      throw new Error('Failed to get location: ' + error.message);
    }
  }

  static async loadCloseContacts() {
    try {
      const contacts = await AsyncStorage.getItem('close_contacts');
      return contacts ? JSON.parse(contacts) : [];
    } catch (error) {
      console.error('Error loading close contacts:', error);
      return [];
    }
  }

  static async shareViaWhatsApp(phoneNumber, message) {
    try {
      const whatsappUrl = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;
      await Linking.openURL(whatsappUrl);
      return true;
    } catch (error) {
      console.log('WhatsApp sharing failed:', error);
      return false;
    }
  }

  static async shareViaSMS(phoneNumber, message) {
    try {
      const smsUrl = Platform.select({
        ios: `sms:${phoneNumber}&body=${message}`,
        android: `sms:${phoneNumber}?body=${message}`
      });
      await Linking.openURL(smsUrl);
      return true;
    } catch (error) {
      console.error('SMS sharing failed:', error);
      return false;
    }
  }

  static async shareLocation() {
    try {
      // Get current location
      const location = await this.getCurrentLocation();
      const { latitude, longitude } = location.coords;
      
      // Create location message
      const googleMapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
      const message = `My current location: ${googleMapsUrl}`;

      // Load close contacts
      const contacts = await this.loadCloseContacts();
      
      if (contacts.length === 0) {
        Alert.alert('No close contacts', 'Please add close contacts first');
        return;
      }

      // Share with each contact
      let successCount = 0;
      let failCount = 0;

      for (const contact of contacts) {
        const phoneNumber = contact.phoneNumbers[0].number.replace(/\D/g, '');
        
        // Try WhatsApp first
        const whatsappSuccess = await this.shareViaWhatsApp(phoneNumber, message);
        
        // If WhatsApp fails, try SMS
        if (!whatsappSuccess) {
          const smsSuccess = await this.shareViaSMS(phoneNumber, message);
          if (smsSuccess) {
            successCount++;
          } else {
            failCount++;
          }
        } else {
          successCount++;
        }
      }

      // Show result
      if (successCount > 0) {
        Alert.alert(
          'Location Shared',
          `Successfully shared location with ${successCount} contact${successCount > 1 ? 's' : ''}${
            failCount > 0 ? `\nFailed to share with ${failCount} contact${failCount > 1 ? 's' : ''}` : ''
          }`
        );
      } else {
        Alert.alert('Sharing Failed', 'Could not share location with any contacts');
      }

    } catch (error) {
      Alert.alert('Error', error.message);
    }
  }
}

export default LocationSharingService;