import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  Platform,
  Vibration,
  StatusBar,
  Animated,
  Dimensions,
  Alert,
  PermissionsAndroid,
  BackHandler,
} from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import * as Contacts from 'expo-contacts';

const { width, height } = Dimensions.get('window');
const CLOSE_CONTACTS_KEY = 'close_contacts';

const FakeCallScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  
  // Get contact from route params or use default
  const contact = route.params?.contact || null;
  
  // States
  const [isRinging, setIsRinging] = useState(true);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [pickContactModalVisible, setPickContactModalVisible] = useState(!contact);
  const [sound, setSound] = useState(null);
  const [delayedCall, setDelayedCall] = useState(route.params?.delayed || false);
  const [timerActive, setTimerActive] = useState(false);
  const [delaySeconds, setDelaySeconds] = useState(route.params?.delaySeconds || 10);
  const [isCallEnding, setIsCallEnding] = useState(false);
  
  // Animations
  const ringingAnimation = useRef(new Animated.Value(1)).current;
  const callStartedTime = useRef(null);
  const durationInterval = useRef(null);
  
  // Handle back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isRinging) {
        handleRejectCall();
        return true;
      } else if (isCallActive) {
        handleEndCall();
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, [isRinging, isCallActive]);
  
  // Load contacts when component mounts
  useEffect(() => {
    loadContacts();
    
    // If contact was passed, set it as selected
    if (contact) {
      setSelectedContact(contact);
    }
    
    // Start vibration pattern for incoming call
    if (!delayedCall) {
      startRinging();
    } else {
      // If it's a delayed call, start the countdown
      setTimerActive(true);
      const countdown = setInterval(() => {
        setDelaySeconds((prev) => {
          if (prev <= 1) {
            clearInterval(countdown);
            setTimerActive(false);
            startRinging();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      // Clear countdown if component unmounts
      return () => clearInterval(countdown);
    }
    
    // Clean up when component unmounts
    return () => {
      stopSound();
      Vibration.cancel();
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
      }
    };
  }, []);
  
  // Animation for ringing effect
  useEffect(() => {
    if (isRinging) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(ringingAnimation, {
            toValue: 1.1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(ringingAnimation, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      Animated.timing(ringingAnimation, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [isRinging]);
  
  // Load contacts from AsyncStorage (directly from CloseContactsScreen storage)
  const loadContacts = async () => {
    try {
      // First try to load from close contacts (saved in CloseContactsScreen)
      const storedContacts = await AsyncStorage.getItem(CLOSE_CONTACTS_KEY);
      
      if (storedContacts) {
        const parsedContacts = JSON.parse(storedContacts);
        setContacts(parsedContacts);
        
        // If no specific contact was passed and we have contacts, select the first one
        if (!contact && parsedContacts.length > 0) {
          setSelectedContact(parsedContacts[0]);
        }
      } else {
        // If no close contacts are stored, try to load device contacts
        await loadDeviceContacts();
      }
      
      // If still no contact selected, create a default one
      if (!selectedContact && !contact) {
        const defaultContact = {
          id: 'default',
          name: 'Unknown',
          phoneNumbers: [{ number: '9876543210' }],
        };
        setSelectedContact(defaultContact);
      }
    } catch (error) {
      console.error('Error loading contacts:', error);
      
      // Fallback to default contact
      if (!selectedContact && !contact) {
        const defaultContact = {
          id: 'default',
          name: 'Unknown',
          phoneNumbers: [{ number: '9876543210' }],
        };
        setSelectedContact(defaultContact);
      }
    }
  };
  
  // Load contacts from device if needed (backup option)
  const loadDeviceContacts = async () => {
    try {
      // Request permissions
      const { status } = await Contacts.requestPermissionsAsync();
      
      if (status === 'granted') {
        // Fetch contacts
        const { data } = await Contacts.getContactsAsync({
          fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Name],
          sort: Contacts.SortTypes.FirstName,
        });
        
        if (data.length > 0) {
          // Filter to only include contacts with phone numbers
          const validContacts = data.filter(c => 
            c.phoneNumbers && c.phoneNumbers.length > 0
          );
          
          // Store up to 10 contacts for the picker
          const limitedContacts = validContacts.slice(0, 10);
          setContacts(limitedContacts);
          
          // Select first contact
          if (limitedContacts.length > 0 && !contact && !selectedContact) {
            setSelectedContact(limitedContacts[0]);
          }
        }
      }
    } catch (error) {
      console.error('Error loading device contacts:', error);
    }
  };
  
  // Try to get system default ringtone (on Android) or use fallback
  const getSystemRingtone = async () => {
    if (Platform.OS === 'android') {
      try {
        // On newer Android versions, we need to request permission for default ringtone
        const permission = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE
        );
        
        if (permission || Platform.Version < 23) {
          // Use the system default ringtone path (fallback if we can't get it)
          return 'content://settings/system/ringtone';
        }
      } catch (error) {
        console.error('Error accessing system ringtone:', error);
      }
    }
    
    // Fallback to our own ringtone
    return null;
  };
  
  // Start playing ringtone and vibration
  const startRinging = async () => {
    setIsRinging(true);
    
    // Vibration pattern: wait 1s, vibrate 1s, wait 0.5s, repeat
    // This mimics typical incoming call vibration
    const PATTERN = [1000, 1000, 500];
    Vibration.vibrate(PATTERN, true);
    
    // Play ringtone (try to use system default if possible)
    try {
      // First try to get system default ringtone
      const systemRingtone = await getSystemRingtone();
      
      if (systemRingtone && Platform.OS === 'android') {
        // On Android, try to use the system ringtone
        // Note: This requires additional permissions and may not work on all devices
        const { sound } = await Audio.Sound.createAsync(
          { uri: systemRingtone },
          { shouldPlay: true, isLooping: true, volume: 1.0 }
        );
        setSound(sound);
      } else {
        // Fallback to the app's default ringtone
        const { sound } = await Audio.Sound.createAsync(
          require('../../assets/ringtone.mp3'),
          { shouldPlay: true, isLooping: true, volume: 1.0 }
        );
        setSound(sound);
      }
    } catch (error) {
      console.error('Error playing ringtone:', error);
      // Fallback silently - vibration will still work
    }
  };
  
  // Stop ringtone and vibration
  const stopSound = async () => {
    try {
      if (sound) {
        // First stop playback
        await sound.stopAsync();
        // Then unload the sound
        await sound.unloadAsync();
        // Clear the sound reference
        setSound(null);
      }
    } catch (error) {
      console.error('Error stopping sound:', error);
    } finally {
      // Create a new Audio session to reset any ongoing playback
      try {
        // Use correct constants for audio mode
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: false,
          allowsRecordingIOS: false,
          staysActiveInBackground: false,
          // Use numerical constants instead of reference constants
          interruptionModeIOS: 1, // This corresponds to Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX
          interruptionModeAndroid: 1, // This corresponds to Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX
          shouldDuckAndroid: false,
        });
      } catch (audioError) {
        console.error('Error resetting audio mode:', audioError);
      }
      
      // Force cancel vibration in all cases
      Vibration.cancel();
    }
  };
  
  // Accept incoming call
  const handleAcceptCall = async () => {
    try {
      // Stop the ringtone and vibration
      await stopSound();
      Vibration.cancel();
      
      // Update UI state
      setIsRinging(false);
      setIsCallActive(true);
      callStartedTime.current = Date.now();
      
      // Start call duration timer
      durationInterval.current = setInterval(() => {
        const duration = Math.floor((Date.now() - callStartedTime.current) / 1000);
        setCallDuration(duration);
      }, 1000);
    } catch (error) {
      console.error('Error accepting call:', error);
      // Even if there's an error, try to update the UI state
      setIsRinging(false);
      setIsCallActive(true);
    }
  };
  
  // Reject incoming call
  const handleRejectCall = async () => {
    try {
      // Immediately cancel vibration
      Vibration.cancel();
      
      // Stop sound with high priority
      await stopSound();
      
      // Use an alternative method to reset audio
      try {
        if (Platform.OS === 'ios') {
          // For iOS, we'll just create and immediately release a new Sound object
          const { sound: resetSound } = await Audio.Sound.createAsync(
            require('../../assets/ringtone.mp3'), // A silent MP3 file
            { volume: 0 }
          );
          await resetSound.unloadAsync();
        } else {
          // For Android, try toggling the audio
          await Audio.setIsEnabledAsync(false);
          await Audio.setIsEnabledAsync(true);
        }
      } catch (resetError) {
        console.error('Error resetting audio:', resetError);
      }
    } catch (error) {
      console.error('Failed to stop sound:', error);
    } finally {
      // Update UI state regardless of errors
      setIsRinging(false);
      setIsCallEnding(true);
      
      // Navigate back with a slight delay to show the "Call ended" message
      setTimeout(() => {
        navigation.goBack();
      }, 600);
    }
  };
  
  // End active call
  const handleEndCall = () => {
    try {
      // Stop the timer
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
        durationInterval.current = null;
      }
      
      // Animate call ending
      setIsCallEnding(true);
      setIsCallActive(false);
    } catch (error) {
      console.error('Error ending call:', error);
    } finally {
      // Navigate back with a slight delay to show the "Call ended" message
      setTimeout(() => {
        navigation.goBack();
      }, 600);
    }
  };
  
  // Format seconds to mm:ss
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Select a contact for the fake call
  const selectContactForCall = (contact) => {
    setSelectedContact(contact);
    setPickContactModalVisible(false);
    
    if (delayedCall) {
      // If it's a delayed call, show confirmation
      Alert.alert(
        'Scheduled Call',
        `You'll receive a call from ${contact.name} in ${delaySeconds} seconds.`,
        [{ text: 'OK' }]
      );
    } else {
      // If it's an immediate call, start ringing
      startRinging();
    }
  };
  
  // Get initials from a name
  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };
  
  // Consistent color based on name
  const getAvatarColor = (name) => {
    if (!name) return '#FFB5D8';
    const colors = ['#FFB5D8', '#4285F4', '#34A853', '#FBBC05', '#EA4335'];
    const charCode = name.charCodeAt(0) || 0;
    return colors[charCode % colors.length];
  };

  // Render user avatar
  const renderAvatar = () => {
    if (!selectedContact) return null;
    
    const initials = getInitials(selectedContact.name);
    const bgColor = getAvatarColor(selectedContact.name);
    
    return (
      <Animated.View 
        style={[
          styles.avatarContainer,
          isRinging && { transform: [{ scale: ringingAnimation }] }
        ]}
      >
        <View style={[styles.avatar, { backgroundColor: bgColor }]}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
      </Animated.View>
    );
  };
  
  // Render incoming call UI
  const renderIncomingCall = () => (
    <View style={styles.incomingCallContainer}>
      {renderAvatar()}
      
      <Text style={styles.callerName}>
        {selectedContact?.name || 'Unknown'}
      </Text>
      
      <Text style={styles.incomingText}>
        {timerActive 
          ? `Calling in ${delaySeconds} seconds...` 
          : 'Incoming call...'}
      </Text>
      
      {!timerActive && (
        <View style={styles.callActions}>
          <TouchableOpacity 
            style={[styles.callButton, styles.rejectButton]}
            onPress={handleRejectCall}
          >
            <MaterialIcons name="call-end" size={30} color="#FFF" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.callButton, styles.acceptButton]}
            onPress={handleAcceptCall}
          >
            <MaterialIcons name="call" size={30} color="#FFF" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
  
  // Render active call UI
  const renderActiveCall = () => (
    <View style={styles.activeCallContainer}>
      {renderAvatar()}
      
      <Text style={styles.callerName}>
        {selectedContact?.name || 'Unknown'}
      </Text>
      
      <Text style={styles.callStatus}>Call in progress</Text>
      <Text style={styles.callDuration}>{formatDuration(callDuration)}</Text>
      
      <View style={styles.callControls}>
        <TouchableOpacity 
          style={styles.controlButton}
          onPress={() => setIsMuted(!isMuted)}
        >
          <Ionicons 
            name={isMuted ? "mic-off" : "mic"} 
            size={24} 
            color={isMuted ? "#FFB5D8" : "#FFF"} 
          />
          <Text style={styles.controlText}>Mute</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.callButton, styles.endCallButton]}
          onPress={handleEndCall}
        >
          <MaterialIcons name="call-end" size={30} color="#FFF" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.controlButton}
          onPress={() => setIsSpeakerOn(!isSpeakerOn)}
        >
          <Ionicons 
            name={isSpeakerOn ? "volume-high" : "volume-medium"} 
            size={24} 
            color={isSpeakerOn ? "#FFB5D8" : "#FFF"} 
          />
          <Text style={styles.controlText}>Speaker</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
  
  // Render contact selection modal
  const renderContactsModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={pickContactModalVisible}
      onRequestClose={() => {
        if (contacts.length === 0) {
          // If no contacts, create a default one
          const defaultContact = {
            id: 'default',
            name: 'Unknown',
            phoneNumbers: [{ number: '9876543210' }],
          };
          selectContactForCall(defaultContact);
        } else {
          setPickContactModalVisible(false);
          navigation.goBack();
        }
      }}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Contact for Fake Call</Text>
          
          {contacts.length === 0 ? (
            <View style={styles.noContactsContainer}>
              <Ionicons name="person-outline" size={50} color="#999" />
              <Text style={styles.noContactsText}>No close contacts found</Text>
              <TouchableOpacity
                style={styles.defaultContactButton}
                onPress={() => {
                  const defaultContact = {
                    id: 'default',
                    name: 'Unknown',
                    phoneNumbers: [{ number: '9876543210' }],
                  };
                  selectContactForCall(defaultContact);
                }}
              >
                <Text style={styles.defaultContactText}>
                  Use Unknown Caller
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.addContactButton}
                onPress={() => {
                  navigation.navigate('CloseContacts');
                }}
              >
                <Text style={styles.addContactText}>
                  Add Close Contacts
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {contacts.map((contact) => (
                <TouchableOpacity
                  key={contact.id || contact.recordID || contact.phoneNumbers[0].number}
                  style={styles.contactItem}
                  onPress={() => selectContactForCall(contact)}
                >
                  <View 
                    style={[
                      styles.contactAvatar, 
                      {backgroundColor: getAvatarColor(contact.name)}
                    ]}
                  >
                    <Text style={styles.contactAvatarText}>
                      {getInitials(contact.name)}
                    </Text>
                  </View>
                  <View style={styles.contactInfo}>
                    <Text style={styles.contactName}>{contact.name}</Text>
                    <Text style={styles.contactNumber}>
                      {contact.phoneNumbers[0].number}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#999" />
                </TouchableOpacity>
              ))}
              
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setPickContactModalVisible(false);
                  navigation.goBack();
                }}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* Contact selection modal */}
      {renderContactsModal()}
      
      {/* Call screen content */}
      {isCallActive ? renderActiveCall() : renderIncomingCall()}
      
      {/* Call ending overlay */}
      {isCallEnding && (
        <View style={styles.callEndingOverlay}>
          <Text style={styles.callEndingText}>Call ended</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  incomingCallContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 100,
  },
  activeCallContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarContainer: {
    marginBottom: 20,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF30',
  },
  avatarText: {
    color: '#FFF',
    fontSize: 50,
    fontWeight: 'bold',
  },
  callerName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 10,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  incomingText: {
    fontSize: 18,
    color: '#AAA',
    marginBottom: 50,
  },
  callStatus: {
    fontSize: 18,
    color: '#AAA',
    marginBottom: 10,
  },
  callDuration: {
    fontSize: 22,
    color: '#FFF',
    marginBottom: 40,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  callActions: {
    flexDirection: 'row',
    width: '80%',
    justifyContent: 'space-around',
  },
  callButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  rejectButton: {
    backgroundColor: '#FF4444',
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  endCallButton: {
    backgroundColor: '#FF4444',
  },
  callControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 20,
  },
  controlButton: {
    alignItems: 'center',
    padding: 10,
    width: 80,
  },
  controlText: {
    fontSize: 12,
    color: '#FFF',
    marginTop: 5,
  },
  callEndingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  callEndingText: {
    color: '#FFF',
    fontSize: 20,
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'sans-serif-medium',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: height * 0.8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  noContactsContainer: {
    alignItems: 'center',
    padding: 30,
  },
  noContactsText: {
    fontSize: 16,
    color: '#666',
    marginTop: 15,
    marginBottom: 30,
  },
  defaultContactButton: {
    backgroundColor: '#FFB5D8',
    padding: 15,
    borderRadius: 25,
    width: '100%',
    alignItems: 'center',
    marginBottom: 15,
  },
  defaultContactText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  addContactButton: {
    borderWidth: 1,
    borderColor: '#FFB5D8',
    padding: 15,
    borderRadius: 25,
    width: '100%',
    alignItems: 'center',
  },
  addContactText: {
    color: '#FFB5D8',
    fontWeight: '500',
    fontSize: 16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  contactAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  contactAvatarText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '500',
  },
  contactNumber: {
    fontSize: 14,
    color: '#666',
  },
  cancelButton: {
    marginTop: 20,
    paddingVertical: 15,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    color: '#FF4444',
    fontWeight: '500',
  },
});

export default FakeCallScreen;