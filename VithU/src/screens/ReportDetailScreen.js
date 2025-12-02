import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  Image
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';

const ReportDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { report } = route.params || {};
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Audio playback states
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackStatus, setPlaybackStatus] = useState(null);

  useEffect(() => {
    // Clean up sound object when component unmounts
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  if (!report) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Report Details</Text>
          <View style={styles.headerRight} />
        </View>
        
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={64} color="#FF4444" />
          <Text style={styles.errorText}>Report not found or has been deleted</Text>
          <TouchableOpacity 
            style={styles.backHomeButton}
            onPress={() => navigation.navigate('ReportsHistory')}
          >
            <Text style={styles.backHomeText}>Back to Reports</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const getStatusColor = () => {
    switch (report.status) {
      case 'Submitted':
        return '#4CAF50';
      case 'Draft':
        return '#FFB5D8';
      case 'Processing':
        return '#FF9800';
      default:
        return '#666';
    }
  };

  const shareReport = async () => {
    try {
      setLoading(true);
      
      // Generate PDF filename
      const filename = `Report_${report.id}_${new Date().getTime()}.txt`;
      const filePath = `${FileSystem.documentDirectory}${filename}`;
      
      // Write report content to file
      await FileSystem.writeAsStringAsync(filePath, report.reportText);
      
      // Share the file
      await Sharing.shareAsync(filePath);
    } catch (error) {
      console.error('Error sharing report:', error);
      Alert.alert('Error', 'Could not share the report');
    } finally {
      setLoading(false);
    }
  };

  const submitReport = async () => {
    if (report.status === 'Submitted') {
      Alert.alert('Already Submitted', 'This report has already been submitted to authorities.');
      return;
    }
    
    Alert.alert(
      'Submit Report',
      'This will submit your report directly to law enforcement. Continue?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Submit',
          onPress: async () => {
            try {
              setSubmitting(true);
              
              // In a real app, you would make an API call to submit the report
              // Here we'll simulate the process with a timeout
              await new Promise(resolve => setTimeout(resolve, 2000));
              
              // Update the report status in local storage
              const reportsJson = await AsyncStorage.getItem('incident_reports');
              if (reportsJson) {
                const reports = JSON.parse(reportsJson);
                const updatedReports = reports.map(r => {
                  if (r.id === report.id) {
                    return { ...r, status: 'Submitted' };
                  }
                  return r;
                });
                
                await AsyncStorage.setItem('incident_reports', JSON.stringify(updatedReports));
              }
              
              // Update the current report
              report.status = 'Submitted';
              
              Alert.alert(
                'Report Submitted',
                'Your report has been submitted successfully. An officer will contact you for follow-up.',
                [
                  {
                    text: 'OK'
                  }
                ]
              );
            } catch (error) {
              console.error('Error submitting report:', error);
              Alert.alert('Submission Failed', 'Could not submit your report. Please try again later.');
            } finally {
              setSubmitting(false);
            }
          }
        }
      ]
    );
  };

  const editReport = () => {
    // In a real app, this would navigate to the edit report screen
    // For now, just show a message
    Alert.alert('Feature Coming Soon', 'Report editing will be available in the next update.');
  };

  // Function to handle audio playback
  const handlePlayAudio = async () => {
    // Check if we have the audio URI in the report
    const audioUri = report.evidence?.recordingUri;
    
    if (!audioUri) {
      Alert.alert('Audio Unavailable', 'The audio recording is not available.');
      return;
    }
    
    try {
      // If already playing, stop the playback
      if (isPlaying && sound) {
        await sound.stopAsync();
        setIsPlaying(false);
        return;
      }
      
      // Load the sound object if not already loaded
      if (!sound) {
        console.log('Loading sound file:', audioUri);
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: audioUri },
          { shouldPlay: true },
          onPlaybackStatusUpdate
        );
        
        setSound(newSound);
        setIsPlaying(true);
      } else {
        // If sound is already loaded but not playing, play it
        await sound.playAsync();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      Alert.alert('Playback Error', 'There was a problem playing the audio recording.');
    }
  };
  
  // Function to update playback status
  const onPlaybackStatusUpdate = (status) => {
    setPlaybackStatus(status);
    
    // When playback finishes
    if (status.didJustFinish) {
      setIsPlaying(false);
    }
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
        <Text style={styles.headerTitle}>Report Details</Text>
        <TouchableOpacity 
          style={styles.headerAction}
          onPress={shareReport}
        >
          <Ionicons name="share-outline" size={24} color="#FFB5D8" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.reportContainer}>
          {/* Report Header */}
          <View style={styles.reportHeader}>
            <Text style={styles.reportTitle}>{report.title}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
              <Text style={styles.statusText}>{report.status}</Text>
            </View>
          </View>
          
          <Text style={styles.reportDate}>{report.createdAt}</Text>
          
          {/* Report ID */}
          <View style={styles.idContainer}>
            <Text style={styles.idLabel}>Report ID:</Text>
            <Text style={styles.idValue}>{report.id}</Text>
          </View>
          
          {/* Report Content */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>INCIDENT SUMMARY</Text>
            <Text style={styles.sectionContent}>{report.summary}</Text>
          </View>
          
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>LOCATION</Text>
            <Text style={styles.sectionContent}>{report.location}</Text>
            
            {/* Map placeholder - in a real app you would add an actual map component */}
            <View style={styles.mapPlaceholder}>
              <Ionicons name="map-outline" size={32} color="#666" />
              <Text style={styles.mapPlaceholderText}>Map View</Text>
            </View>
          </View>
          
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>INCIDENT DETAILS</Text>
            <Text style={styles.sectionContent}>{report.details}</Text>
          </View>
          
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>EVIDENCE</Text>
            <Text style={styles.sectionContent}>
              • {report.evidence.images} Photo(s) attached
              {report.evidence.audioStatement && '\n• Audio statement recording attached'}
            </Text>
            
            {/* Evidence preview placeholders */}
            {report.evidence.images > 0 && (
              <View style={styles.evidencePreview}>
                {[...Array(Math.min(report.evidence.images, 3))].map((_, index) => (
                  <View key={index} style={styles.imagePlaceholder}>
                    <Ionicons name="image" size={32} color="#666" />
                  </View>
                ))}
                {report.evidence.images > 3 && (
                  <View style={styles.moreImagesIndicator}>
                    <Text style={styles.moreImagesText}>+{report.evidence.images - 3}</Text>
                  </View>
                )}
              </View>
            )}
            
            {report.evidence.audioStatement && (
              <View style={styles.audioPreview}>
                <Ionicons name="mic" size={24} color="#FFB5D8" />
                <Text style={styles.audioText}>Audio Statement</Text>
                <TouchableOpacity 
                  style={[styles.playButton, isPlaying && styles.pauseButton]}
                  onPress={handlePlayAudio}
                >
                  <Ionicons 
                    name={isPlaying ? "pause" : "play"} 
                    size={18} 
                    color="#FFF" 
                  />
                </TouchableOpacity>
              </View>
            )}
          </View>
          
          {/* Full Report Text Display */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>FULL REPORT</Text>
            <View style={styles.fullReportContainer}>
              <Text style={styles.fullReportText}>{report.reportText}</Text>
            </View>
          </View>
          
          {/* Report Status Section */}
          <View style={styles.statusSection}>
            <Text style={styles.statusTitle}>REPORT STATUS</Text>
            <View style={styles.statusBar}>
              <View style={[
                styles.statusStep, 
                { backgroundColor: '#FFB5D8' }
              ]}>
                <Text style={styles.statusStepText}>Draft</Text>
              </View>
              <View style={[
                styles.statusConnector,
                report.status !== 'Draft' && { backgroundColor: '#FFB5D8' }
              ]} />
              <View style={[
                styles.statusStep, 
                report.status !== 'Draft' && { backgroundColor: '#FFB5D8' }
              ]}>
                <Text style={styles.statusStepText}>Submitted</Text>
              </View>
              <View style={[
                styles.statusConnector,
                report.status === 'Processing' && { backgroundColor: '#FFB5D8' }
              ]} />
              <View style={[
                styles.statusStep, 
                report.status === 'Processing' && { backgroundColor: '#FFB5D8' }
              ]}>
                <Text style={styles.statusStepText}>Processing</Text>
              </View>
            </View>
          </View>
          
          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {report.status === 'Draft' && (
              <>
                <TouchableOpacity 
                  style={styles.editButton}
                  onPress={editReport}
                >
                  <Ionicons name="create-outline" size={20} color="#FFF" />
                  <Text style={styles.buttonText}>Edit Report</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.submitButton}
                  onPress={submitReport}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <>
                      <Ionicons name="send" size={20} color="#FFF" />
                      <Text style={styles.buttonText}>Submit Report</Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            )}
            
            {report.status === 'Submitted' && (
              <TouchableOpacity 
                style={styles.followUpButton}
                onPress={() => Alert.alert('Feature Coming Soon', 'Follow-up requests will be available in the next update.')}
              >
                <Ionicons name="chatbubble-outline" size={20} color="#FFF" />
                <Text style={styles.buttonText}>Request Follow-up</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
      
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
  headerAction: {
    padding: 8,
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  reportContainer: {
    padding: 16,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reportTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  reportDate: {
    color: '#666',
    fontSize: 14,
    marginBottom: 16,
  },
  idContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
  },
  idLabel: {
    fontWeight: '600',
    marginRight: 8,
  },
  idValue: {
    flex: 1,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
  },
  sectionContent: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  mapPlaceholder: {
    height: 150,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    marginTop: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapPlaceholderText: {
    marginTop: 8,
    color: '#666',
  },
  evidencePreview: {
    flexDirection: 'row',
    marginTop: 12,
  },
  imagePlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreImagesIndicator: {
    width: 80,
    height: 80,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreImagesText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  audioPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  audioText: {
    flex: 1,
    marginLeft: 12,
    fontWeight: '500',
  },
  playButton: {
    backgroundColor: '#FFB5D8',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pauseButton: {
    backgroundColor: '#FF4444',
  },
  fullReportContainer: {
    backgroundColor: '#F9F9F9',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  fullReportText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  statusSection: {
    marginBottom: 32,
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 16,
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusStep: {
    width: 80,
    paddingVertical: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 16,
    alignItems: 'center',
  },
  statusStepText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  statusConnector: {
    height: 2,
    flex: 1,
    backgroundColor: '#E0E0E0',
  },
  actionButtons: {
    marginTop: 16,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFB5D8',
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 8,
  },
  followUpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#FFF',
    fontWeight: '600',
    marginLeft: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
    color: '#666',
  },
  backHomeButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFB5D8',
    borderRadius: 25,
  },
  backHomeText: {
    color: '#FFF',
    fontWeight: '600',
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
});

export default ReportDetailScreen;