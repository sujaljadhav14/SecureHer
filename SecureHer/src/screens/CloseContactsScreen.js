import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Alert,
  TextInput,
  Platform,
} from 'react-native';
import * as Contacts from 'expo-contacts';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const CLOSE_CONTACTS_KEY = 'close_contacts';
const MAX_CONTACTS = 15;

const CloseContactsScreen = () => {
  const navigation = useNavigation();
  const [contacts, setContacts] = useState([]);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSavedContacts();
    requestContactsPermission();
  }, []);

  const loadSavedContacts = async () => {
    try {
      const savedContacts = await AsyncStorage.getItem(CLOSE_CONTACTS_KEY);
      if (savedContacts) {
        setSelectedContacts(JSON.parse(savedContacts));
      }
    } catch (error) {
      console.error('Error loading saved contacts:', error);
    }
  };

  const requestContactsPermission = async () => {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status === 'granted') {
        const { data } = await Contacts.getContactsAsync({
          fields: [
            Contacts.Fields.PhoneNumbers,
            Contacts.Fields.Image,
            Contacts.Fields.Name,
          ],
        });

        if (data.length > 0) {
          // Filter contacts with phone numbers
          const validContacts = data.filter(contact => 
            contact.phoneNumbers && contact.phoneNumbers.length > 0
          );
          setContacts(validContacts);
        }
      } else {
        Alert.alert(
          'Permission Required',
          'Please allow access to contacts to add close people.'
        );
      }
    } catch (error) {
      console.error('Error loading contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveContacts = async (contacts) => {
    try {
      await AsyncStorage.setItem(CLOSE_CONTACTS_KEY, JSON.stringify(contacts));
    } catch (error) {
      console.error('Error saving contacts:', error);
    }
  };

  const handleContactSelect = (contact) => {
    if (selectedContacts.length >= MAX_CONTACTS && 
        !selectedContacts.find(c => c.id === contact.id)) {
      Alert.alert(
        'Maximum Contacts Reached',
        `You can only add up to ${MAX_CONTACTS} close contacts.`
      );
      return;
    }

    const updatedContacts = selectedContacts.find(c => c.id === contact.id)
      ? selectedContacts.filter(c => c.id !== contact.id)
      : [...selectedContacts, contact];
    
    setSelectedContacts(updatedContacts);
    saveContacts(updatedContacts);
  };

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const ContactItem = ({ contact, isSelected }) => (
    <TouchableOpacity
      style={styles.contactItem}
      onPress={() => handleContactSelect(contact)}
    >
      <View style={styles.contactInfo}>
        {contact.image ? (
          <Image source={{ uri: contact.image.uri }} style={styles.contactImage} />
        ) : (
          <View style={[styles.contactImage, styles.placeholderImage]}>
            <Text style={styles.placeholderText}>
              {contact.name[0].toUpperCase()}
            </Text>
          </View>
        )}
        <View style={styles.contactDetails}>
          <Text style={styles.contactName}>{contact.name}</Text>
          <Text style={styles.contactPhone}>
            {contact.phoneNumbers[0].number}
          </Text>
        </View>
      </View>
      <View style={[
        styles.checkbox,
        isSelected && styles.checkboxSelected
      ]}>
        {isSelected && <Ionicons name="checkmark" size={18} color="#FFF" />}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Close People</Text>
        <Text style={styles.contactCount}>
          {selectedContacts.length}/{MAX_CONTACTS}
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search contacts..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {selectedContacts.length > 0 && (
        <View style={styles.selectedSection}>
          <Text style={styles.sectionTitle}>Selected Contacts</Text>
          <FlatList
            horizontal
            data={selectedContacts}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.selectedContact}
                onPress={() => handleContactSelect(item)}
              >
                {item.image ? (
                  <Image source={{ uri: item.image.uri }} style={styles.selectedImage} />
                ) : (
                  <View style={[styles.selectedImage, styles.placeholderImage]}>
                    <Text style={styles.placeholderText}>
                      {item.name[0].toUpperCase()}
                    </Text>
                  </View>
                )}
                <Text style={styles.selectedName} numberOfLines={1}>
                  {item.name}
                </Text>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleContactSelect(item)}
                >
                  <Ionicons name="close-circle" size={20} color="#FF4444" />
                </TouchableOpacity>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      <FlatList
        data={filteredContacts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ContactItem
            contact={item}
            isSelected={!!selectedContacts.find(c => c.id === item.id)}
          />
        )}
        contentContainerStyle={styles.contactsList}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  contactCount: {
    fontSize: 16,
    color: '#FFB5D8',
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    margin: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  selectedSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  selectedContact: {
    alignItems: 'center',
    marginRight: 16,
    width: 80,
  },
  selectedImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 4,
  },
  selectedName: {
    fontSize: 12,
    textAlign: 'center',
    width: '100%',
  },
  removeButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#FFF',
    borderRadius: 12,
  },
  contactsList: {
    padding: 16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  contactImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  placeholderImage: {
    backgroundColor: '#FFB5D8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  contactDetails: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  contactPhone: {
    fontSize: 14,
    color: '#666',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFB5D8',
    marginLeft: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#FFB5D8',
  },
});

export default CloseContactsScreen;