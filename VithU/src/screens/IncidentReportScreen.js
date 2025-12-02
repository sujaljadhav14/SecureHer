import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  Image,
  Dimensions
} from 'react-native';

import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Audio } from 'expo-av';
import * as Sharing from 'expo-sharing';
import { useTranslations } from '../hooks/useTranslations';
import axios from 'axios';

const { width } = Dimensions.get('window');
const API_BASE_URL = 'https://womensafety-1-5znp.onrender.com';

const IncidentReportScreen = () => {
  const { t } = useTranslations();
  const navigation = useNavigation();
  const route = useRoute();
  const initialLocation = route.params?.location || null;
  
  // State variables
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState(initialLocation);
  const [incidentType, setIncidentType] = useState('');
  const [incidentDescription, setIncidentDescription] = useState('');
  const [incidentDate, setIncidentDate] = useState(new Date());
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [recordingUri, setRecordingUri] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [autoDetectedDetails, setAutoDetectedDetails] = useState(null);
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [incidentResponse, setIncidentResponse] = useState(null);
  const [priority, setPriority] = useState('Low');
  const [status, setStatus] = useState('Active');
  
  // Recording refs
  const recording = useRef(null);
  
  // Incident type options
  const incidentTypes = [
    'Harassment', 
    'Stalking', 
    'Assault', 
    'Theft',
    'Domestic Violence',
    'Public Misconduct',
    'Threat',
    'Other'
  ];

  // Priority options
  const priorityOptions = ['Low', 'Medium', 'High', 'Critical'];

  useEffect(() => {
    // Check and get permissions
    (async () => {
      if (!location) {
        await fetchLocation();
      }
      
      await requestMediaPermissions();
      await Audio.requestPermissionsAsync();
    })();
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

  const requestMediaPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera and media library access is needed to add photos to your report.');
      }
      
      const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
      if (cameraStatus.status !== 'granted') {
        Alert.alert('Permission Required', 'Camera access is needed to take photos for your report.');
      }
    }
  };

  const fetchLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location access is helpful for your report.');
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });
      setLocation(currentLocation);
      
      // Get address from coordinates
      const [address] = await Location.reverseGeocodeAsync({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude
      });
      
      // Set auto-detected details
      setAutoDetectedDetails({
        location: {
          coords: currentLocation.coords,
          address: address ? formatAddress(address) : 'Unknown location'
        },
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Location Error', 'Unable to get your current location.');
    }
  };
  
  const formatAddress = (address) => {
    const parts = [
      address.street,
      address.city,
      address.region,
      address.postalCode,
      address.country
    ].filter(part => part);
    
    return parts.join(', ');
  };

  const handleTakePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImages([...images, result.assets[0].uri]);
        setSelectedImage(result.assets[0]);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        setImages([...images, uri]);
        setSelectedImage(result.assets[0]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleRemoveImage = (index) => {
    const updatedImages = [...images];
    updatedImages.splice(index, 1);
    setImages(updatedImages);
    if (index === 0) {
      setSelectedImage(null);
    }
  };

  const startRecording = async () => {
    try {
      // Clear any existing recording
      if (recordingUri) {
        await FileSystem.deleteAsync(recordingUri).catch(() => {});
        setRecordingUri(null);
      }
      
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      recording.current = newRecording;
      setIsRecording(true);
      
      Alert.alert('Recording', 'Started recording your statement');
    } catch (error) {
      console.error('Error starting recording:', error);
      Alert.alert('Recording Error', 'Could not start recording');
    }
  };

  const stopRecording = async () => {
    try {
      if (!recording.current) return;
      
      setIsRecording(false);
      await recording.current.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });
      
      const uri = recording.current.getURI();
      setRecordingUri(uri);
      recording.current = null;
      
      Alert.alert('Recording', 'Your statement has been recorded');
    } catch (error) {
      console.error('Error stopping recording:', error);
      Alert.alert('Recording Error', 'Failed to save recording');
    }
  };

  const validateIncidentData = () => {
    if (!incidentType) {
      Alert.alert('Missing Information', 'Please select an incident type');
      return false;
    }
    
    if (!incidentDescription) {
      Alert.alert('Missing Information', 'Please provide a description of the incident');
      return false;
    }
    
    if (!location) {
      Alert.alert('Missing Information', 'Location information is required');
      return false;
    }
    
    return true;
  };

  // Modify the submitIncidentReport function to handle the server error better
const submitIncidentReport = async () => {
  if (!validateIncidentData()) {
    return;
  }
  
  try {
    setLoading(true);
    
    // Get auth token
    const token = await getAuthToken();
    if (!token) {
      Alert.alert('Authentication Error', 'Please log in again');
      navigation.navigate('Login');
      return;
    }
    
    // Create a FormData object
    const formData = new FormData();
    
    // Add text fields
    formData.append('type', incidentType);
    formData.append('location', autoDetectedDetails?.location?.address || 'Unknown location');
    formData.append('description', incidentDescription);
    formData.append('priority', priority);
    formData.append('status', status);
    
    // Add image if available (making sure to format it correctly)
    if (recordingUri) {
      const audioUri = Platform.OS === 'ios' ? recordingUri.replace('file://', '') : recordingUri;
      const audioFilename = audioUri.split('/').pop() || 'audio_recording.m4a';
      
      // Make sure to use "incidentAudio" as the field name to match the API expectation
      formData.append('incidentAudio', {
        uri: audioUri,
        name: audioFilename,
        type: 'audio/m4a' // Ensure the correct MIME type
      });
      
      console.log('Audio data:', { uri: audioUri, name: audioFilename, type: 'audio/m4a' });
    }
    if (selectedImage) {
      const imageUri = Platform.OS === 'ios' ? selectedImage.uri.replace('file://', '') : selectedImage.uri;
      const filename = imageUri.split('/').pop();
      // Make sure the mime type is correct
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';
      
      formData.append('incidentImage', {
        uri: imageUri,
        name: filename || 'photo.jpg',
        type
      });
      
      console.log('Image data:', { uri: imageUri, name: filename, type });
    }
    
    console.log('Submitting form data:', JSON.stringify(formData));
    
    // Make API request with proper content type
    const response = await axios.post(
      `${API_BASE_URL}/users/createIncident`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json'
        },
        timeout: 30000 // Increase timeout to 30 seconds
      }
    );
    
    console.log('Incident report response:', response.data);
    
    if (response.data && response.data.message === 'Incident reported successfully') {
      setReportSubmitted(true);
      setIncidentResponse(response.data.incident);
      saveIncidentToHistory(response.data.incident);
      Alert.alert('Report Submitted', 'Your incident report has been submitted successfully.');
    }
  } catch (error) {
    console.error('Error submitting incident report:', error);
    
    // Enhanced error logging
    if (error.response) {
      console.log('Error response data:', error.response.data);
      console.log('Error response status:', error.response.status);
      console.log('Error response headers:', error.response.headers);
    } else if (error.request) {
      console.log('Error request:', error.request);
    } else {
      console.log('Error message:', error.message);
    }
    
    // User-friendly error message
    Alert.alert(
      'Submission Failed', 
      'There was a problem submitting your report. Please check your internet connection and try again.',
      [
        {
          text: 'Try Again',
          onPress: () => submitIncidentReport()
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  } finally {
    setLoading(false);
  }
};
  const saveIncidentToHistory = async (incident) => {
    try {
      // Get existing incidents
      const existingIncidentsJson = await AsyncStorage.getItem('incident_history');
      const existingIncidents = existingIncidentsJson ? JSON.parse(existingIncidentsJson) : [];
      
      // Add new incident to history
      const updatedIncidents = [incident, ...existingIncidents];
      
      // Save back to storage
      await AsyncStorage.setItem('incident_history', JSON.stringify(updatedIncidents));
    } catch (error) {
      console.error('Error saving incident to history:', error);
    }
  };

  const shareIncidentDetails = async () => {
    if (!incidentResponse) return;
    
    try {
      setLoading(true);
      
      // Generate text content
      const incidentDetails = `
INCIDENT REPORT
--------------
Incident #: ${incidentResponse.incidentId}
Type: ${incidentResponse.type}
Reported on: ${new Date(incidentResponse.createdAt).toLocaleString()}
Status: ${incidentResponse.status}
Priority: ${incidentResponse.priority}
Location: ${incidentResponse.location}

Description:
${incidentResponse.description}

${incidentResponse.imageUrl ? `Image: ${incidentResponse.imageUrl}` : ''}
${incidentResponse.audioUrl ? `Audio: ${incidentResponse.audioUrl}` : ''}
      `.trim();
      
      // Create a temporary file
      const filename = `Incident_${incidentResponse.incidentId}.txt`;
      const filePath = `${FileSystem.documentDirectory}${filename}`;
      
      // Write to file
      await FileSystem.writeAsStringAsync(filePath, incidentDetails);
      
      // Share the file
      await Sharing.shareAsync(filePath);
    } catch (error) {
      console.error('Error sharing incident details:', error);
      Alert.alert('Error', 'Could not share the incident details');
    } finally {
      setLoading(false);
    }
  };

  const handleNewReport = () => {
    // Reset the form
    setIncidentType('');
    setIncidentDescription('');
    setImages([]);
    setSelectedImage(null);
    setRecordingUri(null);
    setPriority('Low');
    setStatus('Active');
    setReportSubmitted(false);
    setIncidentResponse(null);
  };

  // Render success view after submission
  const renderSuccessView = () => {
    if (!incidentResponse) return null;
    
    return (
      <View style={styles.successContainer}>
        <View style={styles.successHeader}>
          <Ionicons name="checkmark-circle" size={60} color="#4CAF50" style={styles.successIcon} />
          <Text style={styles.successTitle}>Report Submitted</Text>
          <Text style={styles.successSubtitle}>Incident #{incidentResponse.incidentId}</Text>
        </View>
        
        <View style={styles.incidentDetailsCard}>
          <View style={styles.incidentDetailItem}>
            <Text style={styles.detailLabel}>Type:</Text>
            <Text style={styles.detailValue}>{incidentResponse.type}</Text>
          </View>
          
          <View style={styles.incidentDetailItem}>
            <Text style={styles.detailLabel}>Status:</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(incidentResponse.status) }]}>
              <Text style={styles.statusText}>{incidentResponse.status}</Text>
            </View>
          </View>
          
          <View style={styles.incidentDetailItem}>
            <Text style={styles.detailLabel}>Priority:</Text>
            <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(incidentResponse.priority) }]}>
              <Text style={styles.priorityText}>{incidentResponse.priority}</Text>
            </View>
          </View>
          
          <View style={styles.incidentDetailItem}>
            <Text style={styles.detailLabel}>Reported on:</Text>
            <Text style={styles.detailValue}>
              {new Date(incidentResponse.createdAt).toLocaleString()}
            </Text>
          </View>
          
          <View style={styles.incidentDetailItem}>
            <Text style={styles.detailLabel}>Location:</Text>
            <Text style={styles.detailValue}>{incidentResponse.location}</Text>
          </View>
          
          <View style={styles.descriptionContainer}>
            <Text style={styles.detailLabel}>Description:</Text>
            <Text style={styles.descriptionText}>{incidentResponse.description}</Text>
          </View>
          
          {incidentResponse.imageUrl && (
            <View style={styles.evidenceContainer}>
              <Text style={styles.detailLabel}>Image Evidence:</Text>
              <Image 
                source={{ uri: incidentResponse.imageUrl }}
                style={styles.evidenceImage}
                resizeMode="cover"
              />
            </View>
          )}
          
          {incidentResponse.audioUrl && (
            <View style={styles.audioEvidenceContainer}>
              <Text style={styles.detailLabel}>Audio Statement:</Text>
              <TouchableOpacity 
                style={styles.audioPlayButton}
                onPress={() => {
                  // Add audio playback functionality here
                  Alert.alert('Audio', 'Playing audio statement...');
                }}
              >
                <Ionicons name="play-circle" size={24} color="#FFB5D8" />
                <Text style={styles.audioPlayText}>Play Statement</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        <View style={styles.successActions}>
          <TouchableOpacity 
            style={styles.shareButton}
            onPress={shareIncidentDetails}
          >
            <Ionicons name="share-outline" size={20} color="#FFF" />
            <Text style={styles.actionButtonText}>Share Details</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.newReportButton}
            onPress={handleNewReport}
          >
            <Ionicons name="add-circle-outline" size={20} color="#FFF" />
            <Text style={styles.actionButtonText}>New Report</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Helper functions for styling
  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return '#FFB5D8';
      case 'Investigating': return '#FFC107';
      case 'Resolved': return '#4CAF50';
      case 'Closed': return '#9E9E9E';
      default: return '#FFB5D8';
    }
  };
  
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Low': return '#4CAF50';
      case 'Medium': return '#FFC107';
      case 'High': return '#FF9800';
      case 'Critical': return '#FF5252';
      default: return '#4CAF50';
    }
  };

  // Render the form for creating a report
  const renderFormView = () => {
    return (
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.formContainer}
      >
        {/* Incident Type Selection */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Type of Incident*</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.typeButtonsContainer}
          >
            {incidentTypes.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.typeButton,
                  incidentType === type && styles.selectedTypeButton
                ]}
                onPress={() => setIncidentType(type)}
              >
                <Text style={[
                  styles.typeButtonText,
                  incidentType === type && styles.selectedTypeButtonText
                ]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        
        {/* Priority Selection */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Priority</Text>
          <View style={styles.priorityContainer}>
            {priorityOptions.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.priorityButton,
                  { backgroundColor: getPriorityColor(option) },
                  priority === option && styles.selectedPriorityButton
                ]}
                onPress={() => setPriority(option)}
              >
                <Text style={styles.priorityButtonText}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        {/* Location Information */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Location*</Text>
          <View style={styles.locationDisplay}>
            <Ionicons name="location" size={20} color="#FFB5D8" />
            <Text style={styles.locationText}>
              {autoDetectedDetails?.location?.address || 'Getting your location...'}
            </Text>
            {!autoDetectedDetails?.location?.address && (
              <TouchableOpacity style={styles.refreshButton} onPress={fetchLocation}>
                <Ionicons name="refresh" size={20} color="#FFB5D8" />
              </TouchableOpacity>
            )}
          </View>
        </View>
        
        {/* Incident Description */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Describe what happened*</Text>
          <TextInput
            style={styles.descriptionInput}
            multiline
            placeholder="Please provide details of the incident..."
            value={incidentDescription}
            onChangeText={setIncidentDescription}
          />
          
          {/* Record Voice Option */}
          <View style={styles.recordContainer}>
            <TouchableOpacity
              style={[
                styles.recordButton,
                isRecording && styles.recordingActive
              ]}
              onPress={isRecording ? stopRecording : startRecording}
            >
              <Ionicons 
                name={isRecording ? "stop" : "mic"} 
                size={24} 
                color="#FFF" 
              />
              <Text style={styles.recordButtonText}>
                {isRecording ? "Stop Recording" : recordingUri ? "Re-record Statement" : "Record Voice Statement"}
              </Text>
            </TouchableOpacity>
            {recordingUri && (
              <Text style={styles.recordingNote}>Voice statement recorded ✓</Text>
            )}
          </View>
        </View>
        
        {/* Add Evidence */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Add Image Evidence (Optional)</Text>
          <View style={styles.mediaButtons}>
            <TouchableOpacity style={styles.mediaButton} onPress={handleTakePhoto}>
              <Ionicons name="camera" size={24} color="#FFB5D8" />
              <Text style={styles.mediaButtonText}>Take Photo</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.mediaButton} onPress={handlePickImage}>
              <Ionicons name="image" size={24} color="#FFB5D8" />
              <Text style={styles.mediaButtonText}>Upload Image</Text>
            </TouchableOpacity>
          </View>
          
          {/* Image Preview */}
          {images.length > 0 && (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.imagePreviewContainer}
            >
              {images.map((uri, index) => (
                <View key={index} style={styles.imagePreview}>
                  <Image source={{ uri }} style={styles.previewImage} />
                  <TouchableOpacity 
                    style={styles.removeImageButton}
                    onPress={() => handleRemoveImage(index)}
                  >
                    <Ionicons name="close-circle" size={24} color="#FF4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
        
        {/* Submit Button */}
        <TouchableOpacity
          style={styles.submitButton}
          onPress={submitIncidentReport}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <>
              <Ionicons name="paper-plane" size={20} color="#FFF" />
              <Text style={styles.submitButtonText}>Submit Report</Text>
            </>
          )}
        </TouchableOpacity>
      </KeyboardAvoidingView>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {reportSubmitted ? "Incident Submitted" : "Report an Incident"}
        </Text>
        <View style={styles.headerRight} />
      </View>

      // Replace the current ScrollView with this enhanced version
<KeyboardAwareScrollView 
  style={styles.scrollView}
  contentContainerStyle={styles.scrollContent}
  keyboardShouldPersistTaps="handled"
  showsVerticalScrollIndicator={true}
  enableOnAndroid={true}
  extraScrollHeight={Platform.OS === 'ios' ? 80 : 120}
  enableResetScrollToCoords={false}
>
  {reportSubmitted ? renderSuccessView() : renderFormView()}
</KeyboardAwareScrollView>
      
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FFB5D8" />
          <Text style={styles.loadingText}>Processing...</Text>
        </View>
      )}
    </SafeAreaView>
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
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  backButton: {
    padding: 8,
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  formContainer: {
    padding: 16,
  },
  formSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  typeButtonsContainer: {
    paddingRight: 16,
  },
  typeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#F0F0F0',
  },
  selectedTypeButton: {
    backgroundColor: '#FFB5D8',
  },
  typeButtonText: {
    color: '#666',
    fontWeight: '500',
  },
  selectedTypeButtonText: {
    color: '#FFF',
  },
  priorityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  priorityButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedPriorityButton: {
    borderWidth: 2,
    borderColor: '#333',
  },
  priorityButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
  locationDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    padding: 12,
    borderRadius: 8,
  },
  locationText: {
    marginLeft: 8,
    color: '#333',
    flex: 1,
  },
  refreshButton: {
    padding: 4,
  },
  descriptionInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    height: 120,
    textAlignVertical: 'top',
    backgroundColor: '#F9F9F9',
  },
  recordContainer: {
    marginTop: 12,
    alignItems: 'center',
  },
  recordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFB5D8',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
  },
  recordingActive: {
    backgroundColor: '#FF4444',
  },
  recordButtonText: {
    color: '#FFF',
    fontWeight: '600',
    marginLeft: 8,
  },
  recordingNote: {
    marginTop: 8,
    color: '#4CAF50',
    fontWeight: '500',
  },
  mediaButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  mediaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    padding: 12,
    borderRadius: 8,
    width: '48%',
    justifyContent: 'center',
  },
  mediaButtonText: {
    marginLeft: 8,
    color: '#333',
    fontWeight: '500',
  },
  imagePreviewContainer: {
    paddingVertical: 8,
  },
  imagePreview: {
    width: 100,
    height: 100,
    marginRight: 8,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
  },
  submitButton: {
    backgroundColor: '#FFB5D8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  submitButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
    fontWeight: '600',
  },
  successContainer: {
    padding: 16,
  },
  successHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  successIcon: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 18,
    color: '#666',
  },
  incidentDetailsCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  incidentDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    width: 100,
    fontWeight: '600',
    color: '#666',
  },
  detailValue: {
    flex: 1,
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 12,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 12,
  },
  descriptionContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  descriptionText: {
    marginTop: 8,
    color: '#333',
    lineHeight: 20,
  },
  evidenceContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  evidenceImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginTop: 8,
  },
  audioEvidenceContainer: {
    marginTop: 8,
  },
  audioPlayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  audioPlayText: {
    marginLeft: 8,
    color: '#333',
    fontWeight: '500',
  },
  successActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  shareButton: {
    flex: 1,
    backgroundColor: '#FFB5D8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  newReportButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    marginLeft: 8,
  },
  actionButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    marginLeft: 8,
  }
});

export default IncidentReportScreen;