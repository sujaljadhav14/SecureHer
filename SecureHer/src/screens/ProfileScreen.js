import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  TextInput,
  Switch,
  Alert,
  Platform,
  ActivityIndicator,
  Animated,
  Dimensions
} from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useTranslations } from '../hooks/useTranslations';
import LanguageSelector from '../components/LanguageSelector';
import axios from 'axios';

const { width } = Dimensions.get('window');
const API_BASE_URL = 'https://womensafety-1-5znp.onrender.com';

const ProfileScreen = () => {
  const { t, isRTL } = useTranslations();
  const navigation = useNavigation();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [dob, setDob] = useState('');
  const [imageFile, setImageFile] = useState(null); // To store the actual image file for upload
  
  // Animation value for settings options
  const [expandedSection, setExpandedSection] = useState(null);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const translateAnim = useState(new Animated.Value(20))[0];
  
  // Toggle settings
  const [locationSharing, setLocationSharing] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [autoSOS, setAutoSOS] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // Load user data
  useEffect(() => {
    fetchUserProfile();
    loadUserSettings();
    
    // Animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(translateAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const getAuthToken = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      return token;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  };

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      
      const token = await getAuthToken();
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const response = await axios.get(`${API_BASE_URL}/users/getUserProfile`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      const userProfile = response.data;
      setUserData(userProfile);
      setName(userProfile.name || '');
      setEmail(userProfile.email || '');
      setMobileNumber(userProfile.mobileNumber || '');
      setDob(userProfile.dob || '');
      
      if (userProfile.profileImage) {
        setProfileImage({ uri: userProfile.profileImage });
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      Alert.alert('Error', 'Failed to load user profile');
    } finally {
      setLoading(false);
    }
  };

  const loadUserSettings = async () => {
    try {
      // Load settings from AsyncStorage
      const storedSettings = await AsyncStorage.getItem('userSettings');
      if (storedSettings) {
        const settings = JSON.parse(storedSettings);
        setLocationSharing(settings.locationSharing ?? true);
        setNotifications(settings.notifications ?? true);
        setAutoSOS(settings.autoSOS ?? false);
        setDarkMode(settings.darkMode ?? false);
      }
    } catch (error) {
      console.error('Error loading user settings:', error);
    }
  };

  const saveUserData = async () => {
    try {
      setLoading(true);
      
      const token = await getAuthToken();
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      // Create form data for multipart/form-data
      const formData = new FormData();
      formData.append('name', name);
      
      // Only add image if a new one was selected
      if (imageFile) {
        formData.append('itemImage', {
          uri: imageFile.uri,
          type: 'image/jpeg',
          name: 'profile-image.jpg',
        });
      }
      
      // Make the PATCH request
      const response = await axios.patch(
        `${API_BASE_URL}/users/updateUserProfile`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      // Update user data with the response
      setUserData(response.data);
      
      // Save user settings
      const userSettings = {
        locationSharing,
        notifications,
        autoSOS,
        darkMode
      };
      
      await AsyncStorage.setItem('userSettings', JSON.stringify(userSettings));
      
      setEditing(false);
      
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Error updating user profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              // Remove auth token
              await AsyncStorage.removeItem('userToken');
              
              // Navigate to Login screen
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }]
              });
            } catch (error) {
              console.error('Error during logout:', error);
            }
          }
        }
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to permanently delete your account? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Confirm Deletion',
              'Please confirm once more that you want to permanently delete your account.',
              [
                {
                  text: 'Cancel',
                  style: 'cancel'
                },
                {
                  text: 'Delete Permanently',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      // In a real app, you would make an API call to delete the account
                      
                      // Clear all local storage
                      await AsyncStorage.clear();
                      
                      // Navigate to Login screen
                      navigation.reset({
                        index: 0,
                        routes: [{ name: 'Onboarding' }]
                      });
                    } catch (error) {
                      console.error('Error deleting account:', error);
                    }
                  }
                }
              ]
            );
          }
        }
      ]
    );
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your media library to change profile picture.');
      return;
    }
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      setProfileImage({ uri });
      setImageFile(result.assets[0]); // Store the image file for later upload
    }
  };

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFB5D8" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile</Text>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => {
            if (editing) {
              saveUserData();
            } else {
              setEditing(true);
            }
          }}
        >
          <Ionicons name={editing ? "checkmark" : "create-outline"} size={24} color="#FFB5D8" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View 
          style={[
            styles.profileSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: translateAnim }]
            }
          ]}
        >
          <TouchableOpacity onPress={pickImage} disabled={!editing}>
            <View style={styles.profileImageContainer}>
              {profileImage ? (
                <Image source={profileImage} style={styles.profileImage} />
              ) : (
                <View style={[styles.profileImage, styles.profileImagePlaceholder]}>
                  <Text style={styles.profileImageText}>
                    {name ? name[0].toUpperCase() : 'U'}
                  </Text>
                </View>
              )}
              {editing && (
                <View style={styles.editImageButton}>
                  <Ionicons name="camera" size={16} color="#FFF" />
                </View>
              )}
            </View>
          </TouchableOpacity>
          
          <View style={styles.profileInfo}>
            {editing ? (
              <TextInput
                style={styles.nameInput}
                value={name}
                onChangeText={setName}
                placeholder="Your Name"
              />
            ) : (
              <Text style={styles.profileName}>{name}</Text>
            )}
            <Text style={styles.profileRole}>User</Text>
          </View>
        </Animated.View>

        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Personal Information</Text>

          <View style={styles.infoItem}>
            <Ionicons name="mail-outline" size={20} color="#FFB5D8" style={styles.infoIcon} />
            <Text style={styles.infoText}>{email}</Text>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="call-outline" size={20} color="#FFB5D8" style={styles.infoIcon} />
            <Text style={styles.infoText}>{mobileNumber}</Text>
          </View>

          {dob && (
            <View style={styles.infoItem}>
              <Ionicons name="calendar-outline" size={20} color="#FFB5D8" style={styles.infoIcon} />
              <Text style={styles.infoText}>
                {new Date(dob).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </Text>
            </View>
          )}
          
          <TouchableOpacity 
          style={styles.myPostsButton}
          onPress={() => navigation.navigate('MyPosts')}
          >
          <Ionicons name="document-text-outline" size={20} color="#FFB5D8" style={styles.infoIcon} />
          <Text style={styles.infoText}>My Posts</Text>
          <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity 
          style={styles.myPostsButton}
          onPress={() => navigation.navigate('ReportHistory')}
          >
          <Ionicons name="document-text-outline" size={20} color="#FFB5D8" style={styles.infoIcon} />
          <Text style={styles.infoText}>Incident Report History</Text>
          <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>

        </View>

          
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Settings</Text>

          <TouchableOpacity 
            style={styles.settingsItem}
            onPress={() => toggleSection('language')}
          >
            <View style={styles.settingsItemHeader}>
              <Ionicons name="language" size={20} color="#FFB5D8" style={styles.settingsIcon} />
              <Text style={styles.settingsText}>{t('profile.language_settings', 'Language')}</Text>
              <Ionicons 
                name={expandedSection === 'language' ? "chevron-up" : "chevron-down"} 
                size={20} 
                color="#666"
                style={styles.chevron}
              />
            </View>
            
            {expandedSection === 'language' && (
              <View style={styles.expandedContent}>
                <Text style={styles.settingDescription}>
                  {t('profile.language_description', 'Change the application language')}
                </Text>
                <View style={styles.languageSelector}>
                  <LanguageSelector />
                </View>
              </View>
            )}
          </TouchableOpacity>

          {/* Privacy Settings */}
          <TouchableOpacity 
            style={styles.settingsItem}
            onPress={() => toggleSection('privacy')}
          >
            <View style={styles.settingsItemHeader}>
              <Ionicons name="shield-outline" size={20} color="#FFB5D8" style={styles.settingsIcon} />
              <Text style={styles.settingsText}>Privacy & Location</Text>
              <Ionicons 
                name={expandedSection === 'privacy' ? "chevron-up" : "chevron-down"} 
                size={20} 
                color="#666"
                style={styles.chevron}
              />
            </View>
            
            {expandedSection === 'privacy' && (
              <View style={styles.expandedContent}>
                <View style={styles.toggleItem}>
                  <Text style={styles.toggleText}>Location Sharing</Text>
                  <Switch
                    value={locationSharing}
                    onValueChange={setLocationSharing}
                    trackColor={{ false: '#E0E0E0', true: '#FFB5D8' }}
                    thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : locationSharing ? '#FFFFFF' : '#F4F4F4'}
                  />
                </View>
                
                <Text style={styles.settingDescription}>
                  Allow the app to share your location with your emergency contacts during SOS alerts
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Notification Settings */}
          <TouchableOpacity 
            style={styles.settingsItem}
            onPress={() => toggleSection('notifications')}
          >
            <View style={styles.settingsItemHeader}>
              <Ionicons name="notifications-outline" size={20} color="#FFB5D8" style={styles.settingsIcon} />
              <Text style={styles.settingsText}>Notifications</Text>
              <Ionicons 
                name={expandedSection === 'notifications' ? "chevron-up" : "chevron-down"} 
                size={20} 
                color="#666"
                style={styles.chevron}
              />
            </View>
            
            {expandedSection === 'notifications' && (
              <View style={styles.expandedContent}>
                <View style={styles.toggleItem}>
                  <Text style={styles.toggleText}>Push Notifications</Text>
                  <Switch
                    value={notifications}
                    onValueChange={setNotifications}
                    trackColor={{ false: '#E0E0E0', true: '#FFB5D8' }}
                    thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : notifications ? '#FFFFFF' : '#F4F4F4'}
                  />
                </View>
                
                <Text style={styles.settingDescription}>
                  Receive alerts and updates about your safety status and contacts
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* SOS Settings */}
          <TouchableOpacity 
            style={styles.settingsItem}
            onPress={() => toggleSection('sos')}
          >
            <View style={styles.settingsItemHeader}>
              <FontAwesome5 name="heartbeat" size={20} color="#FFB5D8" style={styles.settingsIcon} />
              <Text style={styles.settingsText}>SOS Settings</Text>
              <Ionicons 
                name={expandedSection === 'sos' ? "chevron-up" : "chevron-down"} 
                size={20} 
                color="#666"
                style={styles.chevron}
              />
            </View>
            
            {expandedSection === 'sos' && (
              <View style={styles.expandedContent}>
                <View style={styles.toggleItem}>
                  <Text style={styles.toggleText}>Auto SOS</Text>
                  <Switch
                    value={autoSOS}
                    onValueChange={setAutoSOS}
                    trackColor={{ false: '#E0E0E0', true: '#FFB5D8' }}
                    thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : autoSOS ? '#FFFFFF' : '#F4F4F4'}
                  />
                </View>
                
                <Text style={styles.settingDescription}>
                  Automatically send SOS alerts when unusual activity is detected
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Appearance Settings */}
          <TouchableOpacity 
            style={styles.settingsItem}
            onPress={() => toggleSection('appearance')}
          >
            <View style={styles.settingsItemHeader}>
              <Ionicons name="color-palette-outline" size={20} color="#FFB5D8" style={styles.settingsIcon} />
              <Text style={styles.settingsText}>Appearance</Text>
              <Ionicons 
                name={expandedSection === 'appearance' ? "chevron-up" : "chevron-down"} 
                size={20} 
                color="#666"
                style={styles.chevron}
              />
            </View>
            
            {expandedSection === 'appearance' && (
              <View style={styles.expandedContent}>
                <View style={styles.toggleItem}>
                  <Text style={styles.toggleText}>Dark Mode</Text>
                  <Switch
                    value={darkMode}
                    onValueChange={setDarkMode}
                    trackColor={{ false: '#E0E0E0', true: '#FFB5D8' }}
                    thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : darkMode ? '#FFFFFF' : '#F4F4F4'}
                  />
                </View>
                
                <Text style={styles.settingDescription}>
                  Enable dark mode for better viewing in low light conditions
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Account Actions */}
        <View style={styles.accountActions}>
          {editing ? (
            <TouchableOpacity 
              style={styles.saveButton}
              onPress={saveUserData}
            >
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity 
                style={styles.logoutButton}
                onPress={handleLogout}
              >
                <Ionicons name="log-out-outline" size={20} color="#FF4444" style={styles.actionIcon} />
                <Text style={styles.logoutText}>Logout</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.deleteButton}
                onPress={handleDeleteAccount}
              >
                <Ionicons name="trash-outline" size={20} color="#FF4444" style={styles.actionIcon} />
                <Text style={styles.deleteText}>Delete Account</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <View style={styles.versionInfo}>
          <Text style={styles.versionText}>Version 1.0.0</Text>
        </View>
      </ScrollView>
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
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  editButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#FFF',
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#FFB5D8',
  },
  profileImagePlaceholder: {
    backgroundColor: '#FFB5D8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImageText: {
    fontSize: 40,
    color: '#FFF',
    fontWeight: 'bold',
  },
  editImageButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FFB5D8',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  profileInfo: {
    alignItems: 'center',
  },
  profileName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  profileRole: {
    fontSize: 16,
    color: '#666',
  },
  nameInput: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 8,
    width: width * 0.7,
    marginBottom: 4,
  },
  infoSection: {
    backgroundColor: '#FFF',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#000',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoIcon: {
    marginRight: 12,
  },
  infoText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  infoInput: {
    fontSize: 16,
    color: '#333',
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 8,
  },
  settingsSection: {
    backgroundColor: '#FFF',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingsItem: {
    marginBottom: 16,
  },
  settingsItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsIcon: {
    marginRight: 12,
  },
  settingsText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  chevron: {
    marginLeft: 8,
  },
  expandedContent: {
    marginTop: 16,
    paddingLeft: 32,
  },
  toggleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  toggleText: {
    fontSize: 16,
    color: '#333',
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    marginBottom: 16,
  },
  accountActions: {
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
  },
  saveButton: {
    backgroundColor: '#FFB5D8',
    borderRadius: 25,
    padding: 15,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#FF4444',
    borderRadius: 25,
    marginBottom: 16,
  },
  actionIcon: {
    marginRight: 12,
  },
  logoutText: {
    color: '#FF4444',
    fontSize: 16,
    fontWeight: '500',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#FF4444',
    borderRadius: 25,
    opacity: 0.8,
  },
  deleteText: {
    color: '#FF4444',
    fontSize: 16,
    fontWeight: '500',
    opacity: 0.8,
  },
  versionInfo: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 12,
  },
  versionText: {
    fontSize: 14,
    color: '#999',
  },
  myPostsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#F9F9F9',
    padding: 12,
    borderRadius: 12,
  },
  languageSelector: {
    marginTop: 10,
    alignItems: 'flex-start',
  },
});

export default ProfileScreen;