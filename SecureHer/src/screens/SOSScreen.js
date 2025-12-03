import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  Animated,
  Easing,
  Vibration,
  Platform,
  Linking,
  ActivityIndicator,
  Modal,
  AppState
} from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Accelerometer } from 'expo-sensors';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import * as Notifications from 'expo-notifications';

// Constants for background tasks
const BACKGROUND_ACCELEROMETER_TASK = 'BACKGROUND_ACCELEROMETER_TASK';
const BACKGROUND_FETCH_TASK = 'BACKGROUND_FETCH_TASK';

// Set up notifications for background operation
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Function to register accelerometer background task


// Register background task for accelerometer
TaskManager.defineTask(BACKGROUND_ACCELEROMETER_TASK, async ({ data, error }) => {
  if (error) {
    console.error('Background accelerometer task error:', error);
    return;
  }
  
  if (data) {
    const { x, y, z } = data.accelerometer;
    
    // Calculate acceleration magnitude
    const acceleration = Math.sqrt(x * x + y * y + z * z);
    const delta = acceleration - 1; // Subtract gravity
    
    // Check if acceleration is above threshold
    if (delta > 800) { // Same threshold as in component
      const lastShakeTime = await AsyncStorage.getItem('lastShakeTime') || '0';
      const now = Date.now();
      
      if (now - parseInt(lastShakeTime) > 3000) { // Prevent multiple triggers
        await AsyncStorage.setItem('lastShakeTime', now.toString());
        
        // Check if gesture mode is enabled
        const gestureModeEnabled = await AsyncStorage.getItem('gesture_mode_enabled');
        if (gestureModeEnabled === 'true') {
          // Show notification to confirm SOS
          await showSOSNotification();
        }
      }
    }
  }
  
  return BackgroundFetch.Result.NewData;
});

// Register background fetch task
TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    // Check if we need to keep accelerometer running
    const gestureModeEnabled = await AsyncStorage.getItem('gesture_mode_enabled');
    if (gestureModeEnabled === 'true') {
      // Re-register accelerometer task if needed
      await registerAccelerometerTask();
    }
    
    return BackgroundFetch.Result.NewData;
  } catch (error) {
    console.error('Background fetch task error:', error);
    return BackgroundFetch.Result.Failed;
  }
});

// Function to show SOS notification
async function showSOSNotification() {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'SOS Alert',
      body: 'Shake detected! Tap to activate emergency mode.',
      data: { screen: 'SOSScreen', action: 'activateSOS' },
    },
    trigger: null, // Show immediately
  });
}

// Function to register accelerometer background task
// Function to register accelerometer background task
async function registerAccelerometerTask() {
  try {
    // Check if we're in Expo Go or a standalone build
    const isInExpoGo = Constants.appOwnership === 'expo';
    
    if (isInExpoGo) {
      console.log('Running in Expo Go: Background tasks are limited. Consider using a development build for full functionality.');
      return;
    }
    
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_ACCELEROMETER_TASK);
    if (!isRegistered) {
      await TaskManager.registerTaskAsync(BACKGROUND_ACCELEROMETER_TASK, {
        minimumInterval: 1000, // 1 second
        startOnBoot: true
      });
      
      console.log('Registered background accelerometer task');
    }
  } catch (error) {
    console.error('Error registering accelerometer task:', error);
    
    // Show a user-friendly message
    Alert.alert(
      'Limited Functionality',
      'Shake detection in the background may be limited in this version. For full functionality, please use a development build.',
      [{ text: 'OK' }]
    );
  }
}

// Make sure to import Constants at the top of your file:
import Constants from 'expo-constants';

// Also fix the registerBackgroundFetch function similarly:
async function registerBackgroundFetch() {
  try {
    // Check if we're in Expo Go or a standalone build
    const isInExpoGo = Constants.appOwnership === 'expo';
    
    if (isInExpoGo) {
      console.log('Running in Expo Go: Background fetch is limited. Consider using a development build for full functionality.');
      return;
    }
    
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK);
    if (!isRegistered) {
      await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
        minimumInterval: 15 * 60, // 15 minutes
        stopOnTerminate: false,
        startOnBoot: true,
      });
      console.log('Registered background fetch task');
    }
  } catch (error) {
    console.error('Error registering background fetch task:', error);
  }
}

// Handle notification interactions
Notifications.addNotificationResponseReceivedListener(response => {
  const { action } = response.notification.request.content.data;
  if (action === 'activateSOS') {
    // Set a flag that the SOS screen can check
    AsyncStorage.setItem('pendingSOSActivation', 'true');
  }
});

const SOSScreen = () => {
  const navigation = useNavigation();
  const [isEmergency, setIsEmergency] = useState(false);
  const [location, setLocation] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [closeContacts, setCloseContacts] = useState([]);
  const [messagesSent, setMessagesSent] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [sendingMessages, setSendingMessages] = useState(false);
  const [gestureModeEnabled, setGestureModeEnabled] = useState(true);
  
  // Animation refs
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const countdownTimer = useRef(null);
  
  // App state tracking
  const appState = useRef(AppState.currentState);
  const [appStateVisible, setAppStateVisible] = useState(appState.current);

  // Handle app state changes (foreground/background)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      appState.current = nextAppState;
      setAppStateVisible(appState.current);
      
      if (nextAppState === 'active') {
        // App came to foreground
        checkPendingSOSActivation();
      } else if (nextAppState.match(/inactive|background/)) {
        // App went to background
        saveStateForBackground();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Set up shake detection
  useEffect(() => {
    let subscription;
    
    if (gestureModeEnabled && !isEmergency && appStateVisible === 'active') {
      Accelerometer.setUpdateInterval(100);
      subscription = Accelerometer.addListener(accelerometerData => {
        detectShake(accelerometerData);
      });
    }
    
    // Initialize background services
    initializeBackgroundServices();
    
    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, [gestureModeEnabled, isEmergency, appStateVisible]);

  useEffect(() => {
    // Get location immediately
    fetchLocation();
    loadCloseContacts();
    
    // Start the pulsing animation
    startPulseAnimation();
    
    // Vibrate pattern for emergency
    Vibration.vibrate([500, 300, 500, 300]);
    
    // Load gesture settings
    loadGestureSettings();
    
    // Check if there's a pending SOS activation
    checkPendingSOSActivation();
    
    // Set up screen listeners
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (isEmergency) {
        // Prevent going back without confirmation during emergency
        e.preventDefault();
        setShowCancelModal(true);
      }
    });

    return () => {
      // Clean up animations and vibrations
      Vibration.cancel();
      unsubscribe();
      if (countdownTimer.current) {
        clearInterval(countdownTimer.current);
      }
    };
  }, [navigation, isEmergency]);

  const initializeBackgroundServices = async () => {
    try {
      // Request notification permissions
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Notification permissions are needed for background SOS alerts.');
      }
      
      // Register background tasks
      await registerBackgroundFetch();
      
      // If gesture mode is enabled, start accelerometer in background
      if (gestureModeEnabled) {
        await registerAccelerometerTask();
      }
    } catch (error) {
      console.error('Error initializing background services:', error);
    }
  };

  const saveStateForBackground = async () => {
    try {
      // Save any state needed for background processing
      await AsyncStorage.setItem('gesture_mode_enabled', gestureModeEnabled ? 'true' : 'false');
    } catch (error) {
      console.error('Error saving state for background:', error);
    }
  };

  const checkPendingSOSActivation = async () => {
    try {
      const pendingSOS = await AsyncStorage.getItem('pendingSOSActivation');
      if (pendingSOS === 'true') {
        // Clear the flag
        await AsyncStorage.setItem('pendingSOSActivation', 'false');
        
        // Show confirmation to user
        Alert.alert(
          'SOS Alert',
          'Activate emergency mode?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Activate', onPress: startCountdown }
          ]
        );
      }
    } catch (error) {
      console.error('Error checking pending SOS:', error);
    }
  };

  const loadGestureSettings = async () => {
    try {
      const settings = await AsyncStorage.getItem('gesture_settings');
      if (settings) {
        const parsedSettings = JSON.parse(settings);
        setGestureModeEnabled(parsedSettings.enabled ?? true);
      }
    } catch (error) {
      console.error('Error loading gesture settings:', error);
    }
  };

  const detectShake = async (data) => {
    if (!gestureModeEnabled || isEmergency) return;
    
    const { x, y, z } = data;
    
    // Calculate acceleration magnitude
    const acceleration = Math.sqrt(x * x + y * y + z * z);
    const delta = acceleration - 1; // Subtract gravity
    
    // Check if acceleration is above threshold
    if (delta > 800) {
      const lastShakeTime = await AsyncStorage.getItem('lastShakeTime') || '0';
      const now = Date.now();
      
      if (now - parseInt(lastShakeTime) > 3000) { // Prevent multiple triggers
        await AsyncStorage.setItem('lastShakeTime', now.toString());
        
        // Provide feedback
        Vibration.vibrate(500);
        
        // Show confirmation
        Alert.alert(
          'SOS Alert',
          'Shake detected. Activate emergency mode?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Activate', onPress: startCountdown }
          ]
        );
      }
    }
  };

  const toggleGestureMode = async () => {
    const newValue = !gestureModeEnabled;
    setGestureModeEnabled(newValue);
    
    // Save the setting
    try {
      const settings = JSON.stringify({ enabled: newValue });
      await AsyncStorage.setItem('gesture_settings', settings);
      await AsyncStorage.setItem('gesture_mode_enabled', newValue ? 'true' : 'false');
      
      // Update background tasks
      if (newValue) {
        await registerAccelerometerTask();
      } else {
        // Unregister is not directly supported in Expo Go, but we can use the flags
        // to ensure the logic in the task doesn't run
      }
      
      // Show feedback
      Alert.alert(
        'Gesture Detection',
        newValue 
          ? 'Gesture-based SOS detection has been enabled. The app will detect shake motions in the background.'
          : 'Gesture-based SOS detection has been disabled.'
      );
    } catch (error) {
      console.error('Error saving gesture settings:', error);
    }
  };

  const startCountdown = () => {
    setCountdown(5);
    countdownTimer.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownTimer.current);
          activateEmergency();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const cancelCountdown = () => {
    if (countdownTimer.current) {
      clearInterval(countdownTimer.current);
      setCountdown(5);
    }
  };

  const fetchLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location access is required for emergency services.');
        setLoadingLocation(false);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });
      setLocation(currentLocation);
      setLoadingLocation(false);
    } catch (error) {
      console.error('Error getting location:', error);
      setLoadingLocation(false);
      Alert.alert('Location Error', 'Unable to get your current location. Please try again.');
    }
  };

  const loadCloseContacts = async () => {
    try {
      const contacts = await AsyncStorage.getItem('close_contacts');
      if (contacts) {
        setCloseContacts(JSON.parse(contacts));
      }
    } catch (error) {
      console.error('Error loading close contacts:', error);
    }
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const animateSOSButton = () => {
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1.1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const activateEmergency = async () => {
    setIsEmergency(true);
    
    // More intense vibration
    Vibration.vibrate([500, 300, 500, 300, 500, 300, 500]);
    
    // Send messages to emergency contacts - only once
    if (!messagesSent) {
      await sendEmergencyMessages();
    }
  };
  
  // Inside sendEmergencyMessages function, add error handling for the API call:
  
  const sendEmergencyMessages = async () => {
    try {
      setSendingMessages(true);
      
      if (!location) {
        await fetchLocation();
      }
      
      if (closeContacts.length === 0) {
        Alert.alert('No emergency contacts', 'Please add emergency contacts in your settings.');
        setSendingMessages(false);
        return;
      }
      
      const { latitude, longitude } = location.coords;
      
      // Extract phone numbers from contacts
      const phoneNumbers = closeContacts.map(contact => {
        let phoneNumber = contact.phoneNumbers[0].number.replace(/\D/g, '');
        
        // Add country code if not present
        if (phoneNumber.length === 10) {
          phoneNumber = `${phoneNumber}`; // The API will handle country code
        }
        
        return phoneNumber;
      });
      
      // Create request body for API
      const requestBody = {
        phoneNumbers: phoneNumbers,
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        url: `https://maps.google.com/maps?q=${latitude},${longitude}`
      };
      
      // Add a timeout to the fetch call
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      try {
        // Call the API
        const response = await fetch('https://womensafety-1-5znp.onrender.com/users/sendWelcomeMessage', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`API responded with status: ${response.status}`);
        }
        
        const responseData = await response.json();
        
        if (responseData && responseData.success) {
          console.log('SOS messages sent successfully:', responseData);
          setMessagesSent(true);
          Alert.alert('Alert Sent', 'Emergency messages have been sent to your contacts.');
          
          // Automatically prompt to call emergency services after message
          setTimeout(() => {
            Alert.alert(
              'Call Emergency',
              'Would you like to call emergency services?',
              [
                {
                  text: 'Cancel',
                  style: 'cancel'
                },
                {
                  text: 'Call 112',
                  onPress: () => callEmergencyServices('112')
                }
              ]
            );
          }, 1500);
        } else {
          throw new Error('API returned unsuccessful response');
        }
      } catch (fetchError) {
        console.error('Error with SOS API call:', fetchError);
        throw fetchError;
      }
    } catch (error) {
      console.error('Error sending emergency messages:', error);
      
      // Only show alert once, not in a loop
      if (!messagesSent) {
        Alert.alert(
          'Error', 
          'Failed to send emergency messages through the service. Would you like to try sending directly?',
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => {
                // Mark as sent to prevent more alerts
                setMessagesSent(true);
              }
            },
            {
              text: 'Send Direct Messages',
              onPress: () => {
                sendDirectEmergencyMessages();
                // Mark as sent to prevent more alerts
                setMessagesSent(true);
              }
            }
          ]
        );
      }
    } finally {
      setSendingMessages(false);
    }
  };
  
  // Fallback method to send messages directly via device apps
  const sendDirectEmergencyMessages = async () => {
    try {
      if (!location) {
        await fetchLocation();
      }
      
      if (!location) {
        Alert.alert('Error', 'Unable to get your location. Please try again.');
        return;
      }
      
      const { latitude, longitude } = location.coords;
      const googleMapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
      const message = `EMERGENCY ALERT: I need help! This is my current location: ${googleMapsUrl}`;
      
      let successCount = 0;
      
      // Send to each contact
      for (const contact of closeContacts) {
        try {
          let phoneNumber = contact.phoneNumbers[0].number.replace(/\D/g, '');
          
          // Add country code if not present
          if (phoneNumber.length === 10) {
            phoneNumber = `91${phoneNumber}`; // Adding India's country code
          }
          
          // Try to send via WhatsApp first
          try {
            const whatsappUrl = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;
            await Linking.openURL(whatsappUrl);
            
            // Wait for user to complete action in WhatsApp
            Alert.alert(
              'Message via WhatsApp',
              `Send the message to ${contact.name}? (Press Send in WhatsApp)`,
              [{ text: 'OK', onPress: () => successCount++ }]
            );
            
            // Allow time for the user to interact with WhatsApp
            await new Promise(resolve => setTimeout(resolve, 3000));
            
          } catch (whatsappError) {
            // If WhatsApp fails, try SMS
            console.log('WhatsApp sending failed, trying SMS');
            try {
              const smsUrl = `sms:${phoneNumber}?body=${encodeURIComponent(message)}`;
              await Linking.openURL(smsUrl);
              
              // Wait for user to complete action in SMS app
              Alert.alert(
                'Message via SMS',
                `Send the message to ${contact.name}? (Press Send in your SMS app)`,
                [{ text: 'OK', onPress: () => successCount++ }]
              );
              
              // Allow time for the user to interact with SMS app
              await new Promise(resolve => setTimeout(resolve, 3000));
            } catch (smsError) {
              console.error(`Error sending SMS to ${contact.name}:`, smsError);
              Alert.alert('SMS Error', `Could not send SMS to ${contact.name}. Please try manually.`);
            }
          }
        } catch (error) {
          console.error(`Error sending message to ${contact.name}:`, error);
        }
      }
      
      setMessagesSent(true);
      
      if (successCount > 0) {
        Alert.alert('Alert Sent', `Emergency messages have been sent to ${successCount} of your contacts.`);
      } else {
        Alert.alert(
          'Error', 
          'Could not send messages automatically. Please try calling emergency services directly.',
          [
            {
              text: 'Call Emergency (112)',
              onPress: () => callEmergencyServices('112')
            },
            {
              text: 'Cancel',
              style: 'cancel'
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error sending direct messages:', error);
      Alert.alert('Error', 'Failed to send emergency messages. Please try calling emergency services directly.');
    }
  };

  const callEmergencyServices = (number) => {
    try {
      Linking.openURL(`tel:${number}`);
    } catch (error) {
      console.error('Error making emergency call:', error);
      Alert.alert('Call Failed', 'Unable to make the call. Please dial emergency services manually.');
    }
  };

  const handleSOSPress = () => {
    animateSOSButton();
    
    if (!isEmergency) {
      startCountdown();
    } else {
      // If already in emergency mode, pressing again will call emergency services
      Alert.alert(
        'Emergency Call',
        'Call emergency services?',
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Call 112',
            onPress: () => callEmergencyServices('112')
          },
          {
            text: 'Call Police (100)',
            onPress: () => callEmergencyServices('100')
          },
          {
            text: 'Women Helpline (1090)',
            onPress: () => callEmergencyServices('1090')
          }
        ]
      );
    }
  };

  const cancelEmergency = () => {
    setShowCancelModal(false);
    setIsEmergency(false);
    Vibration.cancel();
    navigation.goBack();
  };

  const renderCancelModal = () => (
    <Modal
      visible={showCancelModal}
      transparent={true}
      animationType="fade"
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Cancel Emergency?</Text>
          <Text style={styles.modalText}>
            Are you sure you want to cancel the emergency alert?
          </Text>
          <View style={styles.modalButtons}>
            <TouchableOpacity 
              style={[styles.modalButton, styles.modalButtonCancel]}
              onPress={() => setShowCancelModal(false)}
            >
              <Text style={styles.modalButtonText}>No, stay in emergency mode</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.modalButton, styles.modalButtonConfirm]}
              onPress={cancelEmergency}
            >
              <Text style={styles.modalButtonText}>Yes, cancel emergency</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#FF4444" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => {
            if (isEmergency) {
              setShowCancelModal(true);
            } else {
              navigation.goBack();
            }
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEmergency ? "EMERGENCY ACTIVE" : "SOS EMERGENCY"}
        </Text>
        <TouchableOpacity 
          style={styles.headerRight}
          onPress={toggleGestureMode}
        >
          <Ionicons 
            name={gestureModeEnabled ? "hand" : "hand-outline"} 
            size={24} 
            color="#FFF" 
          />
        </TouchableOpacity>
      </View>
      
      {/* Status indicator */}
      <View style={[
        styles.statusContainer,
        {backgroundColor: isEmergency ? '#FF4444' : '#FFB5D8'}
      ]}>
        <Animated.View 
          style={[
            styles.pulseCircle,
            {
              transform: [{ scale: pulseAnim }],
              backgroundColor: isEmergency ? '#FF4444' : '#FFB5D8'
            }
          ]} 
        />
        <Text style={styles.statusText}>
          {isEmergency 
            ? "Emergency Mode Active" 
            : countdown < 5 
              ? `Emergency activation in ${countdown}...` 
              : "Press SOS to Activate Emergency"
          }
        </Text>
      </View>
      
      {/* Gesture mode indicator */}
      {!isEmergency && (
        <View style={styles.gestureContainer}>
          <View style={styles.gestureStatusRow}>
            <Text style={styles.gestureStatusText}>
              Background SOS gesture detection:
            </Text>
            <Text style={[
              styles.gestureStatusValue,
              {color: gestureModeEnabled ? '#4CAF50' : '#FF4444'}
            ]}>
              {gestureModeEnabled ? 'ENABLED' : 'DISABLED'}
            </Text>
          </View>
          {gestureModeEnabled && (
            <Text style={styles.gestureDescription}>
              Shake your device vigorously at any time to trigger an SOS alert, even when the app is in the background.
            </Text>
          )}
        </View>
      )}
      
      {/* Location section */}
      <View style={styles.locationContainer}>
        <Text style={styles.sectionTitle}>Your Current Location</Text>
        
        {loadingLocation ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFB5D8" />
            <Text style={styles.loadingText}>Getting your location...</Text>
          </View>
        ) : location ? (
          <View style={styles.locationDetails}>
            <Ionicons name="location" size={24} color="#FFB5D8" />
            <View style={styles.locationText}>
              <Text style={styles.locationCoords}>
                Lat: {location.coords.latitude.toFixed(6)}, Lng: {location.coords.longitude.toFixed(6)}
              </Text>
              <Text style={styles.locationAccuracy}>
                Accuracy: ±{Math.round(location.coords.accuracy)} meters
              </Text>
            </View>
            
            <TouchableOpacity 
              style={styles.shareLocationButton}
              onPress={() => {
                const { latitude, longitude } = location.coords;
                const googleMapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
                Linking.openURL(googleMapsUrl);
              }}
            >
              <Text style={styles.shareLocationText}>View Map</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.locationError}>
            <MaterialIcons name="location-off" size={24} color="#FF4444" />
            <Text style={styles.locationErrorText}>
              Unable to get your location. Emergency services may not be able to locate you accurately.
            </Text>
          </View>
        )}
      </View>
      
      {/* Emergency contacts section */}
      <View style={styles.contactsContainer}>
        <Text style={styles.sectionTitle}>Emergency Contacts ({closeContacts.length})</Text>
        
        {closeContacts.length > 0 ? (
          <View style={styles.contactsList}>
            {closeContacts.slice(0, 3).map((contact, index) => (
              <View key={index} style={styles.contactItem}>
                <View style={styles.contactIcon}>
                  <Text style={styles.contactInitial}>
                    {contact.name[0].toUpperCase()}
                  </Text>
                </View>
                <View style={styles.contactInfo}>
                  <Text style={styles.contactName}>{contact.name}</Text>
                  <Text style={styles.contactNumber}>
                    {contact.phoneNumbers && contact.phoneNumbers[0] ? contact.phoneNumbers[0].number : 'No number'}
                  </Text>
                </View>
                <View style={[
                  styles.contactStatus, 
                  {backgroundColor: messagesSent ? '#4CAF50' : (sendingMessages ? '#FFB5D8' : '#E0E0E0')}
                ]}>
                  <Text style={[
                    styles.contactStatusText, 
                    {color: messagesSent ? '#FFF' : (sendingMessages ? '#FFF' : '#666')}
                  ]}>
                    {messagesSent ? 'Sent' : (sendingMessages ? 'Sending...' : 'Pending')}
                  </Text>
                </View>
              </View>
            ))}
            
            {closeContacts.length > 3 && (
              <Text style={styles.moreContactsText}>
                +{closeContacts.length - 3} more contacts
              </Text>
            )}
          </View>
        ) : (
          <View style={styles.noContactsContainer}>
            <FontAwesome5 name="user-friends" size={24} color="#666" />
            <Text style={styles.noContactsText}>
              No emergency contacts added. Add contacts to alert them during emergencies.
            </Text>
          </View>
        )}
      </View>
      
      {/* Emergency services section */}
      <View style={styles.servicesContainer}>
        <Text style={styles.sectionTitle}>Emergency Services</Text>
        
        <View style={styles.servicesGrid}>
          <TouchableOpacity 
            style={styles.serviceButton}
            onPress={() => callEmergencyServices('112')}
          >
            <FontAwesome5 name="phone-alt" size={20} color="#FFF" />
            <Text style={styles.serviceText}>112</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.serviceButton}
            onPress={() => callEmergencyServices('100')}
          >
            <Ionicons name="shield" size={20} color="#FFF" />
            <Text style={styles.serviceText}>Police</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.serviceButton}
            onPress={() => callEmergencyServices('108')}
          >
            <FontAwesome5 name="ambulance" size={20} color="#FFF" />
            <Text style={styles.serviceText}>Ambulance</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.serviceButton}
            onPress={() => callEmergencyServices('1090')}
          >
            <Ionicons name="woman" size={20} color="#FFF" />
            <Text style={styles.serviceText}>Women</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Main SOS button */}
      <View style={styles.sosButtonContainer}>
        <Animated.View style={{
          transform: [{ scale: buttonScale }]
        }}>
          <TouchableOpacity 
            style={[
              styles.mainSOSButton,
              isEmergency && styles.mainSOSButtonActive
            ]}
            onPress={handleSOSPress}
            activeOpacity={0.7}
            disabled={sendingMessages}
          >
            {sendingMessages ? (
              <ActivityIndicator size="large" color="#FFF" />
            ) : (
              <Text style={styles.mainSOSText}>
                {isEmergency ? "EMERGENCY ACTIVE" : countdown < 5 ? `${countdown}` : "SOS"}
              </Text>
            )}
          </TouchableOpacity>
        </Animated.View>
        
        {countdown < 5 && !isEmergency && !sendingMessages && (
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={cancelCountdown}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {renderCancelModal()}
    </SafeAreaView>
  );
};

// Add new styles while keeping existing ones
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
    backgroundColor: '#FF4444',
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  backButton: {
    padding: 8,
  },
  headerRight: {
    padding: 8,
  },
  statusContainer: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  pulseCircle: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    opacity: 0.3,
  },
  statusText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
    padding: 16,
  },
  gestureContainer: {
    backgroundColor: '#FFF8F8',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFE0E0',
  },
  gestureStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gestureStatusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  gestureStatusValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  gestureDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    lineHeight: 18,
  },
  locationContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  loadingText: {
    marginTop: 8,
    color: '#666',
  },
  locationDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    padding: 12,
    borderRadius: 8,
  },
  locationText: {
    flex: 1,
    marginLeft: 12,
  },
  locationCoords: {
    fontSize: 14,
    marginBottom: 4,
  },
  locationAccuracy: {
    fontSize: 12,
    color: '#666',
  },
  shareLocationButton: {
    backgroundColor: '#FFB5D8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  shareLocationText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  locationError: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEEEE',
    padding: 12,
    borderRadius: 8,
  },
  locationErrorText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#FF4444',
  },
  contactsContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  contactsList: {
    marginBottom: 8,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  contactIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFB5D8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contactInitial: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  contactNumber: {
    fontSize: 12,
    color: '#666',
  },
  contactStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  contactStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  moreContactsText: {
    textAlign: 'center',
    padding: 8,
    color: '#666',
    fontSize: 14,
  },
  noContactsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    padding: 16,
    borderRadius: 8,
  },
  noContactsText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#666',
  },
  servicesContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  servicesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  serviceButton: {
    backgroundColor: '#FFB5D8',
    width: '22%',
    aspectRatio: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  serviceText: {
    marginTop: 4,
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  sosButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
    padding: 20,
  },
  mainSOSButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFB5D8',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  mainSOSButtonActive: {
    backgroundColor: '#FF4444',
  },
  mainSOSText: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  cancelButton: {
    marginTop: 16,
    padding: 8,
  },
  cancelButtonText: {
    color: '#FF4444',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 24,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  modalText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    color: '#666',
  },
  modalButtons: {
    width: '100%',
  },
  modalButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  modalButtonCancel: {
    backgroundColor: '#F0F0F0',
  },
  modalButtonConfirm: {
    backgroundColor: '#FF4444',
  },
  modalButtonText: {
    fontWeight: 'bold',
    color: '#FFF',
  },
});

export default SOSScreen;